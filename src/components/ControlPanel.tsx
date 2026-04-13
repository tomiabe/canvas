import React from 'react';
import { SketchConfig, Template, ParamDef } from '../types';
import { templates } from '../templates';
import { RefreshCw } from 'lucide-react';

interface ControlPanelProps {
  config: SketchConfig;
  onChange: (config: SketchConfig) => void;
}

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

  const renderControl = (param: ParamDef) => {
    const value = config.params[param.id] ?? param.default;

    switch (param.type) {
      case 'number':
        return (
          <div key={param.id} className="mb-4">
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-neutral-300">{param.name}</label>
              <span className="text-xs text-neutral-500">{value}</span>
            </div>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={value}
              onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        );
      case 'boolean':
        return (
          <div key={param.id} className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">{param.name}</label>
            <button
              onClick={() => handleParamChange(param.id, !value)}
              className={`w-10 h-5 rounded-full transition-colors ${value ? 'bg-indigo-500' : 'bg-neutral-700'} relative cursor-pointer`}
            >
              <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        );
      case 'color':
        return (
          <div key={param.id} className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium text-neutral-300">{param.name}</label>
            <input
              type="color"
              value={value}
              onChange={(e) => handleParamChange(param.id, e.target.value)}
              className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
            />
          </div>
        );
      case 'enum':
        return (
          <div key={param.id} className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-1">{param.name}</label>
            <select
              value={value}
              onChange={(e) => handleParamChange(param.id, e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm rounded-md focus:ring-indigo-500 focus:border-indigo-500 block p-2 cursor-pointer"
            >
              {param.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );
      case 'color-array':
        return (
          <div key={param.id} className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">{param.name}</label>
            <div className="flex gap-2 flex-wrap">
              {(value as string[]).map((color, idx) => (
                <input
                  key={idx}
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newPalette = [...value];
                    newPalette[idx] = e.target.value;
                    handleParamChange(param.id, newPalette);
                  }}
                  className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 h-full flex flex-col overflow-hidden text-neutral-200">
      <div className="p-4 border-b border-neutral-800">
        <h2 className="text-lg font-semibold">{template.name}</h2>
        <p className="text-xs text-neutral-400 mt-1">{template.description}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {template.presets && template.presets.length > 0 && (
          <div className="mb-6 pb-6 border-b border-neutral-800">
            <label className="text-sm font-medium text-neutral-300 mb-2 block">Presets</label>
            <div className="flex flex-wrap gap-2">
              {template.presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => onChange({ ...config, params: { ...config.params, ...preset.params } })}
                  className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-indigo-600 hover:text-white rounded border border-neutral-700 hover:border-indigo-500 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 pb-6 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-neutral-300">Random Seed</label>
            <button 
              onClick={handleSeedChange}
              className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Generate new seed"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="text-xs font-mono text-neutral-500 bg-neutral-950 p-2 rounded border border-neutral-800">
            {config.seed}
          </div>
        </div>

        <div className="space-y-2">
          {template.params.map(renderControl)}
        </div>
      </div>
    </div>
  );
}
