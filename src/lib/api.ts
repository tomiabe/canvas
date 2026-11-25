import { SketchConfig } from '../types';

const PROXY = (process.env.GROQ_PROXY_URL || 'https://canvas.tomi.workers.dev').replace(/\/$/, '');

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  bio: string;
  avatar_url: string;
  role: 'user' | 'curator';
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  category: string;
  config: SketchConfig;
  thumbnail_url: string;
  created_at: string;
  username: string;
  author_name: string;
}

export interface SavedSketch {
  id: string;
  title: string;
  config: SketchConfig;
  thumbnail_url: string;
  collection: string;
  tags: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  thumbnail_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  created_at: string;
  username: string;
  author_name: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PROXY}${path}`, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...init.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((data as { error?: string }).error || `Request failed (${response.status})`);
  return data as T;
}

export const api = {
  me: () => request<{ user: User | null }>('/api/auth/me'),
  devLogin: (email: string, name: string) => request<{ user: User }>('/api/auth/dev/login', { method: 'POST', body: JSON.stringify({ email, name }) }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST', body: '{}' }),
  gallery: () => request<{ items: GalleryItem[] }>('/api/gallery'),
  submit: (payload: { title: string; description: string; category: string; config: SketchConfig; thumbnail_url: string }) =>
    request<{ id: string; status: string }>('/api/gallery/submit', { method: 'POST', body: JSON.stringify(payload) }),
  sketches: () => request<{ items: SavedSketch[] }>('/api/sketches'),
  saveSketch: (payload: { id?: string; title: string; config: SketchConfig; thumbnail_url: string; collection: string; tags: string }) =>
    request<{ id: string }>('/api/sketches', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSketch: (id: string) => request<{ ok: boolean }>(`/api/sketches/${id}`, { method: 'DELETE', body: '{}' }),
  moderation: (status: string) => request<{ items: Submission[] }>(`/api/moderation/submissions?status=${status}`),
  review: (id: string, action: 'approve' | 'reject', reason = '') =>
    request<{ ok: boolean }>(`/api/moderation/${id}/${action}`, { method: 'POST', body: JSON.stringify({ reason }) }),
};
