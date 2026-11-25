import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { api, type GalleryItem } from '../lib/api';
import { openSketchInEditor } from '../lib/openSketch';

export function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  useEffect(() => {
    api.gallery().then(data => setItems(data.items)).catch(e => setError(e instanceof Error ? e.message : 'Could not load the gallery'));
  }, []);

  const visible = useMemo(() => items.filter(item => {
    const matchesFilter = filter === 'All' || item.category === filter;
    const term = search.trim().toLowerCase();
    return matchesFilter && (!term || item.title.toLowerCase().includes(term) || item.author_name.toLowerCase().includes(term));
  }), [items, filter, search]);

  const categories = ['All', ...Array.from(new Set(items.map(item => item.category)))];

  return (
    <AppShell title="Made in Canvas" subtitle="A curated gallery of generative sketches from the community. Explore, get inspired, and share your own.">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          {categories.map(category => (
            <button key={category} type="button" onClick={() => setFilter(category)} className={`rounded-lg px-3 py-2 text-[12px] ${filter === category ? 'bg-canvas-raised text-canvas-text' : 'text-canvas-muted hover:bg-canvas-white/5'}`}>{category}</button>
          ))}
        </div>
        <label className="ml-auto flex h-9 w-64 items-center gap-2 rounded-lg border border-canvas-line bg-canvas-raised px-3">
          <Search size={14} className="text-canvas-muted" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search the gallery" className="w-full bg-transparent text-[12px] outline-none" />
        </label>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg border border-canvas-line bg-canvas-raised p-3 text-[12px] text-canvas-art-gold">{error}</p>}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-canvas-line bg-canvas-surface p-10 text-center">
          <p className="text-[14px] font-medium">No approved artworks yet</p>
          <p className="mt-1 text-[12px] text-canvas-muted">Submissions appear here once a curator approves them.</p>
          <a href="/submit" className="mt-4 inline-flex rounded-lg bg-canvas-white px-4 py-2 text-[12px] font-semibold text-canvas-bg">Submit your work</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(item => (
            <button key={item.id} type="button" onClick={() => setSelected(item)} className="flex flex-col gap-3 overflow-hidden rounded-xl border border-canvas-line bg-canvas-raised p-3 text-left hover:border-canvas-white/25">
              {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} className="h-44 w-full rounded-lg object-cover" /> : <div className="h-44 w-full rounded-lg bg-canvas-preview" />}
              <div className="flex items-center justify-between">
                <div className="flex flex-col"><span className="text-[14px] font-semibold">{item.title}</span><span className="text-[11px] text-canvas-muted">by {item.author_name}</span></div>
                <ArrowUpRight size={16} className="text-canvas-muted" />
              </div>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelected(null)}>
          <div className="flex w-full max-w-2xl flex-col gap-4 rounded-xl border border-canvas-line bg-canvas-surface p-5" onClick={event => event.stopPropagation()}>
            {selected.thumbnail_url && <img src={selected.thumbnail_url} alt={selected.title} className="h-64 w-full rounded-lg object-cover" />}
            <div className="flex items-start justify-between"><div><h2 className="text-[20px] font-semibold">{selected.title}</h2><p className="text-[12px] text-canvas-muted">{selected.author_name} / {selected.category}</p></div><button type="button" onClick={() => setSelected(null)} className="text-canvas-muted">Close</button></div>
            {selected.description && <p className="text-[13px] leading-5 text-canvas-muted">{selected.description}</p>}
            <button type="button" onClick={() => openSketchInEditor(selected.config, selected.title)} className="flex h-10 w-fit items-center gap-2 rounded-lg bg-canvas-white px-4 text-[12px] font-semibold text-canvas-bg">Open in Canvas <ArrowUpRight size={14} /></button>
          </div>
        </div>
      )}
      <p className="mt-8 text-[11px] text-canvas-muted">Click an artwork to view it and open it in the editor.</p>
    </AppShell>
  );
}
