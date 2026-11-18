import React from 'react';
import { Template } from '../types';
import { X, MousePointer2, Sliders, Sparkles, Download, Wand2 } from 'lucide-react';

interface InfoPanelProps {
  template: Template | null;
  title?: string;
  onClose: () => void;
}

const generalSteps = [
  { icon: Sparkles, label: 'Describe it', desc: 'Type what you want to see: a mood, a motion, a subject. AI writes the sketch for you.' },
  { icon: Wand2, label: 'Refine by prompting', desc: "Use the prompt below the preview and describe a change, like 'slower' or 'more pink'." },
  { icon: Sliders, label: 'Adjust your artwork', desc: 'Open the Adjust tab on the right to tweak colors, speed, and other parameters.' },
  { icon: MousePointer2, label: 'Start from an example', desc: 'Or pick one of the templates on the left and build from there.' },
  { icon: Download, label: 'Export', desc: 'Save as PNG, animated GIF, or video, or download the p5.js source code.' },
];

export function InfoPanel({ template, title, onClose }: InfoPanelProps) {
  return (
    <aside aria-label="Help" className="w-80 shrink-0 h-full glass-panel border-l border-canvas-line z-30 canvas-panel-shadow-left flex flex-col">
      <div className="p-4 border-b border-canvas-line flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold tracking-tight">
          {title ?? template?.name ?? 'Getting Started'}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close help"
          className="p-1.5 hover:bg-canvas-white/10 rounded-lg text-canvas-text/40 hover:text-canvas-text transition-colors cursor-pointer active:scale-95"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {template && (
          <div className="mb-5 pb-5 border-b border-canvas-line">
            <p className="text-xs text-canvas-text/60 leading-relaxed">{title ? 'An original AI-generated artwork with live controls in Adjust.' : template.description}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="text-[10px] font-semibold text-canvas-text/40 uppercase tracking-widest">
            {template ? `How to use "${title ?? template.name}"` : 'How to use Canvas'}
          </div>

          {generalSteps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-canvas-white/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={13} className="text-canvas-text/50" />
                </div>
                <div>
                  <div className="text-xs font-medium text-canvas-text/80">{step.label}</div>
                  <div className="text-[11px] text-canvas-text/40 leading-relaxed mt-0.5">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
