import React, { useEffect, useRef, useState } from 'react';
import { templates } from '../templates';
import { SketchConfig } from '../types';
import { CircleHelp, Download, FileImage, FileJson, FileVideo, History, Palette, Redo2, Share2, Undo2 } from 'lucide-react';

interface TopBarProps {
  config: SketchConfig;
  onExport: (type: 'png' | 'gif' | 'video') => void;
  onExportJs: () => void;
  onShare: () => void;
  onToggleInfo: () => void;
  showInfo: boolean;
  onHome: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showHistory: boolean;
  onToggleHistory: () => void;
}

export function TopBar({ config, onExport, onExportJs, onShare, onToggleInfo, showInfo, onHome, onUndo, onRedo, canUndo, canRedo, showHistory, onToggleHistory }: TopBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const template = templates[config.templateId];
  const preset = template?.presets?.find(item =>
    Object.entries(item.params).every(([key, value]) => JSON.stringify(config.params[key]) === JSON.stringify(value))
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) setShowExportMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="z-30 flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-canvas-line bg-canvas-surface px-6 text-canvas-text">
      <div className="flex min-w-0 items-center gap-4">
        <button type="button" onClick={onHome} title="Start new artwork; previous work stays in History" className="flex shrink-0 items-center gap-2 text-[15px] font-semibold hover:text-canvas-text/80">
          <Palette size={19} /> Canvas
        </button>
        {template && <>
          <span aria-hidden="true" className="h-6 w-px bg-canvas-white/10" />
          <span className="min-w-0 truncate text-sm font-medium" title={config.generated?.title ?? template.name}>{config.generated?.title ?? template.name}</span>
          {preset && <span className="shrink-0 rounded-full bg-canvas-raised px-2.5 py-1 text-xs text-canvas-muted">{preset.name}</span>}
        </>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {(template || canUndo || canRedo) && <>
          <button type="button" onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘/Ctrl Z)" className="flex size-10 items-center justify-center rounded-lg bg-canvas-raised hover:bg-canvas-white/15 disabled:opacity-35"><Undo2 size={18} /></button>
          <button type="button" onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo (⌘/Ctrl Shift Z)" className="flex size-10 items-center justify-center rounded-lg bg-canvas-raised hover:bg-canvas-white/15 disabled:opacity-35"><Redo2 size={18} /></button>
          <span aria-hidden="true" className="mx-1 h-6 w-px bg-canvas-white/10" />
        </>}
        <button type="button" onClick={onToggleHistory} aria-pressed={showHistory} className={`flex h-10 items-center gap-2 rounded-lg px-3 text-[13px] hover:bg-canvas-white/10 ${showHistory ? 'text-canvas-text' : 'text-canvas-muted'}`}><History size={17} /> History</button>
        <button type="button" onClick={onToggleInfo} aria-pressed={showInfo} aria-label="Help" title="Help" className={`flex size-10 items-center justify-center rounded-lg hover:bg-canvas-white/10 ${showInfo ? 'text-canvas-text' : 'text-canvas-muted'}`}><CircleHelp size={18} /></button>
        {template && <>
          <button type="button" onClick={onShare} className="flex h-10 items-center gap-2 rounded-lg border border-canvas-line bg-canvas-raised px-4 text-[13px] font-medium hover:bg-canvas-white/15"><Share2 size={16} /> Share</button>
          <div className="relative" ref={exportRef}>
            <button type="button" onClick={() => setShowExportMenu(value => !value)} aria-expanded={showExportMenu} className="flex h-10 items-center gap-2 rounded-lg bg-canvas-white px-4 text-[13px] font-semibold text-canvas-bg hover:bg-canvas-white/90"><Download size={16} /> Export</button>
            {showExportMenu && <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-canvas-line bg-canvas-raised p-1 shadow-xl">
              {([
                ['png', 'PNG image', FileImage],
                ['gif', 'GIF animation', FileVideo],
                ['video', 'Video recording', FileVideo],
              ] as const).map(([type, label, Icon]) => <button key={type} type="button" onClick={() => { onExport(type); setShowExportMenu(false); }} className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-xs hover:bg-canvas-white/10"><Icon size={15} /> {label}</button>)}
              <div className="my-1 border-t border-canvas-line" />
              <button type="button" onClick={() => { onExportJs(); setShowExportMenu(false); }} className="flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-xs hover:bg-canvas-white/10"><FileJson size={15} /> p5.js source</button>
            </div>}
          </div>
        </>}
      </div>
    </header>
  );
}
