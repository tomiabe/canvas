import React, { useEffect, useRef, useState } from 'react';
import { SketchConfig } from '../types';
import { generateHtml } from '../engine/generator';
import { templates } from '../templates';
import { EyeOff, MousePointer2, Sliders, Sparkles, Download, Palette, AlertTriangle } from 'lucide-react';

export interface ExportEvent {
  type: 'png' | 'gif' | 'video';
  duration?: number;
  fps?: number;
}

interface CanvasRunnerProps {
  config: SketchConfig;
  exportEvent?: ExportEvent | null;
  previewEnabled?: boolean;
}

const blankSteps = [
  { icon: MousePointer2, label: 'Pick a template', desc: 'Choose from 50+ templates in the gallery on the left' },
  { icon: Sliders, label: 'Tweak settings', desc: 'Open the Settings panel to adjust colors, speeds, and more' },
  { icon: Sparkles, label: 'AI generate', desc: 'Describe what you want and let AI create it for you' },
  { icon: Download, label: 'Export', desc: 'Save as PNG, GIF, video, or download the p5.js source code' },
];

export function CanvasRunner({ config, exportEvent, previewEnabled = true }: CanvasRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sketchError, setSketchError] = useState<string | null>(null);

  // Reload the iframe when the template or seed changes
  useEffect(() => {
    if (!config.templateId || !previewEnabled || !iframeRef.current) return;
    setSketchError(null);
    iframeRef.current.srcdoc = generateHtml(config);
  }, [config.templateId, config.seed, previewEnabled]);

  // For templates that support live params: postMessage instead of reload
  // For all others: reload so param changes take effect immediately
  useEffect(() => {
    if (!config.templateId || !previewEnabled || !iframeRef.current) return;
    const template = templates[config.templateId];
    if (template?.supportsLiveParams) {
      iframeRef.current.contentWindow?.postMessage(
        { type: 'params-update', params: config.params },
        '*'
      );
    } else {
      setSketchError(null);
      iframeRef.current.srcdoc = generateHtml(config);
    }
  }, [config.params, previewEnabled]);

  useEffect(() => {
    if (config.templateId && previewEnabled && exportEvent && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'export',
        exportType: exportEvent.type,
        duration: exportEvent.duration,
        fps: exportEvent.fps,
      }, '*');
    }
  }, [exportEvent, previewEnabled, config.templateId]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'sketch-error') {
        setSketchError(event.data.message || 'Unknown error in generated sketch');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (!config.templateId) {
    return (
      <div className="w-full h-full bg-[#0b0b0d] overflow-hidden relative border-none flex items-center justify-center">
        <div className="max-w-md text-center px-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6">
            <Palette size={32} className="text-white/30" strokeWidth={1} />
          </div>
          <h2 className="text-lg font-semibold text-white/60 mb-2">Welcome to Canvas</h2>
          <p className="text-sm text-white/30 mb-8 leading-relaxed">
            A generative art studio in your browser. No coding required.
          </p>
          <div className="space-y-4 text-left">
            {blankSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-white/40" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/60">{step.label}</div>
                    <div className="text-xs text-white/30 mt-0.5">{step.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!previewEnabled) {
    return (
      <div className="w-full h-full bg-[#0b0b0d] overflow-hidden relative border-none flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-white/25">
          <EyeOff size={48} strokeWidth={1} />
          <span className="text-sm font-medium">Preview paused</span>
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
        allow="microphone"
      />
      {sketchError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center pointer-events-none">
          <AlertTriangle className="text-amber-400" size={28} />
          <p className="text-sm text-white/80 font-medium">The generated sketch hit an error</p>
          <p className="text-xs text-white/40 max-w-md font-mono">{sketchError}</p>
          <p className="text-xs text-white/40">Try regenerating with a different description.</p>
        </div>
      )}
    </div>
  );
}
