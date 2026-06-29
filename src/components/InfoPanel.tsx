import React from 'react';
import { Template } from '../types';
import { X, MousePointer2, Sliders, Sparkles, Download, Eye } from 'lucide-react';

interface InfoPanelProps {
  template: Template | null;
  onClose: () => void;
}

const generalSteps = [
  { icon: MousePointer2, label: 'Select a template', desc: 'Browse the gallery on the left and pick a template that interests you.' },
  { icon: Sliders, label: 'Adjust settings', desc: 'Open the Settings panel from the top bar to tweak parameters, colors, and presets.' },
  { icon: Eye, label: 'Preview & pause', desc: 'Use the Preview button to pause/resume the canvas rendering at any time.' },
  { icon: Sparkles, label: 'AI prompt', desc: 'Click the sparkle button (bottom center) to describe your design in words and let AI generate it.' },
  { icon: Download, label: 'Export', desc: 'Export as PNG, animated GIF, video, or download the p5.js source code.' },
];

export function InfoPanel({ template, onClose }: InfoPanelProps) {
  return (
    <div className="absolute right-0 top-0 w-80 h-full glass-panel border-l border-white/10 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold tracking-tight">
          {template ? template.name : 'Getting Started'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors cursor-pointer active:scale-95"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {template && (
          <div className="mb-5 pb-5 border-b border-white/10">
            <p className="text-xs text-white/60 leading-relaxed">{template.description}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">
            {template ? `How to use "${template.name}"` : 'How to use Canvas'}
          </div>

          {generalSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-white/50" />
                </div>
                <div>
                  <div className="text-xs font-medium text-white/80">{step.label}</div>
                  <div className="text-[11px] text-white/40 leading-relaxed mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
