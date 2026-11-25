import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/AppShell';
import { api, type User } from '../lib/api';
import { loadStudio } from '../lib/studio';

export function SubmitPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Generative');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    api.me().then(data => {
      setUser(data.user);
      if (!data.user) return;
      try {
        const studio = loadStudio(window.localStorage);
        const current = studio.versions.find(version => version.id === studio.currentId);
        if (current?.config.templateId) setTitle(current.config.generated?.title || current.label.replace(/^Created artwork: /, '') || 'Untitled sketch');
      } catch { /* no local history yet */ }
    }).catch(() => setUser(null));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const studio = loadStudio(window.localStorage);
      const current = studio.versions.find(version => version.id === studio.currentId);
      if (!current?.config.templateId) throw new Error('Open a sketch in Canvas first, then submit it from there.');
      setStatus('sending');
      await api.submit({ title, description, category, config: current.config, thumbnail_url: '' });
      setStatus('sent');
    } catch (e) {
      setStatus('idle');
      setError(e instanceof Error ? e.message : 'Could not submit');
    }
  };

  if (user === undefined) return <AppShell title="Submit work"><p className="text-[13px] text-canvas-muted">Loading…</p></AppShell>;
  if (!user) return <AppShell title="Submit work" subtitle="Sign in to submit a sketch to the gallery."><a href="/signin?next=%2Fsubmit" className="inline-flex rounded-lg bg-canvas-white px-4 py-2 text-[12px] font-semibold text-canvas-bg">Sign in</a></AppShell>;
  if (status === 'sent') return (
    <AppShell title="Submitted for review" subtitle="Your work is in the curator queue. It will appear in the gallery once approved.">
      <a href="/gallery" className="inline-flex rounded-lg bg-canvas-raised px-4 py-2 text-[12px] font-medium">Back to gallery</a>
    </AppShell>
  );

  return (
    <AppShell title="Submit your work" subtitle="Send a sketch from your Canvas history to the community gallery.">
      <form onSubmit={submit} className="flex max-w-xl flex-col gap-4 rounded-xl border border-canvas-line bg-canvas-surface p-6">
        <label className="flex flex-col gap-1 text-[12px]"><span>Title</span><input value={title} onChange={event => setTitle(event.target.value)} required minLength={2} maxLength={80} className="h-11 rounded-lg border border-canvas-line bg-canvas-raised px-3 text-[13px] outline-none focus:border-canvas-white/40" /></label>
        <label className="flex flex-col gap-1 text-[12px]"><span>Description</span><textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={500} rows={4} placeholder="Tell us about this piece…" className="rounded-lg border border-canvas-line bg-canvas-raised p-3 text-[13px] outline-none focus:border-canvas-white/40" /></label>
        <label className="flex flex-col gap-1 text-[12px]"><span>Category</span><select value={category} onChange={event => setCategory(event.target.value)} className="h-11 rounded-lg border border-canvas-line bg-canvas-raised px-3 text-[13px] outline-none"><option>Generative</option><option>Pattern</option><option>Particles</option><option>3D</option><option>Nature</option><option>Panel</option></select></label>
        <p className="text-[11px] text-canvas-muted">The current sketch in your browser history will be submitted.</p>
        {error && <p role="alert" className="text-[11px] text-canvas-art-gold">{error}</p>}
        <button type="submit" disabled={status === 'sending'} className="h-11 rounded-lg bg-canvas-white text-[13px] font-semibold text-canvas-bg disabled:opacity-50">{status === 'sending' ? 'Sending…' : 'Send for review'}</button>
      </form>
    </AppShell>
  );
}
