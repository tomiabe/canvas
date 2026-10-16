import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from './index';

test('custom-domain and legacy clients receive CORS headers, but unrelated sites do not', async () => {
  const env = { AI: { run: async () => { throw new Error('This request must not invoke an AI model'); } } };
  for (const origin of ['https://canvas.tomiabe.com', 'https://tomiabe.github.io', 'https://unrelated.example']) {
    const allowed = origin !== 'https://unrelated.example' ? origin : '';
    const preflight = await worker.fetch(new Request('https://canvas.tomi.workers.dev', {
      method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Content-Type' },
    }), env);
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), allowed);
    assert.match(preflight.headers.get('Access-Control-Allow-Methods')!, /POST/);

    // Error responses must also be readable by the app, not masked by a CORS failure.
    const response = await worker.fetch(new Request('https://canvas.tomi.workers.dev', {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}',
    }), env);
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), allowed);
  }
});
