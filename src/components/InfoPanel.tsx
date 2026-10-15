import React from 'react';
import { Template } from '../types';
import { X, MousePointer2, Sliders, Sparkles, Download, Wand2 } from 'lucide-react';

interface InfoPanelProps {
  template: Template | null;
  onClose: () => void;
}

const generalSteps = [
  { icon: Sparkles, label: 'Describe it', desc: 'Type what you want to see: a mood, a motion, a subject. AI writes the sketch for you.' },
  { icon: Wand2, label: 'Refine by prompting', desc: "Click the sparkle button (bottom center) and describe a change, like 'slower' or 'more pink'." },
  { icon: Sliders, label: 'Adjust your artwork', desc: 'Open Adjust beside the artwork name to tweak colors, speed, and other parameters.' },
  { icon: MousePointer2, label: 'Start from an example', desc: 'Or pick one of the templates on the left and build from there.' },
  { icon: Download, label: 'Export', desc: 'Save as PNG, animated GIF, or video, or download the p5.js source code.' },
];

export function InfoPanel({ template, onClose }: InfoPanelProps) {
  return (
    <aside aria-label="Help" className="w-80 shrink-0 h-full glass-panel border-l border-white/10 z-30 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold tracking-tight">
          {template ? template.name : 'Getting Started'}
        </h3>
        <button
          onClick={onClose}
          aria-label="Close help"
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
    </aside>
  );
}
