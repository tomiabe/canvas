import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ArtworkVersion, ConversationTurn, createStudio, loadStudio, saveStudio, studioReducer } from './studio';

const version = (id: string, speed: number, createdAt: number, conversation: ConversationTurn[] = []): ArtworkVersion => ({
  id, label: id, createdAt, conversation,
  config: {
    templateId: 'custom-sketch', seed: 71, params: { code: `function draw() { circle(23, 47, ${speed}); }`, speed },
    libraries: ['brush', 'grain'],
    generated: { title: id, controls: [{ id: 'speed', name: 'Speed', type: 'number', default: speed, min: 0, max: 100, step: 1 }] },
  },
});

test('five edits survive reload, undo/redo, and branching without losing old versions or conversation', () => {
  let state = createStudio();
  let conversation: ConversationTurn[] = [];
  for (let i = 1; i <= 6; i++) {
    conversation = [...conversation, { role: 'user', content: `edit ${i}` }, { role: 'assistant', content: `result ${i}` }];
    state = studioReducer(state, { type: 'commit', version: version(`v${i}`, i * 3, i * 1000, conversation) });
  }
  const data = new Map<string, string>();
  const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
  saveStudio(storage, state);
  state = loadStudio(storage);
  assert.equal(state.versions.at(-1)!.config.seed, 71);
  assert.deepEqual(state.versions.at(-1)!.config.libraries, ['brush', 'grain']);
  assert.equal(state.versions.at(-1)!.config.generated!.controls[0].max, 100);
  state = studioReducer(state, { type: 'undo' });
  assert.equal(state.currentId, 'v5');
  assert.equal(state.versions.find(v => v.id === state.currentId)!.config.params.speed, 15);
  assert.equal(state.versions.find(v => v.id === state.currentId)!.conversation.at(-2)?.content, 'edit 5');
  state = studioReducer(state, { type: 'redo' });
  assert.equal(state.currentId, 'v6');
  state = studioReducer(state, { type: 'restore', id: 'v2' });
  assert.equal(state.versions.find(v => v.id === state.currentId)!.conversation.length, 4);
  state = studioReducer(state, { type: 'commit', version: version('branch', 43, 9000) });
  state = studioReducer(state, { type: 'undo' });
  assert.equal(state.currentId, 'v2');
  assert.equal(state.versions.find(v => v.id === 'v6')!.config.params.speed, 18);
  state = studioReducer(state, { type: 'restore', id: 'v6' });
  assert.deepEqual(state.versions.find(v => v.id === state.currentId)!.conversation, conversation);
  assert.equal(state.versions.length, 8);
});

test('a continuous control edit is one undo step, but a new control, pause, or restore starts another', () => {
  let state = createStudio();
  const initialId = state.currentId;
  state = studioReducer(state, { type: 'commit', version: version('start', 1, 1000) });
  state = studioReducer(state, { type: 'commit', version: version('drag', 2, 1100), group: 'speed' });
  state = studioReducer(state, { type: 'commit', version: version('drag-next', 4, 1799), group: 'speed' });
  assert.equal(state.versions.length, 3);
  assert.equal(state.versions.at(-1)!.config.params.speed, 4);
  const afterDrag = state;
  state = studioReducer(state, { type: 'undo' });
  assert.equal(state.currentId, 'start');
  state = studioReducer(state, { type: 'redo' });
  assert.equal(state.versions.find(v => v.id === state.currentId)!.config.params.speed, 4);
  state = afterDrag;
  state = studioReducer(state, { type: 'commit', version: version('paused', 8, 2499), group: 'speed' });
  assert.equal(state.versions.length, 4);
  state = studioReducer(state, { type: 'commit', version: version('other', 9, 2500), group: 'color' });
  assert.equal(state.versions.length, 5);
  state = studioReducer(state, { type: 'restore', id: 'start' });
  state = studioReducer(state, { type: 'commit', version: version('branch', 10, 2501), group: 'speed' });
  assert.equal(state.versions.length, 6);
  assert.deepEqual(state.redo, []);
  assert.equal(state.versions[0].id, initialId);
});

test('a late preview failure restores the previous complete version and cannot be restored as healthy', () => {
  let state = createStudio();
  const conversation: ConversationTurn[] = [{ role: 'user', content: 'pink on black' }];
  state = studioReducer(state, { type: 'commit', version: version('good', 3, 1000, conversation) });
  state = studioReducer(state, { type: 'commit', version: version('bad', 19, 2000, [...conversation, { role: 'user', content: 'too complex' }]) });
  state = studioReducer(state, { type: 'reject', id: 'bad', fallbackId: 'good', error: 'runtime failure' });
  assert.equal(state.currentId, 'good');
  assert.deepEqual(state.versions.find(v => v.id === state.currentId)!.conversation, conversation);
  assert.deepEqual(state.redo, []);
  assert.equal(studioReducer(state, { type: 'restore', id: 'bad' }).currentId, 'good');
  assert.equal(state.versions.find(v => v.id === 'bad')!.error, 'runtime failure');
});

test('corrupt or inaccessible storage is reported, not silently replaced', () => {
  let writes = 0;
  const storage = { getItem: () => '{truncated', setItem: () => { writes++; } };
  assert.throws(() => loadStudio(storage));
  assert.equal(writes, 0);
  assert.throws(() => loadStudio({ ...storage, getItem: () => { throw new Error('Storage access denied'); } }));
  const state = createStudio();
  assert.throws(() => loadStudio({ ...storage, getItem: () => JSON.stringify({ ...state, currentId: 'missing' }) }));
  assert.throws(() => saveStudio({ ...storage, setItem: () => { throw new Error('Quota exceeded'); } }, state));
});
