import React, { useEffect, useRef } from 'react';
import { SketchConfig } from '../types';
import { generateHtml } from '../engine/generator';

interface CanvasRunnerProps {
  config: SketchConfig;
  exportTrigger?: number;
}

export function CanvasRunner({ config, exportTrigger }: CanvasRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const html = generateHtml(config);
      iframeRef.current.srcdoc = html;
    }
  }, [config]);

  useEffect(() => {
    if (exportTrigger && iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'export' }, '*');
    }
  }, [exportTrigger]);

  return (
    <div className="w-full h-full bg-neutral-900 overflow-hidden relative">
      <iframe
        ref={iframeRef}
        title="p5-canvas"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-downloads"
      />
    </div>
  );
}
