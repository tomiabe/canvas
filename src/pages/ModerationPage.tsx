import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { api, type Submission, type User } from '../lib/api';
import { openSketchInEditor } from '../lib/openSketch';

export function ModerationPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState<Submission[]>([]);

  const load = (next: string) => api.moderation(next).then(data => setItems(data.items)).catch(() => setItems([]));

  useEffect(() => {
    api.me().then(data => {
      setUser(data.user);
      if (data.user?.role === 'curator') void load(status);
    }).catch(() => setUser(null));
  }, []);

  if (user === undefined) return <AppShell title="Review queue"><p className="text-[13px] text-canvas-muted">Loading…</p></AppShell>;
  if (user?.role !== 'curator') return (
    <AppShell title="Review queue" subtitle="Curator access is required to review gallery submissions.">
      <p className="text-[12px] text-canvas-muted">Your account does not have curator permissions.</p>
    </AppShell>
  );

  const review = async (id: string, action: 'approve' | 'reject') => {
    await api.review(id, action).catch(() => undefined);
    setItems(current => current.filter(item => item.id !== id));
  };

  return (
    <AppShell title="Review queue" subtitle="Submissions waiting for a decision.">
      <div className="mb-5 flex items-center gap-2">
        {['pending', 'approved', 'rejected'].map(value => (
          <button key={value} type="button" onClick={() => { setStatus(value); void load(value); }} className={`rounded-lg px-3 py-2 text-[12px] capitalize ${status === value ? 'bg-canvas-raised text-canvas-text' : 'text-canvas-muted'}`}>{value}</button>
        ))}
      </div>
      {items.length === 0 ? <p className="text-[12px] text-canvas-muted">Nothing in this queue.</p> : (
        <div className="flex flex-col gap-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-4 rounded-xl border border-canvas-line bg-canvas-raised p-3">
              {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="size-14 rounded-lg object-cover" /> : <div className="size-14 rounded-lg bg-canvas-preview" />}
              <div className="flex min-w-0 flex-1 flex-col"><span className="truncate text-[13px] font-semibold">{item.title}</span><span className="text-[11px] text-canvas-muted">{item.author_name} / {item.category} / {new Date(item.created_at).toLocaleDateString()}</span></div>
              <button type="button" onClick={() => openSketchInEditor(item.config, item.title)} className="rounded-lg px-3 py-2 text-[11px] text-canvas-muted hover:bg-canvas-white/10">Inspect</button>
              {status === 'pending' && <>
                <button type="button" onClick={() => review(item.id, 'reject')} className="rounded-lg border border-canvas-line px-3 py-2 text-[11px]">Reject</button>
                <button type="button" onClick={() => review(item.id, 'approve')} className="rounded-lg bg-canvas-art-teal px-3 py-2 text-[11px] font-semibold text-white">Approve</button>
              </>}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
