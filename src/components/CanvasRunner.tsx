import React, { useEffect, useRef } from 'react';
import { SketchConfig } from '../types';
import { generateHtml } from '../engine/generator';
import { Sparkles } from 'lucide-react';

interface CanvasRunnerProps {
  config: SketchConfig;
  exportTrigger?: number;
  isStarted: boolean;
}

export function CanvasRunner({ config, exportTrigger, isStarted }: CanvasRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!isStarted) return;
    if (iframeRef.current) {
      iframeRef.current.srcdoc = generateHtml(config);
    }
  }, [config, isStarted]);

  useEffect(() => {
    if (exportTrigger && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'export' }, '*');
    }
  }, [exportTrigger]);

  if (!isStarted) {
    return (
      <div className="w-full h-full bg-[#0b0b0d] flex flex-col items-center justify-center gap-6 select-none">
        <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Sparkles className="text-white/40" size={28} />
          </div>
          <h2 className="text-2xl font-semibold text-white/80 tracking-tight">Start creating</h2>
          <p className="text-sm text-white/40 leading-relaxed">
            Pick a template from the dropdown above, or describe your idea in the prompt bar below — no code needed.
          </p>
        </div>

        <div className="flex gap-3 mt-2">
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">
            ← Choose a template
          </div>
          <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/40">
            Describe an idea ↓
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0b0b0d] overflow-hidden relative border-none">
      <iframe
        ref={iframeRef}
        title="p5-canvas"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-downloads allow-same-origin allow-popups"
      />
    </div>
  );
}
