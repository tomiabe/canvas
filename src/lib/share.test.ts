import assert from 'node:assert/strict';
import { test } from 'node:test';
import { templates } from '../templates';
import { SketchConfig } from '../types';
import { createShareUrl, decodeShareConfig, encodeShareConfig, sharedPayloadFromHash, validateSharedConfig } from './share';

test('all built-in templates can be shared and reopened with their default controls', async () => {
  for (const template of Object.values(templates).filter(item => item.id !== 'custom-sketch')) {
    const config: SketchConfig = {
      templateId: template.id,
      seed: 123,
      params: Object.fromEntries(template.params.map(param => [param.id, param.default])),
      ...(template.libraries ? { libraries: template.libraries } : {}),
    };
    const restored = await decodeShareConfig(await encodeShareConfig(config));
    assert.deepEqual(restored, config, template.id);
  }
});

test('a generated sketch retains code, edited controls, and addon choice in a remix URL', async () => {
  const config: SketchConfig = {
    templateId: 'custom-sketch', seed: 12, libraries: ['grain'],
    params: { speed: 2, color: '#00aaff', code: 'function setup(){createCanvas(400,400)} function draw(){background(params.color)}' },
    generated: { title: 'Blue motion', controls: [
      { id: 'speed', name: 'Speed', type: 'number', default: 1, min: 0, max: 5, step: 0.1 },
      { id: 'color', name: 'Color', type: 'color', default: '#ffffff' },
    ] },
  };
  const url = await createShareUrl(config, { origin: 'https://canvas.example', pathname: '/app', search: '?view=1' });
  assert.ok(url.startsWith('https://canvas.example/app?view=1#art='));
  assert.deepEqual(await decodeShareConfig(sharedPayloadFromHash(new URL(url).hash)!), config);
});

test('invalid and oversized remix payloads are rejected before opening', async () => {
  assert.equal(sharedPayloadFromHash('#unrelated'), null);
  await assert.rejects(decodeShareConfig('1.r.not+base64'), /invalid/);
  await assert.rejects(decodeShareConfig('1.r.' + 'a'.repeat(24001)), /invalid/);
  const template = templates['particle-system'];
  const base: SketchConfig = { templateId: template.id, seed: 1, params: Object.fromEntries(template.params.map(p => [p.id, p.default])) };
  assert.throws(() => validateSharedConfig({ ...base, params: { ...base.params, count: 999999 } }), /invalid controls/);
  assert.throws(() => validateSharedConfig({ ...base, params: { ...base.params, injected: true } }), /unexpected settings/);
  assert.throws(() => validateSharedConfig({ ...base, libraries: ['https://example.com/script.js'] }), /unsupported library/);
});
