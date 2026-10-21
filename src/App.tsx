import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { TopBar } from './components/TopBar';
import { TemplateGallery } from './components/TemplateGallery';
import { ControlPanel } from './components/ControlPanel';
import { CanvasRunner } from './components/CanvasRunner';
import { CodeViewer } from './components/CodeViewer';
import { PromptBar } from './components/PromptBar';
import { InfoPanel } from './components/InfoPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { DesktopNotice } from './components/DesktopNotice';
import { SketchConfig } from './types';
import { templates } from './templates';
import { AIServiceError, AIUsage, GenerationMode, generateConfigFromPrompt, getAIUsage } from './lib/ai';
import { ConversationTurn, StudioAction, createStudio, createVersion, loadStudio, saveStudio, studioReducer } from './lib/studio';
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

    if (to.templateId === 'custom-sketch' || to.libraries?.includes('brush') || templates[to.templateId]?.libraries?.includes('brush') || from.templateId !== to.templateId || morphDuration <= 0 || !from.templateId || !to.templateId) {
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
  const [isWide, setIsWide] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const screen = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsWide(screen.matches);
    screen.addEventListener('change', onChange);
    onChange();
    return () => screen.removeEventListener('change', onChange);
  }, []);

  const [restored] = useState(() => {
    try { return { state: loadStudio(window.localStorage), writable: true }; }
    catch { return { state: createStudio(), writable: false }; }
  });
  const [studio, dispatch] = useReducer(studioReducer, restored.state);
  const studioRef = useRef(studio);
  studioRef.current = studio;
  const current = studio.versions.find(v => v.id === studio.currentId)!;
  const config = current.config;
  const [storageWarning, setStorageWarning] = useState(restored.writable ? '' :
    'Saved work could not be restored. This tab will not overwrite it. Export your work before closing.');

  useEffect(() => {
    if (!restored.writable) return;
    try {
      saveStudio(window.localStorage, studio);
      setStorageWarning('');
    } catch {
      setStorageWarning('Autosave is unavailable or browser storage is full. Your latest changes are only in this tab; export your work before closing.');
    }
  }, [studio, restored.writable]);

  const animatedConfig = useAnimatedConfig(config);

  const hasTemplate = !!config.templateId && !!templates[config.templateId];
  const activeTemplate = hasTemplate ? templates[config.templateId] : null;

  const [panel, setPanel] = useState<'adjust' | 'code' | 'help' | 'history' | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptMode, setPromptMode] = useState<GenerationMode>('new');
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [usageUnavailable, setUsageUnavailable] = useState(false);
  const refreshUsage = useCallback(() => {
    void getAIUsage().then(value => { setUsage(value); setUsageUnavailable(false); })
      .catch(() => setUsageUnavailable(true));
  }, []);
  useEffect(() => {
    if (!isWide) return;
    refreshUsage();
    window.addEventListener('focus', refreshUsage);
    return () => window.removeEventListener('focus', refreshUsage);
  }, [isWide, refreshUsage]);
  useEffect(() => {
    if (!isWide || !usage) return;
    const delay = Date.parse(usage.retryAt ?? usage.resetsAt) - Date.now();
    // A device clock ahead of the server must not cause an immediate fetch loop.
    const timer = setTimeout(refreshUsage, delay > 0 ? delay + 250 : 60000);
    return () => clearTimeout(timer);
  }, [isWide, usage, refreshUsage]);
  const usageBlocked = !!usage && (usage.remaining === 0 || !!usage.reason) &&
    Date.parse(usage.retryAt ?? usage.resetsAt) > Date.now();
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [exportEvent, setExportEvent] = useState<{ type: 'png' | 'gif' | 'video'; duration?: number; fps?: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [candidate, setCandidate] = useState<{ config: SketchConfig; id: number } | null>(null);
  const [status, setStatus] = useState('');
  const [failure, setFailure] = useState('');
  const lastPrompt = useRef('');
  const lastMode = useRef<GenerationMode>('new');
  const generation = useRef(0);
  const validation = useRef<{ id: number; resolve: () => void; reject: (error: Error) => void } | null>(null);
  const activeRepair = useRef<{ config: SketchConfig; prompt: string; remaining: number; fallbackId: string; conversation: ConversationTurn[]; mode: GenerationMode; submissionId: string } | null>(null);

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

  const navigateHistory = (action: StudioAction) => {
    cancelGeneration();
    dispatch(action);
  };

  useEffect(() => {
    // A hidden candidate cannot finish preview validation; keep the saved artwork instead.
    if (!isWide) cancelGeneration();
  }, [isWide]);

  useEffect(() => {
    if (!isWide) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const key = event.key.toLowerCase();
      const type = key === 'z' ? (event.shiftKey ? 'redo' : 'undo') : key === 'y' ? 'redo' : null;
      if (!type || !studioRef.current[type].length) return;
      event.preventDefault();
      navigateHistory({ type });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isWide]);

  const handleHome = () => {
    cancelGeneration();
    setPanel(null);
    setShowPrompt(false);
    setPromptMode('new');
    setPreviewEnabled(true);
    if (!config.templateId) return;
    dispatch({ type: 'commit', version: createVersion({ templateId: '', seed: Math.floor(Math.random() * 1000000), params: {} }, [], 'New artwork') });
  };

  const handleExport = (type: 'png' | 'gif' | 'video') => {
    setExportEvent({ type, duration: type === 'gif' ? 3 : 5, fps: 15 });
  };

  const handleGenerate = async (prompt: string, mode: GenerationMode = 'new', recovery?: { broken: SketchConfig; error: string; remaining: number; fallbackId: string; conversation: ConversationTurn[]; submissionId: string }) => {
    cancelGeneration();
    const id = generation.current;
    lastPrompt.current = prompt;
    lastMode.current = mode;
    const submissionId = recovery?.submissionId ?? crypto.randomUUID();
    setIsGenerating(true);
    // A failed first response must not accidentally pull the old artwork into a repair.
    let attemptConfig = recovery?.broken ?? (mode === 'new' ? { templateId: '', seed: Math.floor(Math.random() * 1000000), params: {} } : config);
    let repair: string | undefined = recovery?.error;
    const fallbackId = recovery?.fallbackId ?? current.id;
    const conversation = recovery?.conversation ?? (mode === 'refine' ? current.conversation : []);
    const maxAttempt = recovery ? recovery.remaining - 1 : 2;
    try {
      for (let attempt = 0; attempt <= maxAttempt; attempt++) {
        setStatus(repair ? 'Fixing your sketch…' : 'Writing your sketch…');
        try {
          const newConfig = await generateConfigFromPrompt(prompt, attemptConfig, repair, conversation, {
            mode, submissionId, onUsage: value => { setUsage(value); setUsageUnavailable(false); },
          });
          if (id !== generation.current) return;
          attemptConfig = newConfig;
          setStatus('Testing your sketch…');
          await new Promise<void>((resolve, reject) => {
            validation.current = { id: id * 3 + attempt, resolve, reject };
            setCandidate({ config: newConfig, id: id * 3 + attempt });
          });
          if (id !== generation.current) return;
          activeRepair.current = { config: newConfig, prompt, remaining: maxAttempt - attempt, fallbackId, conversation, mode, submissionId };
          dispatch({ type: 'commit', version: createVersion(newConfig, [
            ...conversation,
            { role: 'user', content: prompt },
            { role: 'assistant', content: `Created artwork: ${newConfig.generated?.title}.` },
          ], prompt) });
          setPanel('adjust');
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
    const previous = studioRef.current.versions.find(v => v.id === studioRef.current.currentId)!;
    const active = activeRepair.current;
    cancelGeneration();
    if (active && active.config.templateId === newConfig.templateId && active.config.seed === newConfig.seed &&
        active.config.params.code === newConfig.params.code) {
      activeRepair.current = { ...active, config: newConfig };
    }
    const sameArtwork = previous.config.templateId === newConfig.templateId;
    const codeChanged = sameArtwork && previous.config.params.code !== newConfig.params.code;
    const changedParams = Object.keys(newConfig.params).filter(key => newConfig.params[key] !== previous.config.params[key]);
    const title = newConfig.generated?.title ?? templates[newConfig.templateId]?.name ?? 'artwork';
    dispatch({
      type: 'commit',
      version: createVersion(newConfig, sameArtwork ? previous.conversation : [],
        `${sameArtwork ? codeChanged ? 'Edited code:' : 'Adjusted:' : 'Started:'} ${title}`),
      group: sameArtwork && previous.config.seed === newConfig.seed ? `edit:${changedParams.sort().join(',')}` : undefined,
    });
    if (newConfig.templateId === 'photo-poster' && previous.config.templateId !== 'photo-poster') setPanel('adjust');
  }, []);

  const hasAnyTemplate = !!config.templateId;

  if (!isWide) return <DesktopNotice />;

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
        onHome={handleHome}
        onUndo={() => navigateHistory({ type: 'undo' })}
        onRedo={() => navigateHistory({ type: 'redo' })}
        canUndo={studio.undo.length > 0}
        canRedo={studio.redo.length > 0}
        showHistory={panel === 'history'}
        onToggleHistory={() => setPanel(panel === 'history' ? null : 'history')}
      />

      {storageWarning && <p role="alert" className="shrink-0 border-b border-amber-300/20 bg-amber-950 px-4 py-2 text-xs text-amber-100">{storageWarning}</p>}

      <div className="flex flex-1 overflow-hidden relative">
        <TemplateGallery config={config} onChange={handleConfigChange} />

        <div className="flex-1 min-w-0 relative">
          <CanvasRunner config={animatedConfig} exportEvent={exportEvent} previewEnabled={previewEnabled}
            onError={message => {
              const active = activeRepair.current;
              if (!active || active.config.params.code !== animatedConfig.params.code) return;
              activeRepair.current = null;
              dispatch({ type: 'reject', id: studioRef.current.currentId, fallbackId: active.fallbackId, error: message });
              if (active.remaining > 0) {
                void handleGenerate(active.prompt, active.mode, { broken: active.config, error: message, remaining: active.remaining, fallbackId: active.fallbackId, conversation: active.conversation, submissionId: active.submissionId });
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
            <PromptBar variant="hero" onGenerate={handleGenerate} isLoading={isGenerating}
              mode="new" onModeChange={setPromptMode} usage={usage} usageUnavailable={usageUnavailable} usageBlocked={usageBlocked} />
          )}

          {hasAnyTemplate && config.templateId !== 'photo-poster' && !showPrompt && (
            <button
              onClick={() => setShowPrompt(true)}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 h-10 px-4 gap-2 rounded-full glass-panel flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors shadow-lg"
              title="Open AI prompt" aria-label="Create or refine artwork"
            >
              <Sparkles size={18} className="text-white/80" />
              <span className="text-xs">Create or refine</span>
            </button>
          )}

          {hasAnyTemplate && config.templateId !== 'photo-poster' && showPrompt && (
            <PromptBar
              onGenerate={handleGenerate}
              isLoading={isGenerating}
              onClose={() => setShowPrompt(false)}
              config={config}
              mode={promptMode} onModeChange={setPromptMode}
              usage={usage} usageUnavailable={usageUnavailable} usageBlocked={usageBlocked}
            />
          )}

          {(status || failure) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[min(90%,32rem)] rounded-xl border border-white/15 bg-zinc-900/95 px-4 py-3 shadow-xl">
              <p role={failure ? 'alert' : 'status'} className="text-sm text-white/90">{failure || status}</p>
              {hasAnyTemplate && <p className="mt-1 text-xs text-white/50">Your previous artwork is unchanged.</p>}
              <div className="flex gap-4 mt-2 text-xs">
                {failure && <button disabled={usageBlocked} className="underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed" onClick={() => handleGenerate(lastPrompt.current, lastMode.current)}>Retry</button>}
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
        {panel === 'history' && (
          <HistoryPanel versions={studio.versions} currentId={studio.currentId}
            onRestore={id => navigateHistory({ type: 'restore', id })} onClose={() => setPanel(null)} />
        )}
      </div>
    </div>
  );
}
