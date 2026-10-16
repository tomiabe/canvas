import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { TemplateGallery } from './components/TemplateGallery';
import { ControlPanel } from './components/ControlPanel';
import { CanvasRunner } from './components/CanvasRunner';
import { CodeViewer } from './components/CodeViewer';
import { PromptBar } from './components/PromptBar';
import { InfoPanel } from './components/InfoPanel';
import { SketchConfig } from './types';
import { templates } from './templates';
import { AIServiceError, generateConfigFromPrompt } from './lib/ai';
import { Sparkles } from 'lucide-react';

function lerpValue(a: any, b: any, t: number): any {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (typeof a === 'string' && /^#[0-9a-f]{6}$/i.test(a) && /^#[0-9a-f]{6}$/i.test(b)) {
    const r1 = parseInt(a.slice(1, 3), 16), g1 = parseInt(a.slice(3, 5), 16), b1 = parseInt(a.slice(5, 7), 16);
    const r2 = parseInt(b.slice(1, 3), 16), g2 = parseInt(b.slice(3, 5), 16), b2 = parseInt(b.slice(5, 7), 16);
    const rr = Math.round(r1 + (r2 - r1) * t);
    const gg = Math.round(g1 + (g2 - g1) * t);
    const bb = Math.round(b1 + (b2 - b1) * t);
    return '#' + [rr, gg, bb].map(c => c.toString(16).padStart(2, '0')).join('');
  }
  return t < 0.5 ? a : b;
}

function lerpConfig(from: SketchConfig, to: SketchConfig, t: number): SketchConfig {
  if (from.templateId !== to.templateId) return to;
  const params: Record<string, any> = {};
  for (const key of Object.keys(to.params)) {
    params[key] = lerpValue(from.params[key], to.params[key], t);
  }
  return { ...to, params };
}

function useAnimatedConfig(config: SketchConfig, morphDuration = 400): SketchConfig {
  const [displayed, setDisplayed] = useState(config);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<{ from: SketchConfig; to: SketchConfig; startTime: number } | null>(null);

  useEffect(() => {
    if (startRef.current && startRef.current.to.templateId === config.templateId) {
      const sameTemplate = config.templateId === startRef.current.to.templateId;
      const sameParams = Object.keys(config.params).every(
        k => config.params[k] === startRef.current!.to.params[k]
      );
      if (sameTemplate && sameParams) return;
    }

    if (startRef.current?.animRef) cancelAnimationFrame(startRef.current.animRef as unknown as number);
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const from = displayed;
    const to = config;
    const startTime = performance.now();

    if (to.templateId === 'custom-sketch' || from.templateId !== to.templateId || morphDuration <= 0 || !from.templateId || !to.templateId) {
      setDisplayed(to);
      return;
    }

    startRef.current = { from, to, startTime };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / morphDuration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(lerpConfig(from, to, eased));
      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayed(to);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [config, morphDuration]);

  return displayed;
}

export default function App() {
  const [config, setConfig] = useState<SketchConfig>({
    templateId: '',
    seed: Math.floor(Math.random() * 1000000),
    params: {},
  });

  const animatedConfig = useAnimatedConfig(config);

  const hasTemplate = !!config.templateId && !!templates[config.templateId];
  const activeTemplate = hasTemplate ? templates[config.templateId] : null;

  const [panel, setPanel] = useState<'adjust' | 'code' | 'help' | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [exportEvent, setExportEvent] = useState<{ type: 'png' | 'gif' | 'video'; duration?: number; fps?: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);
  const [candidate, setCandidate] = useState<{ config: SketchConfig; id: number } | null>(null);
  const [status, setStatus] = useState('');
  const [failure, setFailure] = useState('');
  const lastPrompt = useRef('');
  const generation = useRef(0);
  const validation = useRef<{ id: number; resolve: () => void; reject: (error: Error) => void } | null>(null);
  const activeRepair = useRef<{ config: SketchConfig; prompt: string; remaining: number; fallback: SketchConfig } | null>(null);

  const cancelGeneration = () => {
    generation.current++;
    activeRepair.current = null;
    validation.current?.reject(new Error('Cancelled'));
    validation.current = null;
    setCandidate(null);
    setIsGenerating(false);
    setStatus('');
    setFailure('');
  };

  const handleExport = (type: 'png' | 'gif' | 'video') => {
    setExportEvent({ type, duration: type === 'gif' ? 3 : 5, fps: 15 });
  };

  const handleGenerate = async (prompt: string, recovery?: { broken: SketchConfig; error: string; remaining: number; fallback: SketchConfig }) => {
    cancelGeneration();
    const id = generation.current;
    lastPrompt.current = prompt;
    setIsGenerating(true);
    let attemptConfig = recovery?.broken ?? config;
    let repair: string | undefined = recovery?.error;
    const fallback = recovery?.fallback ?? config;
    const maxAttempt = recovery ? recovery.remaining - 1 : 2;
    try {
      for (let attempt = 0; attempt <= maxAttempt; attempt++) {
        setStatus(repair ? 'Fixing your sketch…' : 'Writing your sketch…');
        try {
          const newConfig = await generateConfigFromPrompt(prompt, attemptConfig, repair);
          if (id !== generation.current) return;
          attemptConfig = newConfig;
          setStatus('Testing your sketch…');
          await new Promise<void>((resolve, reject) => {
            validation.current = { id: id * 3 + attempt, resolve, reject };
            setCandidate({ config: newConfig, id: id * 3 + attempt });
          });
          if (id !== generation.current) return;
          activeRepair.current = { config: newConfig, prompt, remaining: maxAttempt - attempt, fallback };
          setConfig(newConfig);
          setPanel('adjust');
          setConfigVersion(v => v + 1);
          return;
        } catch (error) {
          if (id !== generation.current) return;
          setCandidate(null);
          validation.current = null;
          if (error instanceof AIServiceError || attempt === maxAttempt) throw error;
          repair = error instanceof Error ? error.message : 'The sketch failed to run.';
        }
      }
    } catch (error) {
      if (id !== generation.current) return;
      setFailure(error instanceof AIServiceError
        ? error.message
        : 'This sketch still could not run after two repairs. Try a simpler description.');
    } finally {
      if (id === generation.current) {
        setCandidate(null);
        validation.current = null;
        setIsGenerating(false);
        setStatus('');
      }
    }
  };

  const handleConfigChange = useCallback((newConfig: SketchConfig) => {
    const active = activeRepair.current;
    cancelGeneration();
    if (active && active.config.templateId === newConfig.templateId && active.config.seed === newConfig.seed &&
        active.config.params.code === newConfig.params.code) {
      activeRepair.current = { ...active, config: newConfig };
    }
    setConfig(newConfig);
    setConfigVersion(v => v + 1);
  }, []);

  const hasAnyTemplate = !!config.templateId;

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden font-sans antialiased relative">
      <TopBar
        config={config}
        onExport={handleExport}
        onToggleCode={() => setPanel(panel === 'code' ? null : 'code')}
        showCode={panel === 'code'}
        showSettings={panel === 'adjust'}
        onToggleSettings={() => setPanel(panel === 'adjust' ? null : 'adjust')}
        previewEnabled={previewEnabled}
        onTogglePreview={() => setPreviewEnabled(!previewEnabled)}
        onToggleInfo={() => setPanel(panel === 'help' ? null : 'help')}
        showInfo={panel === 'help'}
        hasTemplate={hasAnyTemplate}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <TemplateGallery config={config} onChange={handleConfigChange} />

        <div className="flex-1 min-w-0 relative">
          <CanvasRunner config={animatedConfig} exportEvent={exportEvent} previewEnabled={previewEnabled}
            onError={message => {
              const active = activeRepair.current;
              if (!active || active.config.params.code !== animatedConfig.params.code) return;
              activeRepair.current = null;
              setConfig(active.fallback);
              if (active.remaining > 0) {
                void handleGenerate(active.prompt, { broken: active.config, error: message, remaining: active.remaining, fallback: active.fallback });
              } else {
                setFailure('This sketch still could not run after two repairs. Try a simpler description.');
              }
            }} />

          {candidate && (
            <div key={candidate.id} className="absolute inset-0 opacity-0 pointer-events-none" aria-hidden="true">
              <CanvasRunner config={candidate.config}
                onReady={() => { if (validation.current?.id === candidate.id) validation.current.resolve(); }}
                onError={message => { if (validation.current?.id === candidate.id) validation.current.reject(new Error(message)); }} />
            </div>
          )}

          {!hasAnyTemplate && (
            <PromptBar variant="hero" onGenerate={handleGenerate} isLoading={isGenerating} />
          )}

          {hasAnyTemplate && !showPrompt && (
            <button
              onClick={() => setShowPrompt(true)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-10 h-10 rounded-full glass-panel flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors shadow-lg"
              title="Open AI prompt"
            >
              <Sparkles size={18} className="text-white/80" />
            </button>
          )}

          {hasAnyTemplate && showPrompt && (
            <PromptBar
              onGenerate={handleGenerate}
              isLoading={isGenerating}
              onClose={() => setShowPrompt(false)}
              config={config}
            />
          )}

          {(status || failure) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[min(90%,32rem)] rounded-xl border border-white/15 bg-zinc-900/95 px-4 py-3 shadow-xl">
              <p role={failure ? 'alert' : 'status'} className="text-sm text-white/90">{failure || status}</p>
              {hasAnyTemplate && <p className="mt-1 text-xs text-white/50">Your previous artwork is unchanged.</p>}
              <div className="flex gap-4 mt-2 text-xs">
                {failure && <button className="underline cursor-pointer" onClick={() => handleGenerate(lastPrompt.current)}>Retry</button>}
                <button className="text-white/60 hover:text-white cursor-pointer" onClick={cancelGeneration}>{failure ? 'Dismiss' : 'Cancel'}</button>
              </div>
            </div>
          )}
        </div>

        {panel === 'adjust' && hasAnyTemplate && (
          <aside aria-label="Adjust artwork" className="w-80 shrink-0 border-l border-white/10">
            <ControlPanel config={config} onChange={handleConfigChange} />
          </aside>
        )}
        {panel === 'code' && hasAnyTemplate && (
          <CodeViewer config={config} onChange={handleConfigChange} />
        )}
        {panel === 'help' && (
          <InfoPanel template={activeTemplate} title={config.generated?.title} onClose={() => setPanel(null)} />
        )}
      </div>
    </div>
  );
}
