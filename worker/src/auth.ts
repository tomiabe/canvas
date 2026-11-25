// Signed session cookies and user lookup. The dev provider is a real session
// flow; OAuth providers can be added by mapping their callback to getUser().

export interface Statement {
  bind(...values: unknown[]): Statement;
  all(): Promise<{ results: unknown[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}
export interface D1Database {
  prepare(query: string): Statement;
}

export interface AuthEnv {
  DB?: D1Database;
  SESSION_SECRET?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  bio: string;
  avatar_url: string;
  role: 'user' | 'curator';
  created_at: string;
}

const COOKIE = 'canvas_session';
const enc = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of arr) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function key(env: AuthEnv): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(env.SESSION_SECRET || 'canvas-local-dev-secret'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function createSession(userId: string, env: AuthEnv): Promise<string> {
  const payload = base64url(enc.encode(JSON.stringify({ sub: userId, iat: Date.now() })));
  const signature = base64url(await crypto.subtle.sign('HMAC', await key(env), enc.encode(payload)));
  return `${payload}.${signature}`;
}

export async function verifySession(request: Request, env: AuthEnv): Promise<string | null> {
  const header = request.headers.get('Cookie') || '';
  const token = header.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  const signatureBytes = new Uint8Array(fromBase64url(signature));
  const valid = await crypto.subtle.verify('HMAC', await key(env), signatureBytes, enc.encode(payload));
  if (!valid) return null;
  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(payload))) as { sub: string; iat: number };
    if (!data.sub || Date.now() - data.iat > 1000 * 60 * 60 * 24 * 30) return null;
    return data.sub;
  } catch {
    return null;
  }
}

export const sessionCookie = (token: string) => `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000`;
export const clearCookie = () => `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'maker';
}

export async function getUser(env: AuthEnv, email: string, name: string): Promise<User> {
  if (!env.DB) throw new Error('Database binding unavailable');
  const normalized = email.trim().toLowerCase();
  const existing = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(normalized).first<User>();
  if (existing) return existing;
  const id = crypto.randomUUID();
  const base = slug(name || normalized.split('@')[0]);
  let username = base;
  for (let i = 1; i < 100; i++) {
    const taken = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
    if (!taken) break;
    username = `${base}-${i}`;
  }
  const user: User = {
    id, email: normalized, name: name || base, username, bio: '', avatar_url: '', role: 'user',
    created_at: new Date().toISOString(),
  };
  await env.DB.prepare('INSERT INTO users (id, email, name, username, bio, avatar_url, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(user.id, user.email, user.name, user.username, user.bio, user.avatar_url, user.role, user.created_at).run();
  return user;
}

export async function userById(env: AuthEnv, id: string): Promise<User | null> {
  if (!env.DB) return null;
  return env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
}
