import React from 'react';
import { templates } from '../templates';
import { SketchConfig } from '../types';
import { Download, Code, Palette, Wand2 } from 'lucide-react';

interface TopBarProps {
  config: SketchConfig;
  onChange: (config: SketchConfig) => void;
  onExport: () => void;
  onToggleCode: () => void;
  showCode: boolean;
}

export function TopBar({ config, onChange, onExport, onToggleCode, showCode }: TopBarProps) {
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const template = templates[templateId];
    const defaultParams: Record<string, any> = {};
    template.params.forEach(p => { defaultParams[p.id] = p.default; });
    onChange({ templateId, seed: Math.floor(Math.random() * 1000000), params: defaultParams });
  };

  const handleSurpriseMe = () => {
    const templateIds = Object.keys(templates);
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
    onChange({ templateId: randomTemplateId, seed: Math.floor(Math.random() * 1000000), params: randomParams });
  };

  return (
    <div className="h-14 glass-panel flex items-center justify-between px-6 text-white/90 shrink-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
          <Palette className="text-white" size={20} />
          <span>Canvas</span>
        </div>

        <div className="h-5 w-[1px] bg-white/20"></div>

        <div className="relative">
          <select
            value={config.templateId}
            onChange={handleTemplateChange}
            className="appearance-none bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/30 transition-colors cursor-pointer max-w-[220px]"
          >
            <option value="" disabled className="bg-[#1c1c1e] text-white/40">Choose a template…</option>
            {Object.values(templates).map(t => (
              <option key={t.id} value={t.id} className="bg-[#1c1c1e] text-white/90">{t.name}</option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/50">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSurpriseMe}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
        >
          <Wand2 size={14} />
          Surprise Me
        </button>

        <button
          onClick={onToggleCode}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors cursor-pointer active:scale-95 ${showCode ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/90'}`}
        >
          <Code size={14} />
          Code
        </button>

        <div className="h-4 w-[1px] bg-white/20 mx-1"></div>

        <button
          onClick={() => {
            let code: string;
            let filename: string;
            if (config.customCode) {
              code = config.customCode;
              filename = 'canvas-ai-generated.js';
            } else {
              const template = templates[config.templateId];
              if (!template) return;
              code = template.generateCode(config.params, config.seed);
              filename = `canvas-${config.templateId}-${config.seed}.js`;
            }
            const blob = new Blob([code], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer active:scale-95"
        >
          <Download size={14} />
          JS
        </button>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-white hover:bg-white/90 text-black rounded-lg transition-colors cursor-pointer active:scale-95 shadow-sm"
        >
          <Download size={14} />
          PNG
        </button>
      </div>
    </div>
  );
}
