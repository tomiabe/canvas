import React from 'react';
import { SketchConfig, Template, ParamDef, ParamCategory } from '../types';
import { templates } from '../templates';
import { ChevronDown, RefreshCw, Info } from 'lucide-react';

interface ControlPanelProps {
  config: SketchConfig;
  onChange: (config: SketchConfig) => void;
  mobile?: boolean;
  embedded?: boolean;
}

const categoryLabels: Record<string, string> = {
  particles: 'Particles',
  physics: 'Physics',
  geometry: 'Geometry',
  color: 'Color',
  animation: 'Animation',
  interaction: 'Interaction',
  typography: 'Typography',
  '3d': '3D',
  noise: 'Noise',
  audio: 'Audio',
  image: 'Image',
  simulation: 'Simulation',
  layout: 'Layout',
  misc: 'Other',
};

export function ControlPanel({ config, onChange, mobile = false, embedded = false }: ControlPanelProps) {
  const template = templates[config.templateId];
  if (!template) return null;

  const handleParamChange = (id: string, value: any) => {
    onChange({
      ...config,
      params: {
        ...config.params,
        [id]: value
      }
    });
  };

  const handleSeedChange = () => {
    onChange({
      ...config,
      seed: Math.floor(Math.random() * 1000000)
    });
  };

  // Group params by category
  const grouped: Record<string, ParamDef[]> = { misc: [] };
  (config.generated?.controls ?? template.params).forEach(p => {
    if (p.type === 'code') return;
    const cat = p.category || 'misc';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(p);
  });

  const renderControl = (param: ParamDef) => {
    const value = config.params[param.id] ?? param.default;
    const inline = embedded && ['boolean', 'color', 'color-array'].includes(param.type);

    return (
      <div key={param.id} className={`mb-4 ${inline ? 'flex min-h-9 items-center justify-between gap-3' : ''}`}>
        <div className={`flex items-center justify-between ${inline ? 'flex-1' : 'mb-1.5'}`}>
          <div className="flex items-center gap-1.5">
            <label className={`${embedded ? 'text-[13px]' : 'text-sm font-medium'} text-canvas-text/80`}>{param.name}</label>
            {param.description && (
              <span className="group relative">
                <Info size={12} className="text-canvas-text/30 cursor-help" />
                <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-canvas-surface text-canvas-text/80 text-[10px] px-2 py-1 rounded-md border border-canvas-line whitespace-nowrap shadow-lg z-50 pointer-events-none">
                  {param.description}
                </span>
              </span>
            )}
          </div>
          {param.type === 'number' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-canvas-text/50 font-mono">{value}</span>
              {param.suffix && <span className="text-[10px] text-canvas-text/30">{param.suffix}</span>}
            </div>
          )}
        </div>
        {renderInput(param, value)}
      </div>
    );
  };

  const renderInput = (param: ParamDef, value: any) => {
    switch (param.type) {
      case 'number':
        return (
          <input
            type="range"
            aria-label={param.name}
            min={param.min}
            max={param.max}
            step={param.step}
            value={value}
            onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
            className={`apple-slider ${mobile ? 'mobile-slider' : ''}`}
          />
        );
      case 'boolean':
        return (
          <button
            onClick={() => handleParamChange(param.id, !value)}
            role="switch"
            aria-label={param.name}
            aria-checked={value}
            className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-canvas-switch' : 'bg-canvas-white/20'} relative cursor-pointer border border-canvas-white/5`}
          >
            <span className={`absolute top-0.5 left-0.5 bg-canvas-white w-5 h-5 rounded-full transition-transform shadow-sm ${value ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        );
      case 'color':
        return (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-canvas-white/20 shadow-sm relative shrink-0">
            <input
              type="color"
              aria-label={param.name}
              value={value}
              onChange={(e) => handleParamChange(param.id, e.target.value)}
              className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
        );
      case 'string':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            className="w-full bg-canvas-white/5 border border-canvas-line text-canvas-text text-sm rounded-lg block p-2.5 focus:outline-none focus:border-canvas-white/30 transition-colors"
          />
        );
      case 'enum':
        return (
          <div className="relative">
          <select
            aria-label={param.name}
            value={value}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            className="w-full appearance-none bg-canvas-white/5 border border-canvas-line text-canvas-text text-sm rounded-lg block pl-3 pr-9 py-2.5 cursor-pointer focus:outline-none focus:border-canvas-white/30 transition-colors"
          >
            {param.options?.map(opt => (
              <option key={opt} value={opt} className="bg-canvas-surface text-canvas-text">{opt}</option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-canvas-text/70" />
          </div>
        );
      case 'color-array':
        return (
          <div className={`flex gap-2 flex-wrap ${embedded ? '' : 'bg-canvas-white/5 p-2 rounded-xl border border-canvas-line'}`}>
            {(value as string[]).map((color, idx) => (
              <div key={idx} className="w-6 h-6 rounded-full overflow-hidden border border-canvas-white/20 shadow-sm relative shrink-0">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newPalette = [...value];
                    newPalette[idx] = e.target.value;
                    handleParamChange(param.id, newPalette);
                  }}
                  className="w-[200%] h-[200%] absolute top-[-50%] left-[-50%] cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${mobile || embedded ? 'w-full bg-canvas-surface' : 'w-80 glass-panel canvas-panel-shadow-right'} h-full flex flex-col overflow-hidden text-canvas-text/90 z-20`}>
      <div className="p-4 border-b border-canvas-line">
        <h2 className={`${embedded ? 'text-sm' : 'text-lg'} font-semibold tracking-tight`}>{config.generated?.title ?? template.name}</h2>
        <p className="text-xs text-canvas-text/50 mt-1.5 leading-relaxed">
          {config.generated ? 'Controls created for this artwork. Changes update the live sketch.' : template.description}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {template.presets && template.presets.length > 0 && (
          <div className="mb-6 pb-6 border-b border-canvas-line">
            <label className="text-xs font-semibold text-canvas-text/50 uppercase tracking-wider mb-3 block">Presets</label>
            <div className="flex flex-wrap gap-2">
              {template.presets.map((preset, idx) => (
                <button aria-pressed={Object.entries(preset.params).every(([key, value]) => JSON.stringify(config.params[key]) === JSON.stringify(value))}
                  key={idx}
                  onClick={() => onChange({ ...config, params: { ...config.params, ...preset.params } })}
                  className={`px-3 py-1.5 text-xs hover:bg-canvas-white/10 rounded-full border border-canvas-line transition-colors cursor-pointer active:scale-95 ${Object.entries(preset.params).every(([key, value]) => JSON.stringify(config.params[key]) === JSON.stringify(value)) ? 'bg-canvas-white text-canvas-bg hover:bg-canvas-white/90' : 'bg-canvas-white/5 text-canvas-text/80 hover:text-canvas-text'}`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {embedded && <div className="mb-3 flex items-center justify-between"><h3 className="text-[13px] font-medium">Controls</h3><span className="text-xs text-canvas-text/45">{Object.values(grouped).flat().length} controls</span></div>}
        {embedded ? (config.generated?.controls ?? template.params).filter(param => param.type !== 'code').map(renderControl) : Object.entries(grouped).map(([cat, params]) => {
          if (params.length === 0) return null;
          return (
            <div key={cat} className="mb-5">
              <div className={`text-[10px] font-semibold text-canvas-text/40 uppercase tracking-widest mb-3 pb-1 border-b border-canvas-white/5 ${embedded ? 'sr-only' : ''}`}>
                {categoryLabels[cat] || cat}
              </div>
              <div className="space-y-2">
                {params.map(renderControl)}
              </div>
            </div>
          );
        })}
        <details className="border-t border-canvas-line pt-4">
          <summary className="cursor-pointer text-xs font-semibold text-canvas-text/65">Advanced</summary>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-canvas-text/65">Random seed · {config.seed}</span>
            <button onClick={handleSeedChange} className="flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-canvas-white/10 px-3 text-xs hover:bg-canvas-white/20">
              <RefreshCw size={14} /> New seed
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
