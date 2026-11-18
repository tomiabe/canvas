import React, { useEffect, useRef, useState } from 'react';
import { SketchConfig } from '../types';
import { generateHtml } from '../engine/generator';
import { templates } from '../templates';
import { EyeOff, AlertTriangle, Loader2 } from 'lucide-react';

export interface ExportEvent {
  type: 'png' | 'gif' | 'video';
  duration?: number;
  fps?: number;
}

interface CanvasRunnerProps {
  config: SketchConfig;
  exportEvent?: ExportEvent | null;
  previewEnabled?: boolean;
  onReady?: () => void;
  onError?: (message: string) => void;
  onExportResult?: (result: { type: 'png' | 'gif' | 'video'; ok: boolean; message?: string }) => void;
}

export function CanvasRunner({ config, exportEvent, previewEnabled = true, onReady, onError, onExportResult }: CanvasRunnerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sketchError, setSketchError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const callbacks = useRef({ onReady, onError, onExportResult });
  callbacks.current = { onReady, onError, onExportResult };
  const exportType = useRef<'png' | 'gif' | 'video'>('png');
  const runId = useRef('');
  const libraryKey = (config.libraries ?? templates[config.templateId]?.libraries ?? []).join(',');

  // Code edits/new generations reload; live control changes do not.
  useEffect(() => {
    if (!config.templateId || !previewEnabled || !iframeRef.current) return;
    setSketchError(null);
    setIsReady(false);
    runId.current = crypto.randomUUID();
    try {
      iframeRef.current.srcdoc = generateHtml(config, runId.current);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid sketch code';
      setSketchError(message);
      callbacks.current.onError?.(message);
    }
  }, [config.templateId, config.seed, config.params.code, libraryKey, previewEnabled]);

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
      setIsReady(false);
      runId.current = crypto.randomUUID();
      iframeRef.current.srcdoc = generateHtml(config, runId.current);
    }
  }, [config.params, previewEnabled]);

  useEffect(() => {
    if (config.templateId && previewEnabled && exportEvent && iframeRef.current && iframeRef.current.contentWindow) {
      exportType.current = exportEvent.type;
      iframeRef.current.contentWindow.postMessage({
        type: 'export',
        exportType: exportEvent.type,
        duration: exportEvent.duration,
        fps: exportEvent.fps,
      }, '*');
    }
  }, [exportEvent, previewEnabled, config.templateId]);

  useEffect(() => {
    if (!config.templateId || !previewEnabled) return;
    let settled = false;
    let readyTimer: ReturnType<typeof setTimeout>;
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(readyTimer);
      setSketchError(message);
      callbacks.current.onError?.(message);
    };
    // Allow CDN loading separately from the short draw probation period.
    const deadline = setTimeout(() => fail('The sketch did not draw a canvas within 15 seconds.'), 15000);
    const handler = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow || event.data?.runId !== runId.current) return;
      if (event.data?.type === 'export-success') {
        callbacks.current.onExportResult?.({ type: exportType.current, ok: true });
      } else if (event.data?.type === 'export-error') {
        callbacks.current.onExportResult?.({ type: exportType.current, ok: false, message: event.data.message });
      } else if (event.data?.type === 'sketch-error') {
        fail(event.data.message || 'Unknown error in generated sketch');
      } else if (event.data?.type === 'sketch-ready') {
        clearTimeout(deadline);
        setIsReady(true);
        readyTimer = setTimeout(() => {
          if (!settled) callbacks.current.onReady?.();
        }, 2000);
      }
    };
    window.addEventListener('message', handler);
    return () => {
      clearTimeout(deadline);
      clearTimeout(readyTimer);
      window.removeEventListener('message', handler);
    };
  }, [config.templateId, config.seed, config.params.code, libraryKey, previewEnabled]);

  // The empty state (hero prompt) is rendered by App on top of this background.
  if (!config.templateId) {
    return <div className="w-full h-full bg-canvas-preview" />;
  }

  if (!previewEnabled) {
    return (
      <div className="w-full h-full bg-canvas-preview overflow-hidden relative border-none flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-canvas-text/25">
          <EyeOff size={48} strokeWidth={1} />
          <span className="text-sm font-medium">Preview paused</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-canvas-preview overflow-hidden relative border-none">
      <iframe
        ref={iframeRef}
        title="p5-canvas"
        className="w-full h-full border-none"
        sandbox={config.templateId === 'custom-sketch'
          ? 'allow-scripts allow-downloads'
          : 'allow-scripts allow-downloads allow-same-origin allow-popups'}
        allow="microphone"
        onLoad={() => {
          // Catch changes made while p5 and the sketch were still loading.
          if (templates[config.templateId]?.supportsLiveParams) {
            iframeRef.current?.contentWindow?.postMessage({ type: 'params-update', params: config.params }, '*');
          }
        }}
      />
      {!isReady && !sketchError && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-canvas-preview text-sm text-canvas-muted">
        <Loader2 size={17} className="animate-spin" /> Loading sketch…
      </div>}
      {sketchError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-canvas-bg/80 px-6 text-center pointer-events-none">
          <AlertTriangle className="text-amber-400" size={28} />
          <p className="text-sm text-canvas-text/80 font-medium">The generated sketch hit an error</p>
          <p className="text-xs text-canvas-text/40 max-w-md font-mono">{sketchError}</p>
          <p className="text-xs text-canvas-text/40">{config.generated ? 'Try regenerating with a different description.' : 'Try another preset or template.'}</p>
        </div>
      )}
    </div>
  );
}
