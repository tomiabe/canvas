import { clearCookie, createSession, getUser, sessionCookie, userById, verifySession, type AuthEnv, type User } from './auth';

export interface ApiEnv extends AuthEnv {
  DB?: D1Database;
}

interface Statement {
  bind(...values: unknown[]): Statement;
  all(): Promise<{ results: unknown[] }>;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(query: string): Statement;
}

type Row = Record<string, unknown>;

const json = (data: unknown, headers: Record<string, string>, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

function parseSketch(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const config = value as Row;
  return typeof config.templateId === 'string' && !!config.params && typeof config.params === 'object';
}

export async function handleApi(request: Request, env: ApiEnv, headers: Record<string, string>): Promise<Response | null> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/')) return null;
  const path = url.pathname;
  const method = request.method;

  if (path === '/api/auth/providers' && method === 'GET') {
    return json({ providers: [
      { id: 'google', label: 'Google', configured: false },
      { id: 'apple', label: 'Apple', configured: false },
      { id: 'yahoo', label: 'Yahoo', configured: false },
      { id: 'dev', label: 'Local account', configured: true },
    ] }, headers);
  }

  if (path === '/api/auth/dev/login' && method === 'POST') {
    let body: Row;
    try { body = await request.json() as Row; } catch { return json({ error: 'Invalid JSON body' }, headers, 400); }
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || name.length < 2 || name.length > 64) {
      return json({ error: 'A valid email and a name of 2 to 64 characters are required' }, headers, 400);
    }
    const user = await getUser(env, email, name);
    const token = await createSession(user.id, env);
    return json({ user }, { ...headers, 'Set-Cookie': sessionCookie(token) });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return json({ ok: true }, { ...headers, 'Set-Cookie': clearCookie() });
  }

  if (path === '/api/auth/me' && method === 'GET') {
    const id = await verifySession(request, env);
    const user = id ? await userById(env, id) : null;
    return json({ user }, headers);
  }

  const userId = await verifySession(request, env);
  if (!userId && (path.startsWith('/api/sketches') || path === '/api/gallery/submit' || path.startsWith('/api/moderation'))) {
    return json({ error: 'Sign in required' }, headers, 401);
  }
  const user = userId ? await userById(env, userId) : null;
  if (!user && userId) return json({ error: 'Session user not found' }, headers, 401);

  if (path === '/api/gallery' && method === 'GET') {
    if (!env.DB) return json({ items: [] }, headers);
    const result = await env.DB.prepare(`SELECT s.id, s.title, s.description, s.category, s.config, s.thumbnail_url, s.created_at,
      u.username, u.name AS author_name FROM submissions s JOIN users u ON u.id = s.user_id
      WHERE s.status = 'approved' ORDER BY s.created_at DESC LIMIT 120`).all();
    return json({ items: result.results.map(row => ({ ...(row as Row), config: JSON.parse(String((row as Row).config)) })) }, headers);
  }

  if (path === '/api/gallery/submit' && method === 'POST') {
    let body: Row;
    try { body = await request.json() as Row; } catch { return json({ error: 'Invalid JSON body' }, headers, 400); }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : 'Generative';
    if (title.length < 2 || title.length > 80 || description.length > 500 || category.length > 40) {
      return json({ error: 'Invalid submission fields' }, headers, 400);
    }
    if (!parseSketch(body.config)) return json({ error: 'A valid sketch is required' }, headers, 400);
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB!.prepare(`INSERT INTO submissions (id, user_id, title, description, category, config, thumbnail_url, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`)
      .bind(id, user!.id, title, description, category, JSON.stringify(body.config), typeof body.thumbnail_url === 'string' ? body.thumbnail_url : '', now).run();
    return json({ id, status: 'pending' }, headers, 201);
  }

  if (path === '/api/sketches' && method === 'GET') {
    if (!env.DB) return json({ items: [] }, headers);
    const result = await env.DB.prepare('SELECT id, title, config, thumbnail_url, collection, tags, updated_at FROM sketches WHERE user_id = ? ORDER BY updated_at DESC LIMIT 200').bind(user!.id).all();
    return json({ items: result.results.map(row => ({ ...(row as Row), config: JSON.parse(String((row as Row).config)) })) }, headers);
  }

  if (path === '/api/sketches' && method === 'POST') {
    let body: Row;
    try { body = await request.json() as Row; } catch { return json({ error: 'Invalid JSON body' }, headers, 400); }
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 1 || title.length > 80 || !parseSketch(body.config)) return json({ error: 'Title and sketch are required' }, headers, 400);
    const id = typeof body.id === 'string' && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : crypto.randomUUID();
    const now = new Date().toISOString();
    const existing = await env.DB!.prepare('SELECT id, created_at FROM sketches WHERE id = ? AND user_id = ?').bind(id, user!.id).first<Row>();
    if (existing) {
      await env.DB!.prepare('UPDATE sketches SET title = ?, config = ?, thumbnail_url = ?, collection = ?, tags = ?, updated_at = ? WHERE id = ? AND user_id = ?')
        .bind(title, JSON.stringify(body.config), typeof body.thumbnail_url === 'string' ? body.thumbnail_url : '', typeof body.collection === 'string' ? body.collection : 'Unsorted', typeof body.tags === 'string' ? body.tags : '', now, id, user!.id).run();
    } else {
      await env.DB!.prepare(`INSERT INTO sketches (id, user_id, title, config, thumbnail_url, collection, tags, updated_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, user!.id, title, JSON.stringify(body.config), typeof body.thumbnail_url === 'string' ? body.thumbnail_url : '', typeof body.collection === 'string' ? body.collection : 'Unsorted', typeof body.tags === 'string' ? body.tags : '', now, now).run();
    }
    return json({ id, updated_at: now }, headers, 201);
  }

  const sketchMatch = path.match(/^\/api\/sketches\/([0-9a-f-]{36})$/i);
  if (sketchMatch && method === 'DELETE') {
    await env.DB!.prepare('DELETE FROM sketches WHERE id = ? AND user_id = ?').bind(sketchMatch[1], user!.id).run();
    return json({ ok: true }, headers);
  }

  if (user!.role !== 'curator' && path.startsWith('/api/moderation')) {
    return json({ error: 'Curator access required' }, headers, 403);
  }

  if (path === '/api/moderation/submissions' && method === 'GET') {
    const status = url.searchParams.get('status') || 'pending';
    if (!['pending', 'approved', 'rejected'].includes(status)) return json({ error: 'Invalid status' }, headers, 400);
    const result = await env.DB!.prepare(`SELECT s.*, u.username, u.name AS author_name FROM submissions s JOIN users u ON u.id = s.user_id
      WHERE s.status = ? ORDER BY s.created_at DESC LIMIT 200`).bind(status).all();
    return json({ items: result.results.map(row => ({ ...(row as Row), config: JSON.parse(String((row as Row).config)) })) }, headers);
  }

  const review = path.match(/^\/api\/moderation\/([0-9a-f-]{36})\/(approve|reject)$/i);
  if (review && method === 'POST') {
    let reason = '';
    if (review[2] === 'reject') {
      let body: Row = {};
      try { body = await request.json() as Row; } catch { /* optional */ }
      reason = typeof body.reason === 'string' ? body.reason.slice(0, 300) : '';
    }
    await env.DB!.prepare('UPDATE submissions SET status = ?, rejection_reason = ?, reviewed_at = ? WHERE id = ?')
      .bind(review[2] === 'approve' ? 'approved' : 'rejected', reason, new Date().toISOString(), review[1]).run();
    return json({ ok: true, status: review[2] === 'approve' ? 'approved' : 'rejected' }, headers);
  }

  return json({ error: 'Not found' }, headers, 404);
}
