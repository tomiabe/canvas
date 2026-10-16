import { SketchConfig } from '../types';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ArtworkVersion {
  id: string;
  config: SketchConfig;
  conversation: ConversationTurn[];
  label: string;
  createdAt: number;
  error?: string;
}

export interface StudioState {
  schema: 1;
  versions: ArtworkVersion[];
  currentId: string;
  undo: string[];
  redo: string[];
  editGroup?: { key: string; at: number };
}

export type StudioAction =
  | { type: 'commit'; version: ArtworkVersion; group?: string }
  | { type: 'undo' | 'redo' }
  | { type: 'restore'; id: string }
  | { type: 'reject'; id: string; fallbackId: string; error: string };

export const STUDIO_STORAGE_KEY = 'canvas.studio.v1';

export function createVersion(config: SketchConfig, conversation: ConversationTurn[], label: string): ArtworkVersion {
  return { id: crypto.randomUUID(), config, conversation, label, createdAt: Date.now() };
}

export function createStudio(): StudioState {
  const initial = createVersion({ templateId: '', seed: Math.floor(Math.random() * 1000000), params: {} }, [], 'New artwork');
  return { schema: 1, versions: [initial], currentId: initial.id, undo: [], redo: [] };
}

// The archive is separate from the navigation stacks: branching never deletes old work.
export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case 'commit': {
      const coalesce = action.group && action.group === state.editGroup?.key &&
        action.version.createdAt - state.editGroup.at < 700 &&
        state.versions.at(-1)?.id === state.currentId;
      const version = coalesce ? { ...action.version, id: state.currentId } : action.version;
      return {
        ...state,
        versions: coalesce ? state.versions.map(v => v.id === state.currentId ? version : v) : [...state.versions, version],
        currentId: version.id,
        undo: coalesce ? state.undo : [...state.undo, state.currentId],
        redo: [],
        editGroup: action.group ? { key: action.group, at: action.version.createdAt } : undefined,
      };
    }
    case 'undo':
    case 'redo': {
      const from = action.type;
      const to = from === 'undo' ? 'redo' : 'undo';
      const id = state[from].at(-1);
      if (!id) return state;
      return { ...state, currentId: id, [from]: state[from].slice(0, -1), [to]: [...state[to], state.currentId], editGroup: undefined };
    }
    case 'restore':
      if (action.id === state.currentId || !state.versions.some(v => v.id === action.id && !v.error)) return state;
      return { ...state, currentId: action.id, undo: [...state.undo, state.currentId], redo: [], editGroup: undefined };
    case 'reject': {
      const fallbackIndex = state.undo.lastIndexOf(action.fallbackId);
      return {
        ...state,
        versions: state.versions.map(v => v.id === action.id ? { ...v, error: action.error } : v),
        currentId: action.fallbackId,
        undo: fallbackIndex >= 0 ? state.undo.slice(0, fallbackIndex) : state.undo.filter(id => id !== action.id),
        redo: [],
        editGroup: undefined,
      };
    }
  }
}

type StudioStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function loadStudio(storage: StudioStorage): StudioState {
  const raw = storage.getItem(STUDIO_STORAGE_KEY);
  if (!raw) return createStudio();
  const state = JSON.parse(raw) as StudioState;
  if (state?.schema !== 1 || !Array.isArray(state.versions) || !state.versions.length ||
      !state.versions.every(v => v && typeof v.id === 'string' && typeof v.label === 'string' &&
        Number.isFinite(v.createdAt) && v.config && typeof v.config.templateId === 'string' &&
        Number.isFinite(v.config.seed) && v.config.params && typeof v.config.params === 'object' &&
        Array.isArray(v.conversation) && v.conversation.every(t =>
          (t.role === 'user' || t.role === 'assistant') && typeof t.content === 'string'))) {
    throw new Error('Saved artwork is unreadable.');
  }
  const ids = new Set(state.versions.map(v => v.id));
  if (ids.size !== state.versions.length || !ids.has(state.currentId) ||
      !Array.isArray(state.undo) || !Array.isArray(state.redo) ||
      ![...state.undo, ...state.redo].every(id => ids.has(id))) {
    throw new Error('Saved version history is unreadable.');
  }
  return { ...state, editGroup: undefined };
}

export function saveStudio(storage: StudioStorage, state: StudioState): void {
  // A reload starts a new editing gesture, even if it follows the previous one immediately.
  storage.setItem(STUDIO_STORAGE_KEY, JSON.stringify({ ...state, editGroup: undefined }));
}
