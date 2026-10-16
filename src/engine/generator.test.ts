import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { generateHtml } from './generator';

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
