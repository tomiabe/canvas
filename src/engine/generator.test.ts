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
  });
  const listeners: Record<string, Function[]> = {};
  const parent = {};
  const frames: unknown[][] = [];
  const context: any = {
    parent,
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
});
