import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { api, type SavedSketch, type User } from '../lib/api';
import { openSketchInEditor } from '../lib/openSketch';

export function SketchesPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [items, setItems] = useState<SavedSketch[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.me().then(async data => {
      setUser(data.user);
      if (data.user) {
        const sketches = await api.sketches().catch(() => ({ items: [] }));
        setItems(sketches.items);
      }
    }).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <AppShell title="My sketches"><p className="text-[13px] text-canvas-muted">Loading…</p></AppShell>;
  if (!user) return <AppShell title="My sketches" subtitle="Sign in to save sketches and access them on any device."><a href="/signin?next=%2Fsketches" className="inline-flex rounded-lg bg-canvas-white px-4 py-2 text-[12px] font-semibold text-canvas-bg">Sign in</a></AppShell>;

  const remove = async (id: string) => {
    await api.deleteSketch(id).catch(() => undefined);
    setItems(current => current.filter(item => item.id !== id));
  };

  return (
    <AppShell title="My sketches" subtitle={`${items.length} saved sketches / Synced to ${user.name}`}>
      {error && <p role="alert" className="mb-4 text-[12px] text-canvas-art-gold">{error}</p>}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2"><button type="button" className="rounded-lg bg-canvas-raised px-3 py-2 text-[12px]">All</button><button type="button" className="rounded-lg px-3 py-2 text-[12px] text-canvas-muted">Favorites</button></div>
        <a href="/" className="rounded-lg bg-canvas-white px-4 py-2 text-[12px] font-semibold text-canvas-bg">New sketch</a>
      </div>
      {items.length === 0 ? (
        <div className="rounded-xl border border-canvas-line bg-canvas-surface p-10 text-center">
          <p className="text-[14px] font-medium">No saved sketches yet</p>
          <p className="mt-1 text-[12px] text-canvas-muted">Open the editor, make something, then use Save sketch.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div key={item.id} className="flex flex-col gap-3 overflow-hidden rounded-xl border border-canvas-line bg-canvas-raised p-3">
              {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="h-44 w-full rounded-lg object-cover" /> : <div className="h-44 w-full rounded-lg bg-canvas-preview" />}
              <div className="flex items-center justify-between">
                <div className="flex flex-col"><span className="text-[14px] font-semibold">{item.title}</span><span className="text-[11px] text-canvas-muted">{item.collection} / {new Date(item.updated_at).toLocaleDateString()}</span></div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openSketchInEditor(item.config, item.title)} title="Open in editor" className="rounded-lg p-2 hover:bg-canvas-white/10"><ArrowUpRight size={16} /></button>
                  <button type="button" onClick={() => remove(item.id)} title="Delete" className="rounded-lg p-2 text-canvas-muted hover:bg-canvas-white/10"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
