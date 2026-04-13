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
    
    // Reset params to defaults for the new template
    const defaultParams: Record<string, any> = {};
    template.params.forEach(p => {
      defaultParams[p.id] = p.default;
    });

    onChange({
      templateId,
      seed: Math.floor(Math.random() * 1000000),
      params: defaultParams
    });
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
        randomParams[p.id] = p.default; // keep default colors for now
      }
    });

    onChange({
      templateId: randomTemplateId,
      seed: Math.floor(Math.random() * 1000000),
      params: randomParams
    });
  };

  return (
    <div className="h-14 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between px-4 text-neutral-200 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <Palette className="text-indigo-500" size={24} />
          <span>Canvas</span>
        </div>
        
        <div className="h-6 w-px bg-neutral-800 mx-2"></div>
        
        <select
          value={config.templateId}
          onChange={handleTemplateChange}
          className="bg-neutral-900 border border-neutral-700 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1.5 outline-none cursor-pointer"
        >
          {Object.values(templates).map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSurpriseMe}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-md transition-colors cursor-pointer"
        >
          <Wand2 size={16} className="text-purple-400" />
          Surprise Me
        </button>
        
        <button
          onClick={onToggleCode}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md transition-colors cursor-pointer ${showCode ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-300' : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-700'}`}
        >
          <Code size={16} />
          Code
        </button>
        
        <button
          onClick={() => {
            const template = templates[config.templateId];
            const code = template.generateCode(config.params, config.seed);
            const blob = new Blob([code], { type: 'text/javascript' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `canvas-${config.templateId}-${config.seed}.js`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-md transition-colors cursor-pointer"
        >
          <Download size={16} />
          JS
        </button>
        
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-md transition-colors cursor-pointer"
        >
          <Download size={16} />
          PNG
        </button>
      </div>
    </div>
  );
}
