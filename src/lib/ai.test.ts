import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AIServiceError, generateConfigFromPrompt } from './ai';
import { ParamDef, SketchConfig } from '../types';

const empty: SketchConfig = { templateId: '', seed: 37, params: {} };
const sketch: { title: string; code: string; params: ParamDef[] } = {
  title: 'Pink Orbit',
  code: 'function setup() { createCanvas(windowWidth, windowHeight); } function draw() { background(params.color); circle(frameCount * params.speed, 80, 30); }',
  params: [
    { id: 'speed', name: 'Speed', type: 'number', default: 1.5, min: 0, max: 4, step: 0.1 },
    { id: 'color', name: 'Color', type: 'color', default: '#e84293' },
    { id: 'trails', name: 'Trails', type: 'boolean', default: false },
    { id: 'shape', name: 'Shape', type: 'enum', default: 'square', options: ['circle', 'square'] },
  ],
};

test('generation returns original code, editable controls, and preserves live values as edit context', async t => {
  let result = sketch;
  let request: any;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    request = JSON.parse(init.body as string);
    return Response.json({ choices: [{ message: { content: JSON.stringify(result) } }] });
  });
  const generated = await generateConfigFromPrompt('pink orbit', empty);
  assert.equal(generated.templateId, 'custom-sketch');
  assert.deepEqual(generated.generated, { title: 'Pink Orbit', controls: sketch.params });
  assert.deepEqual(generated.params, { speed: 1.5, color: '#e84293', trails: false, shape: 'square', code: sketch.code });

  generated.params.speed = 2.7;
  result = { ...sketch, title: 'Blue Orbit', params: sketch.params.map(p => p.id === 'color' ? { ...p, default: '#2148ff' } : p) };
  const edited = await generateConfigFromPrompt('make it blue', generated);
  const context = JSON.parse(request.messages[1].content.split('\n').slice(1).join('\n'));
  assert.equal(context.values.speed, 2.7);
  assert.equal(context.code, sketch.code);
  assert.equal(edited.seed, generated.seed);
  assert.equal(edited.params.color, '#2148ff');

  await generateConfigFromPrompt('make it blue', edited, 'missingFunction is not defined');
  assert.match(request.messages.at(-1).content, /missingFunction is not defined/);
  assert.match(request.messages[1].content, /Blue Orbit/);
});

test('edits include bounded recent conversation plus the authoritative current code and values', async t => {
  let request: any;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    request = JSON.parse(init.body as string);
    return Response.json({ choices: [{ message: { content: JSON.stringify(sketch) } }] });
  });
  const current: SketchConfig = {
    templateId: 'custom-sketch', seed: 81, params: { code: sketch.code, speed: 2.7 },
    generated: { title: 'Restored orbit', controls: sketch.params },
  };
  const conversation = Array.from({ length: 8 }, (_, i) => [
    { role: 'user' as const, content: `instruction ${i}` },
    { role: 'assistant' as const, content: `artwork ${i}` },
  ]).flat();
  await generateConfigFromPrompt('slower, keep that palette', current, undefined, conversation);
  assert.deepEqual(request.messages.slice(1, 13), conversation.slice(4));
  const context = JSON.parse(request.messages[13].content.split('\n').slice(1).join('\n'));
  assert.equal(context.title, 'Restored orbit');
  assert.equal(context.values.speed, 2.7);
  assert.equal(context.code, sketch.code);
  assert.equal(request.messages.at(-1).content, 'slower, keep that palette');
});

test('service outages are distinguished from repairable sketch failures', async t => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'offline' }, { status: 502 }));
  await assert.rejects(generateConfigFromPrompt('orbit', empty), AIServiceError);
});

test('new artwork excludes previous visuals and conversation, while repairs retain only the new attempt', async t => {
  const requests: any[] = [];
  t.mock.method(Math, 'random', () => 0.25);
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    requests.push(JSON.parse(init.body as string));
    return Response.json({ choices: [{ message: { content: JSON.stringify({ ...sketch, title: 'Fresh fireworks', libraries: ['brush', 'grain'] }) } }] });
  });
  const old: SketchConfig = { templateId: 'custom-sketch', seed: 81, params: { code: 'oldVisualSignature()', color: '#112233' } };
  const conversation = [{ role: 'user' as const, content: 'oldConversationSignature' }];
  const options = { mode: 'new' as const, submissionId: '44bb38aa-bc17-4f01-85dd-d06a473cbbdf' };
  const fresh = await generateConfigFromPrompt('fireworks over a lake', old, undefined, conversation, options);
  assert.deepEqual(requests[0].messages.map((m: any) => m.role), ['system', 'user']);
  assert.doesNotMatch(JSON.stringify(requests[0].messages), /oldVisualSignature|oldConversationSignature|#112233/);
  assert.equal(fresh.seed, 250000);
  assert.deepEqual(fresh.libraries, ['brush', 'grain']);
  await generateConfigFromPrompt('fireworks over a lake', fresh, 'brush error', conversation, options);
  assert.equal(requests[1].submissionId, requests[0].submissionId);
  assert.doesNotMatch(JSON.stringify(requests[1].messages), /oldVisualSignature|oldConversationSignature/);
  assert.match(requests[1].messages[1].content, /Fresh fireworks/);
  assert.match(requests[1].messages[1].content, /"libraries":\["brush","grain"\]/);
});

test('quota denials update the displayed allowance and are not repairable sketch failures', async t => {
  const usage = { limit: 10, remaining: 0, resetsAt: '2026-10-17T00:00:00Z', reason: 'daily' };
  t.mock.method(globalThis, 'fetch', async () => Response.json({ error: 'AI allowance exhausted', usage }, { status: 429 }));
  let received: unknown;
  await assert.rejects(generateConfigFromPrompt('orbit', empty, undefined, [], { onUsage: value => { received = value; } }),
    error => error instanceof AIServiceError && /allowance exhausted/.test(error.message));
  assert.deepEqual(received, usage);
});

test('malformed model output is rejected instead of replacing an artwork with broken controls', async t => {
  const numeric = sketch.params[0];
  const invalid = [
    { ...sketch, code: 'function draw( {' },
    { ...sketch, title: '' },
    { ...sketch, params: [] },
    { ...sketch, libraries: ['https://untrusted.example/brush.js'] },
    { ...sketch, libraries: 'brush' },
    ...[
      { ...numeric, default: -1 },
      { ...numeric, default: 5 },
      { ...numeric, min: 4, max: 0 },
      { ...numeric, step: 0 },
      { ...numeric, default: '1' },
      { ...numeric, id: '__proto__' },
      { ...numeric, id: 'code' },
      { ...sketch.params[1], default: 'pink' },
      { ...sketch.params[2], default: 'false' },
      { ...sketch.params[3], default: 'triangle' },
      { ...numeric, type: 'unknown' },
    ].map(p => ({ ...sketch, params: [p] })),
    { ...sketch, params: [numeric, numeric] },
  ];
  let content: string;
  t.mock.method(globalThis, 'fetch', async () => Response.json({ choices: [{ message: { content } }] }));
  for (const value of invalid) {
    content = JSON.stringify(value);
    await assert.rejects(generateConfigFromPrompt('edit', empty));
  }
  content = '{truncated';
  await assert.rejects(generateConfigFromPrompt('edit', empty));
  assert.deepEqual(empty, { templateId: '', seed: 37, params: {} });
});
