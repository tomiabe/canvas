import React, { useRef, useState, useEffect } from 'react';
import { templates } from '../templates';
import { SketchConfig } from '../types';
import { Download, Code, Palette, Wand2, Settings, Eye, EyeOff, FileImage, FileVideo, FileJson, Info } from 'lucide-react';

interface TopBarProps {
  config: SketchConfig;
  onChange: (config: SketchConfig) => void;
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
}

export function TopBar({ config, onChange, onExport, onToggleCode, showCode, showSettings, onToggleSettings, previewEnabled, onTogglePreview, onToggleInfo, showInfo, hasTemplate }: TopBarProps) {
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

  const handleSurpriseMe = () => {
    const templateIds = Object.keys(templates).filter(id => id !== 'custom-sketch');
    const randomTemplateId = templateIds[Math.floor(Math.random() * templateIds.length)];
    const template = templates[randomTemplateId];

    const randomParams: Record<string, any> = {};
    template.params.forEach(p => {
      if (p.type === 'number') {
        const range = (p.max || 100) - (p.min || 0);
        let val = (p.min || 0) + Math.random() * range;
        if (p.step && p.step >= 1) val = Math.floor(val);
        randomParams[p.id] = val;
      } else if (p.type === 'boolean') {
        randomParams[p.id] = Math.random() > 0.5;
      } else if (p.type === 'enum' && p.options) {
        randomParams[p.id] = p.options[Math.floor(Math.random() * p.options.length)];
      } else {
        randomParams[p.id] = p.default;
      }
    });

    onChange({
      templateId: randomTemplateId,
      seed: Math.floor(Math.random() * 1000000),
      params: randomParams
    });
  };

  const handleJsExport = () => {
    if (!hasTemplate) return;
    const template = templates[config.templateId];
    const code = template.generateCode(config.params, config.seed);
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
    <div className="h-11 glass-panel flex items-center justify-between px-4 text-white/90 shrink-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-2.5 font-semibold text-sm tracking-tight">
        <Palette className="text-white" size={18} />
        <span>Canvas</span>
        <button
          onClick={onToggleInfo}
          className={`ml-1 p-1 rounded-lg transition-colors cursor-pointer active:scale-95 ${showInfo ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'}`}
          title="Show instructions"
        >
          <Info size={14} />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        {hasTemplate && (
          <>
            <button
              onClick={onTogglePreview}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer active:scale-95 ${previewEnabled ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90' : 'bg-white/10 border-white/20 text-white'}`}
              title={previewEnabled ? 'Pause preview' : 'Resume preview'}
            >
              {previewEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
              {previewEnabled ? 'Preview' : 'Paused'}
            </button>

            <button
              onClick={onToggleSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer active:scale-95 ${showSettings ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'}`}
            >
              <Settings size={13} />
              Settings
            </button>

            <button
              onClick={handleSurpriseMe}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <Wand2 size={13} />
              Surprise Me
            </button>

            <button
              onClick={onToggleCode}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer active:scale-95 ${showCode ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'}`}
            >
              <Code size={13} />
              Code
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
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
