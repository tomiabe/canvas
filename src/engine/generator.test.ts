import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { generateHtml } from './generator';
import { templates } from '../templates';

test('addon selection uses only pinned allowlisted URLs and preserves the legacy runtime', () => {
  const base = { templateId: 'custom-sketch', seed: 1, params: { code: 'function draw() {}' } };
  const legacy = generateHtml(base);
  assert.match(legacy, /p5.js\/1.9.0\/p5.min.js/);
  assert.doesNotMatch(legacy, /npm\/p5\.(brush|grain)/);
  const selected = generateHtml({ ...base, libraries: ['brush', 'grain', 'brush'] });
  assert.match(selected, /p5.js\/1.11.3\/p5.min.js/);
  assert.equal(selected.split('p5.brush@1.1.4/dist/p5.brush.js').length, 2);
  assert.match(selected, /p5.grain@0.8.0\/dist\/p5.grain.min.js/);
  const grain = generateHtml({ ...base, libraries: ['grain'] });
  assert.match(grain, /p5.js\/1.9.0\/p5.min.js/);
  assert.doesNotMatch(generateHtml({ ...base, libraries: ['https://evil.invalid/x.js'] as any }), /evil.invalid/);
});

test('painterly starters are additive, seeded, live and inherit addon metadata in old configs', () => {
  assert.ok(Object.keys(templates).length >= 53);
  assert.ok(templates['brush-playground']);
  for (const id of ['watercolor-garden', 'charcoal-landscape', 'ink-flow']) {
    const template = templates[id];
    const params = Object.fromEntries(template.params.map(p => [p.id, p.default]));
    assert.deepEqual(template.libraries, ['brush', 'grain']);
    assert.equal(template.supportsLiveParams, true);
    const config = { templateId: id, seed: 41, params };
    const html = generateHtml(config);
    assert.equal(html, generateHtml(config));
    assert.match(html, /brush.seed\(41\)/);
    assert.match(html, /params-update/);
    assert.match(html, /p5.brush@1.1.4/);
    assert.doesNotMatch(generateHtml({ ...config, libraries: [] }), /npm\/p5\.(brush|grain)/);
  }
});

test('exported custom sketch keeps its live values and accepts updates without restarting its state', () => {
  const html = generateHtml({
    templateId: 'custom-sketch', seed: 41,
    params: {
      speed: 2.5, color: '#2148ff', enabled: false, shape: 'square',
      code: `var distance = 0;
        function setup() { distance = 10; }
        function draw() { distance += params.speed; output(distance, params.color, params.enabled, params.shape); }`,
    },
  }, 'run-41');
  const listeners: Record<string, Function[]> = {};
  const messages: any[] = [];
  const parent = { postMessage: (message: any) => messages.push(message) };
  const frames: unknown[][] = [];
  const context: any = {
    parent,
    document: { querySelector: () => ({}) },
    addEventListener: (name: string, handler: Function) => (listeners[name] ??= []).push(handler),
    output: (...values: unknown[]) => frames.push(values),
    randomSeed() {}, noiseSeed() {},
  };
  context.window = context;
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
  runInNewContext(script, context);
  context.setup();
  context.draw();
  for (const listener of listeners.message) {
    listener({ source: parent, data: { type: 'params-update', params: { speed: 0.5, color: '#ff7021', enabled: true, shape: 'circle' } } });
  }
  context.draw();
  assert.deepEqual(frames, [[12.5, '#2148ff', false, 'square'], [13, '#ff7021', true, 'circle']]);
  assert.equal(messages.filter(m => m.type === 'sketch-ready').length, 1);
  assert.equal(messages[0].runId, 'run-41');
  context.onerror('broken draw');
  assert.equal(messages.at(-1).type, 'sketch-error');
  assert.equal(messages.at(-1).message, 'broken draw');
});

test('preview stops runaway loops but preserves nested loops, labels and repeated frames', () => {
  for (const loop of ['for(let i=0;i=150;i++) {}', 'while(true);', 'do {} while(true);']) {
    const html = generateHtml({ templateId: 'custom-sketch', seed: 1, params: { code: `function draw(){${loop}}` } });
    let clock = 0;
    const context: any = { performance: { now: () => clock++ }, addEventListener() {} };
    context.window = context;
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
    runInNewContext(script, context);
    assert.throws(() => runInNewContext('draw()', context, { timeout: 1000 }), /Sketch loop exceeded 100ms/);
  }

  const html = generateHtml({ templateId: 'custom-sketch', seed: 1, params: { code: `
    var result = 0;
    function draw() {
      outer: for(let i=0;i<3;i++) for(let j=0;j<4;j++) { if(j===2) continue outer; result++; }
      for(const n of [2, 5]) result += n;
      for(const key in {a: 1, b: 2}) result++;
      let n=0; do { n++; } while(n<2);
      while(n<4) n++;
      result += n;
    }` } });
  let clock = 0;
  const context: any = {
    performance: { now: () => clock++ }, addEventListener() {},
    document: { querySelector: () => ({}) }, parent: { postMessage() {} },
  };
  context.window = context;
  runInNewContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n'), context);
  for (let frame = 0; frame < 100; frame++) context.draw();
  assert.equal(context.result, 1900);
});

test('brush strokes have a bounded painting budget without weakening ordinary loop protection', () => {
  const execute = (brush: boolean, code: string, context: any) => {
    const html = generateHtml({ templateId: 'custom-sketch', seed: 1, params: { code }, libraries: brush ? ['brush'] : [] });
    context.window = context;
    context.addEventListener = () => {};
    context.document = { querySelector: () => ({}) };
    context.parent = { postMessage() {} };
    runInNewContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n'), context);
    runInNewContext('draw()', context, { timeout: 1000 });
  };
  for (const brush of [false, true]) {
    let clock = 0;
    let strokes = 0;
    const paint = () => execute(brush, 'function draw(){for(let i=0;i<5;i++) stroke()}', {
      performance: { now: () => clock }, stroke: () => { clock += 90; strokes++; },
    });
    if (brush) { paint(); assert.equal(strokes, 5); }
    else assert.throws(paint, /exceeded 100ms/);
    clock = 0;
    assert.throws(() => execute(brush, 'function draw(){while(true){}}', {
      performance: { now: () => clock++ },
    }), brush ? /exceeded 500ms/ : /exceeded 100ms/);
  }
});

test('GIF export preserves whether the artwork was static or animated', async () => {
  for (const initiallyLooping of [false, true]) {
    let looping = initiallyLooping;
    const listeners: Function[] = [];
    const html = generateHtml({ templateId: 'custom-sketch', seed: 1, params: { code: 'function draw() {}' } });
    const context: any = {
      addEventListener: (name: string, handler: Function) => { if (name === 'message') listeners.push(handler); },
      isLooping: () => looping,
      noLoop: () => { looping = false; },
      // p5's asynchronous encoder restarts animation when finishing capture.
      saveGif: async () => { await Promise.resolve(); looping = true; },
    };
    context.window = context;
    runInNewContext([...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n'), context);
    for (const handler of listeners) handler({ data: { type: 'export', exportType: 'gif' } });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(looping, initiallyLooping);
  }
});
