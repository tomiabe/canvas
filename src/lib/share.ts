import { limitSketchLoops } from '../engine/generator';
import { templates } from '../templates';
import { ParamDef, SketchConfig, SketchLibrary } from '../types';

const MAX_URL_PAYLOAD = 24000;
const MAX_JSON_BYTES = 120000;
const SHARE_PREFIX = '#art=';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) throw new Error('This remix link is invalid.');
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - text.length % 4) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function readLimited(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_JSON_BYTES) throw new Error('This remix link is too large.');
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function validValue(def: ParamDef, value: unknown): boolean {
  switch (def.type) {
    case 'number':
      return typeof value === 'number' && Number.isFinite(value) &&
        value >= (def.min ?? -Infinity) && value <= (def.max ?? Infinity);
    case 'boolean':
      return typeof value === 'boolean';
    case 'color':
      return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
    case 'color-array':
      return Array.isArray(value) && value.length > 0 && value.length <= 16 &&
        value.every(item => typeof item === 'string' && /^#[0-9a-f]{6}$/i.test(item));
    case 'enum':
      return typeof value === 'string' && !!def.options?.includes(value);
    case 'string':
      return typeof value === 'string' && value.length <= 1000;
    default:
      return false;
  }
}

export function validateSharedConfig(value: unknown): SketchConfig {
  if (!value || typeof value !== 'object') throw new Error('This remix link has no sketch.');
  const config = value as SketchConfig;
  if (typeof config.templateId !== 'string' || !templates[config.templateId] ||
      !Number.isInteger(config.seed) || config.seed < 0 || config.seed > 1000000000 ||
      !config.params || typeof config.params !== 'object' || Array.isArray(config.params)) {
    throw new Error('This remix link has an invalid sketch.');
  }
  if (config.libraries !== undefined &&
      (!Array.isArray(config.libraries) || config.libraries.length > 2 ||
        config.libraries.some((name: SketchLibrary) => name !== 'brush' && name !== 'grain'))) {
    throw new Error('This remix link uses an unsupported library.');
  }
  const custom = config.templateId === 'custom-sketch';
  let controls: ParamDef[];
  if (custom) {
    if (!config.generated || typeof config.generated.title !== 'string' ||
        config.generated.title.length < 1 || config.generated.title.length > 120 ||
        !Array.isArray(config.generated.controls) || config.generated.controls.length < 1 ||
        config.generated.controls.length > 8 ||
        typeof config.params.code !== 'string' || config.params.code.length > 80000 ||
        /<\/script/i.test(config.params.code)) {
      throw new Error('This remix link has invalid generated code.');
    }
    limitSketchLoops(config.params.code);
    controls = config.generated.controls;
  } else {
    controls = templates[config.templateId].params;
  }
  const ids = new Set<string>();
  for (const control of controls) {
    if (!control || typeof control.id !== 'string' ||
        !/^[A-Za-z_][A-Za-z0-9_]*$/.test(control.id) ||
        ['code', 'constructor', 'prototype', '__proto__'].includes(control.id) ||
        ids.has(control.id) || typeof control.name !== 'string' || !control.name.trim() ||
        !validValue(control, config.params[control.id])) {
      throw new Error('This remix link has invalid controls.');
    }
    ids.add(control.id);
  }
  const allowed = new Set([...ids, ...(custom ? ['code'] : [])]);
  if (Object.keys(config.params).some(key => !allowed.has(key))) {
    throw new Error('This remix link has unexpected settings.');
  }
  return config;
}

export async function encodeShareConfig(config: SketchConfig): Promise<string> {
  validateSharedConfig(config);
  const json = JSON.stringify({ schema: 1, config });
  const raw = new TextEncoder().encode(json);
  if (raw.length > MAX_JSON_BYTES) throw new Error('This sketch is too large for a remix link.');
  let bytes = raw;
  let mode = 'r';
  if (typeof CompressionStream !== 'undefined') {
    bytes = new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
    mode = 'g';
  }
  const payload = `1.${mode}.${toBase64Url(bytes)}`;
  if (payload.length > MAX_URL_PAYLOAD) throw new Error('This sketch is too large for a remix link. Export its source instead.');
  return payload;
}

export async function decodeShareConfig(payload: string): Promise<SketchConfig> {
  if (payload.length > MAX_URL_PAYLOAD || !/^1\.[rg]\.[A-Za-z0-9_-]+$/.test(payload)) {
    throw new Error('This remix link is invalid.');
  }
  const [, mode, encoded] = payload.split('.');
  let bytes = fromBase64Url(encoded);
  if (mode === 'g') {
    if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed remix links.');
    bytes = await readLimited(new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip')));
  }
  if (bytes.length > MAX_JSON_BYTES) throw new Error('This remix link is too large.');
  try {
    const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (data?.schema !== 1) throw new Error();
    return validateSharedConfig(data.config);
  } catch {
    throw new Error('This remix link is damaged or unsupported.');
  }
}

export function sharedPayloadFromHash(hash: string): string | null {
  return hash.startsWith(SHARE_PREFIX) ? hash.slice(SHARE_PREFIX.length) : null;
}

export async function createShareUrl(config: SketchConfig, location: Pick<Location, 'origin' | 'pathname' | 'search'>): Promise<string> {
  const payload = await encodeShareConfig(config);
  return `${location.origin}${location.pathname}${location.search}${SHARE_PREFIX}${payload}`;
}
