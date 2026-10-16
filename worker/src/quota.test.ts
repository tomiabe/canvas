import assert from 'node:assert/strict';
import { randomUUID, webcrypto } from 'node:crypto';
import { test } from 'node:test';
import worker, { type Env, QuotaLimiter } from './index';
import { type Storage } from './quota';

if (!globalThis.crypto) Object.defineProperty(globalThis, 'crypto', { value: webcrypto });

// Durable storage fake: cloned reads/writes, serialized atomic transactions, and
// a fresh DO instance on every RPC to detect accidental process-local accounting.
class DurableStorage implements Storage {
  values = new Map<string, unknown>();
  private tail: Promise<unknown> = Promise.resolve();
  async get<T>(key: string) { return structuredClone(this.values.get(key)) as T | undefined; }
  async put(key: string, value: unknown) { this.values.set(key, structuredClone(value)); }
  transaction<T>(callback: (storage: Storage) => Promise<T>): Promise<T> {
    const next = this.tail.then(async () => {
      const snapshot = structuredClone(this.values);
      try { return await callback(this); }
      catch (error) { this.values = snapshot; throw error; }
    });
    this.tail = next.catch(() => {});
    return next;
  }
}

function fixture(cap = 100) {
  const storage = new DurableStorage();
  let calls = 0;
  const env: Env = {
    GLOBAL_DAILY_ATTEMPT_LIMIT: String(cap),
    AI: { run: async () => { calls++; return { response: 'ok' }; } },
    QUOTAS: {
      idFromName(name) { assert.equal(name, 'global'); return name; },
      get() { return { fetch: request => new QuotaLimiter({ storage }, env).fetch(request) }; },
    },
  };
  const send = (id: string = randomUUID(), ip = '192.0.2.1', overrides = {}) => worker.fetch(new Request('https://worker/', {
    method: 'POST', headers: { 'CF-Connecting-IP': ip, Origin: 'http://localhost:31235' },
    body: JSON.stringify({ submissionId: id, messages: [{ role: 'user', content: 'hello' }], ...overrides }),
  }), env);
  const usage = (ip = '192.0.2.1') => worker.fetch(new Request('https://worker/usage', { headers: { 'CF-Connecting-IP': ip } }), env);
  return { env, storage, send, usage, calls: () => calls };
}

test('HTTP usage, success, repair cap, identity binding, and CORS', async () => {
  const f = fixture();
  assert.deepEqual((await (await f.usage()).json()).usage.remaining, 10);
  const id = randomUUID();
  for (let i = 0; i < 3; i++) {
    const response = await f.send(i === 1 ? id.toUpperCase() : id);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:31235');
    const body = await response.json();
    assert.equal(body.usage.remaining, 9);
    assert.equal(body.choices[0].message.content, 'ok');
  }
  const denied = await f.send(id);
  assert.equal(denied.status, 429);
  assert.ok(Number(denied.headers.get('Retry-After')) > 0);
  assert.match((await denied.json()).error, /two repairs/);
  assert.equal(f.calls(), 3);
  assert.equal((await (await f.send(id, '192.0.2.2')).json()).usage.remaining, 9);
  assert.ok(!JSON.stringify([...f.storage.values]).includes('192.0.2.'));
});

test('parallel same-ID repairs and new-submission burst cannot overshoot', async () => {
  const f = fixture();
  const id = randomUUID();
  const repairs = await Promise.all(Array.from({ length: 20 }, () => f.send(id)));
  assert.equal(repairs.filter(r => r.status === 200).length, 3);
  assert.equal(repairs.filter(r => r.status === 429).length, 17);
  assert.equal(f.calls(), 3);
  const g = fixture();
  const submissions = await Promise.all(Array.from({ length: 20 }, () => g.send()));
  assert.equal(submissions.filter(r => r.status === 200).length, 3);
  assert.equal(submissions.filter(r => r.status === 429).length, 17);
  const usage = (await (await g.usage()).json()).usage;
  assert.equal(usage.remaining, 7);
  assert.equal(usage.reason, 'burst');
  assert.ok(Date.parse(usage.retryAt) > Date.now());
});

test('parallel visitors respect global provider-attempt cap', async () => {
  const f = fixture(7);
  const responses = await Promise.all(Array.from({ length: 30 }, (_, i) => f.send(randomUUID(), `192.0.2.${i}`)));
  assert.equal(responses.filter(r => r.status === 200).length, 7);
  assert.equal(responses.filter(r => r.status === 429).length, 23);
  assert.equal(f.calls(), 7);
  assert.equal((await (await f.usage()).json()).usage.reason, 'global');
});

test('daily allowance and UTC reset survive fresh DO instances', async () => {
  const original = Date.now;
  let now = Date.parse('2026-10-16T23:00:00Z');
  Date.now = () => now;
  try {
    const f = fixture();
    const id = randomUUID();
    for (let i = 0; i < 10; i++) {
      assert.equal((await f.send(i === 0 ? id : randomUUID())).status, 200);
      now += 61000;
    }
    const denied = await f.send();
    assert.equal(denied.status, 429);
    assert.deepEqual((await denied.json()).usage, {
      limit: 10, remaining: 0, resetsAt: '2026-10-17T00:00:00.000Z', reason: 'daily', retryAt: '2026-10-17T00:00:00.000Z',
    });
    // Repairs still work after all ten new submissions are consumed.
    assert.equal((await f.send(id)).status, 200);
    now = Date.parse('2026-10-17T00:00:00Z');
    assert.equal((await (await f.usage()).json()).usage.remaining, 10);
    assert.equal((await (await f.send(id)).json()).usage.remaining, 9);
    assert.equal(f.calls(), 12);
    const g = fixture(1);
    assert.equal((await g.send()).status, 200);
    assert.equal((await g.send()).status, 429);
    now += 86400000;
    assert.equal((await (await g.usage()).json()).usage.reason, undefined);
    assert.equal((await g.send()).status, 200);
    assert.equal(g.calls(), 2);
  } finally { Date.now = original; }
});

test('fallbacks each reserve global budget and stop before unbudgeted network calls', async () => {
  const original = globalThis.fetch;
  let upstream = 0;
  globalThis.fetch = async () => { upstream++; return new Response('failed', { status: 500 }); };
  try {
    const f = fixture(2);
    f.env.GEMINI_API_KEY = 'test-only';
    const denied = await f.send();
    assert.equal(denied.status, 429);
    assert.equal((await denied.json()).usage.reason, 'global');
    assert.equal(upstream, 2);
    assert.equal(f.calls(), 0);
    const g = fixture(3);
    g.env.GEMINI_API_KEY = 'test-only';
    const success = await g.send();
    assert.equal(success.status, 200);
    const body = await success.json();
    assert.equal(body.provider, 'workers-ai');
    assert.equal(body.usage.reason, 'global');
    assert.equal(g.calls(), 1);
    assert.equal((await g.send()).status, 429);
    assert.equal(upstream, 4);
  } finally { globalThis.fetch = original; }
});

test('invalid, oversized, and malformed input never consumes allowance', async () => {
  const f = fixture();
  for (const overrides of [
    { submissionId: 'bad' }, { messages: [] }, { messages: [{ role: 'bogus', content: 'x' }] },
    { messages: [{ role: 'user', content: 'x'.repeat(32769) }] },
    { messages: Array.from({ length: 33 }, () => ({ role: 'user', content: 'x' })) },
    { temperature: -1 }, { temperature: '1' }, { max_tokens: 4097 }, { max_tokens: 1.5 },
    { response_format: null }, { extra: 'x'.repeat(70000) },
  ]) assert.equal((await f.send(randomUUID(), '192.0.2.1', overrides)).status, 400);
  for (const body of ['null', '{', '[]']) {
    assert.equal((await worker.fetch(new Request('https://worker/', { method: 'POST', body }), f.env)).status, 400);
  }
  assert.equal(f.calls(), 0);
  assert.equal(f.storage.values.size, 0);
  assert.equal((await (await f.usage()).json()).usage.remaining, 10);
});

test('missing identity, binding, storage failures fail closed with readable errors', async () => {
  for (const failure of ['identity', 'binding', 'storage', 'attempt']) {
    const f = fixture();
    if (failure === 'binding') delete f.env.QUOTAS;
    if (failure === 'storage') f.storage.get = async () => { throw new Error('unavailable'); };
    if (failure === 'attempt') {
      const put = f.storage.put.bind(f.storage);
      let writes = 0;
      f.storage.put = async (key, value) => {
        if (++writes === 2) throw new Error('unavailable');
        await put(key, value);
      };
    }
    const response = failure === 'identity'
      ? await worker.fetch(new Request('https://worker/usage'), f.env)
      : await f.send();
    assert.equal(response.status, 503);
    assert.match((await response.json()).error, /temporarily unavailable/);
    assert.equal(f.calls(), 0);
  }
});
