import React, { useRef, useState, useEffect } from 'react';
import { templates } from '../templates';
import { SketchConfig } from '../types';
import { getSketchScripts } from '../engine/generator';
import { Download, Code, Palette, SlidersHorizontal, Pause, Play, FileImage, FileVideo, FileJson, CircleHelp, History, Undo2, Redo2 } from 'lucide-react';

interface TopBarProps {
  config: SketchConfig;
  onExport: (type: 'png' | 'gif' | 'video') => void;
  onToggleCode: () => void;
  showCode: boolean;
  showSettings: boolean;
  onToggleSettings: () => void;
  previewEnabled: boolean;
  onTogglePreview: () => void;
  onToggleInfo: () => void;
  showInfo: boolean;
  hasTemplate: boolean;
  onHome: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showHistory: boolean;
  onToggleHistory: () => void;
}

export function TopBar({ config, onExport, onToggleCode, showCode, showSettings, onToggleSettings, previewEnabled, onTogglePreview, onToggleInfo, showInfo, hasTemplate, onHome, onUndo, onRedo, canUndo, canRedo, showHistory, onToggleHistory }: TopBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleJsExport = () => {
    if (!hasTemplate) return;
    const template = templates[config.templateId];
    const code = `// Load these scripts in order before running this sketch:\n${getSketchScripts(config).map(url => `// ${url}`).join('\n')}\n\n${template.generateCode(config.params, config.seed)}`;
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canvas-${config.templateId}-${config.seed}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportOptions = [
    { type: 'png' as const, label: 'PNG', desc: 'Screenshot', icon: FileImage },
    { type: 'gif' as const, label: 'GIF', desc: '3s animation', icon: FileVideo },
    { type: 'video' as const, label: 'Video', desc: '5s recording', icon: FileVideo },
  ];

  return (
    <header className="min-h-12 glass-panel grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:gap-4 sm:px-4 text-white/90 shrink-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <button onClick={onHome} title="Start a new artwork - saved versions are kept" aria-label="Canvas - new artwork"
        className="flex items-center gap-2.5 font-semibold text-sm tracking-tight rounded-md py-2 cursor-pointer hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70">
        <Palette className="text-white" size={18} />
        <span>Canvas</span>
      </button>

      <div role="group" aria-label="Artwork controls" className="flex min-w-0 flex-wrap items-center justify-center gap-1.5 py-2">
        {(hasTemplate || canUndo || canRedo) && <>
          <button onClick={onUndo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘/Ctrl Z)"
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-25 disabled:cursor-default cursor-pointer transition-colors"><Undo2 size={14} /></button>
          <button onClick={onRedo} disabled={!canRedo} aria-label="Redo" title="Redo (⌘/Ctrl Shift Z)"
            className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-25 disabled:cursor-default cursor-pointer transition-colors"><Redo2 size={14} /></button>
          <div className="h-4 w-px bg-white/15 mx-1" />
        </>}
        {hasTemplate && (
          <>
            <span className="max-w-48 truncate text-xs font-medium text-white/60 mr-3" title={config.generated?.title ?? templates[config.templateId]?.name}>
              {config.generated?.title ?? templates[config.templateId]?.name}
            </span>

            <button
              onClick={onToggleSettings}
              aria-pressed={showSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer active:scale-95 ${showSettings ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'}`}
            >
              <SlidersHorizontal size={13} />
              Adjust
            </button>

            <button
              onClick={onToggleCode}
              aria-pressed={showCode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer active:scale-95 ${showCode ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'}`}
            >
              <Code size={13} />
              Code
            </button>

            <button
              onClick={onTogglePreview}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg bg-white/5 hover:bg-white/10 border-white/10 transition-colors cursor-pointer active:scale-95"
              title={previewEnabled ? 'Pause preview' : 'Resume preview'}
              aria-label={previewEnabled ? 'Pause preview' : 'Resume preview'}
            >
              {previewEnabled ? <Pause size={13} /> : <Play size={13} />}
            </button>

            <div className="h-4 w-[1px] bg-white/15 mx-1"></div>

            <div className="relative" ref={exportRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white hover:bg-white/90 text-black rounded-lg transition-colors cursor-pointer active:scale-95 shadow-sm"
              >
                <Download size={13} />
                Export
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 glass-panel rounded-lg overflow-hidden z-50 shadow-xl border border-white/10 py-1">
                  {exportOptions.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.type}
                        onClick={() => { onExport(opt.type); setShowExportMenu(false); }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors cursor-pointer text-left"
                      >
                        <Icon size={14} className="shrink-0" />
                        <div>
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-white/40">{opt.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                  {config.templateId !== 'photo-poster' && <>
                    <div className="h-px bg-white/10 my-1"></div>
                    <button
                      onClick={() => { handleJsExport(); setShowExportMenu(false); }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-xs text-white/80 hover:bg-white/10 transition-colors cursor-pointer text-left"
                    >
                      <FileJson size={14} className="shrink-0" />
                      <div>
                        <div className="font-medium">JS</div>
                        <div className="text-white/40">Source code</div>
                      </div>
                    </button>
                  </>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-3 border-l border-white/10 pl-3 sm:pl-4">
        <button onClick={onToggleHistory} aria-pressed={showHistory} aria-label="History" title="Version history"
          className={`py-2 flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${showHistory ? 'text-white' : 'text-white/50 hover:text-white/90'}`}>
          <History size={16} /><span className="hidden sm:inline">History</span>
        </button>
        <button
          onClick={onToggleInfo}
          aria-pressed={showInfo}
          aria-label="Help"
          className={`py-2 flex items-center gap-1.5 text-xs transition-colors cursor-pointer ${showInfo ? 'text-white' : 'text-white/40 hover:text-white/80'}`}
          title="Help"
        >
          <CircleHelp size={16} />
          <span className="hidden sm:inline">Help</span>
        </button>
      </div>
    </header>
  );
}
