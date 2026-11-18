import React from 'react';
import { History, X } from 'lucide-react';
import { ArtworkVersion } from '../lib/studio';
import { templates } from '../templates';

interface HistoryPanelProps {
  versions: ArtworkVersion[];
  currentId: string;
  onRestore: (id: string) => void;
  onClose: () => void;
  mobile?: boolean;
}

export function HistoryPanel({ versions, currentId, onRestore, onClose, mobile = false }: HistoryPanelProps) {
  const artworks = versions.filter(v => v.config.templateId).slice().reverse();
  return (
    <aside aria-label="Version history" className={`absolute right-0 inset-y-0 ${mobile ? 'w-full' : 'w-80 max-w-full border-l canvas-panel-shadow-left'} z-50 flex flex-col bg-canvas-overlay border-canvas-line`}>
      <div className="p-4 border-b border-canvas-line">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><History size={16} /> Version history</h2>
          <button onClick={onClose} aria-label="Close history" className="p-1.5 rounded-md text-canvas-text/50 hover:text-canvas-text hover:bg-canvas-white/10 cursor-pointer"><X size={16} /></button>
        </div>
        <p className="text-xs text-canvas-text/50 mt-2 leading-relaxed">Autosaved in this browser only. Restore any version to keep creating from there.</p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {!artworks.length && <p className="text-sm text-canvas-text/50 p-2 leading-relaxed">Your artwork versions will appear here after you generate a sketch or choose a template.</p>}
        {artworks.map(version => {
          const isCurrent = currentId === version.id;
          const title = version.config.generated?.title ?? templates[version.config.templateId]?.name ?? 'Artwork';
          return (
            <article key={version.id} className={`rounded-xl border p-3 ${isCurrent ? 'border-canvas-white/30 bg-canvas-white/10' : 'border-canvas-line bg-canvas-white/[0.03]'}`}>
              <div className="flex gap-2 items-start justify-between">
                <h3 className="text-sm font-medium break-words min-w-0">{title}</h3>
                {isCurrent && <span className="text-[10px] uppercase tracking-wide text-canvas-text/60 shrink-0 mt-0.5">Current</span>}
              </div>
              <p className="text-xs text-canvas-text/60 mt-1.5 break-words line-clamp-3" title={version.label}>{version.label}</p>
              <div className="flex items-center justify-between gap-2 mt-3">
                <time dateTime={new Date(version.createdAt).toISOString()} className="text-[10px] text-canvas-text/40">{new Date(version.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                {version.error ? <span className="text-[10px] text-amber-300">Preview failed</span> :
                  <button onClick={() => onRestore(version.id)} disabled={isCurrent} aria-label={`Restore ${version.label}`}
                    className="text-xs px-2.5 py-1 rounded-md bg-canvas-white/10 hover:bg-canvas-white/20 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors">Restore</button>}
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
