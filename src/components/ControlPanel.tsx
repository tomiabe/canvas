import React from 'react';
import { SketchConfig, Template, ParamDef, ParamCategory } from '../types';
import { templates } from '../templates';
import { RefreshCw, Info } from 'lucide-react';

interface ControlPanelProps {
  config: SketchConfig;
  onChange: (config: SketchConfig) => void;
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

export function ControlPanel({ config, onChange }: ControlPanelProps) {
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

    return (
      <div key={param.id} className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-white/80">{param.name}</label>
            {param.description && (
              <span className="group relative">
                <Info size={12} className="text-white/30 cursor-help" />
                <span className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-[#1c1c1e] text-white/80 text-[10px] px-2 py-1 rounded-md border border-white/10 whitespace-nowrap shadow-lg z-50 pointer-events-none">
                  {param.description}
                </span>
              </span>
            )}
          </div>
          {param.type === 'number' && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-white/50 font-mono">{value}</span>
              {param.suffix && <span className="text-[10px] text-white/30">{param.suffix}</span>}
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
            className="apple-slider"
          />
        );
      case 'boolean':
        return (
          <button
            onClick={() => handleParamChange(param.id, !value)}
            role="switch"
            aria-label={param.name}
            aria-checked={value}
            className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-[#34C759]' : 'bg-white/20'} relative cursor-pointer border border-white/5`}
          >
            <span className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform shadow-sm ${value ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        );
      case 'color':
        return (
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-sm relative shrink-0">
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
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg block p-2.5 focus:outline-none focus:border-white/30 transition-colors"
          />
        );
      case 'enum':
        return (
          <select
            aria-label={param.name}
            value={value}
            onChange={(e) => handleParamChange(param.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg block p-2.5 cursor-pointer appearance-none focus:outline-none focus:border-white/30 transition-colors"
          >
            {param.options?.map(opt => (
              <option key={opt} value={opt} className="bg-[#1c1c1e] text-white">{opt}</option>
            ))}
          </select>
        );
      case 'color-array':
        return (
          <div className="flex gap-2.5 flex-wrap bg-white/5 p-2 rounded-xl border border-white/10">
            {(value as string[]).map((color, idx) => (
              <div key={idx} className="w-6 h-6 rounded-full overflow-hidden border border-white/20 shadow-sm relative shrink-0">
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
    <div className="w-80 glass-panel h-full flex flex-col overflow-hidden text-white/90 shadow-[10px_0_30px_rgba(0,0,0,0.5)] z-20">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold tracking-tight">{config.generated?.title ?? template.name}</h2>
        <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
          {config.generated ? 'Controls created for this artwork. Changes update the live sketch.' : template.description}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {template.presets && template.presets.length > 0 && (
          <div className="mb-6 pb-6 border-b border-white/10">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 block">Presets</label>
            <div className="flex flex-wrap gap-2">
              {template.presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => onChange({ ...config, params: { ...config.params, ...preset.params } })}
                  className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-full border border-white/10 transition-colors cursor-pointer active:scale-95"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Random Seed</label>
            <button
              onClick={handleSeedChange}
              className="p-1.5 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer"
              title="Generate new seed"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="text-xs font-mono text-white/60 bg-black/40 px-3 py-2 rounded-lg border border-white/5 text-center tracking-wider">
            {config.seed}
          </div>
        </div>

        {Object.entries(grouped).map(([cat, params]) => {
          if (params.length === 0) return null;
          return (
            <div key={cat} className="mb-5">
              <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-3 pb-1 border-b border-white/5">
                {categoryLabels[cat] || cat}
              </div>
              <div className="space-y-2">
                {params.map(renderControl)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
