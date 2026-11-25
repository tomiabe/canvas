import React, { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { TopBar } from './components/TopBar';
import { TemplateGallery } from './components/TemplateGallery';
import { ControlPanel } from './components/ControlPanel';
import { CanvasRunner } from './components/CanvasRunner';
import { CodeViewer } from './components/CodeViewer';
import { PromptBar } from './components/PromptBar';
import { InfoPanel } from './components/InfoPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { MobileStudio } from './components/MobileStudio';
import { SketchFeedback } from './components/SketchFeedback';
import { SketchConfig } from './types';
import { templates } from './templates';
import { AIServiceError, AIUsage, GenerationMode, generateConfigFromPrompt, getAIUsage } from './lib/ai';
import { ConversationTurn, StudioAction, createStudio, createVersion, loadStudio, saveStudio, studioReducer } from './lib/studio';
import { analytics } from './lib/analytics';
import { downloadSketchSource } from './lib/download';
import { createShareUrl, decodeShareConfig, sharedPayloadFromHash } from './lib/share';
import { api } from './lib/api';
import { Code2, MessageCircle, Pause, Play, SlidersHorizontal } from 'lucide-react';

function feedbackId(config: SketchConfig): string {
  const source = `${config.seed}:${config.params.code ?? ''}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(36);
}

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
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  const [sharedPayload, setSharedPayload] = useState(() => sharedPayloadFromHash(window.location.hash));
  const [shareError, setShareError] = useState('');
  const shareLink = useRef<{ config: SketchConfig; url?: string; error?: string } | null>(null);
  useEffect(() => {
    const update = () => setSharedPayload(sharedPayloadFromHash(window.location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

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

  const [panel, setPanel] = useState<'refine' | 'adjust' | 'code' | 'help' | 'history'>('adjust');
  const lastToolPanel = useRef<'refine' | 'adjust' | 'code'>('adjust');
  useEffect(() => {
    if (panel === 'refine' || panel === 'adjust' || panel === 'code') lastToolPanel.current = panel;
  }, [panel]);
  const [promptMode, setPromptMode] = useState<GenerationMode>(config.templateId ? 'refine' : 'new');
  useEffect(() => {
    setPromptMode(config.templateId ? 'refine' : 'new');
  }, [config.templateId]);
  const [usage, setUsage] = useState<AIUsage | null>(null);
  const [usageUnavailable, setUsageUnavailable] = useState(false);
  const refreshUsage = useCallback(() => {
    void getAIUsage().then(value => { setUsage(value); setUsageUnavailable(false); })
      .catch(() => setUsageUnavailable(true));
  }, []);
  useEffect(() => {
    refreshUsage();
    window.addEventListener('focus', refreshUsage);
    return () => window.removeEventListener('focus', refreshUsage);
  }, [refreshUsage]);
  useEffect(() => {
    if (!usage) return;
    const delay = Date.parse(usage.retryAt ?? usage.resetsAt) - Date.now();
    // A device clock ahead of the server must not cause an immediate fetch loop.
    const timer = setTimeout(refreshUsage, delay > 0 ? delay + 250 : 60000);
    return () => clearTimeout(timer);
  }, [usage, refreshUsage]);
  const usageBlocked = !!usage && (usage.remaining === 0 || !!usage.reason) &&
    Date.parse(usage.retryAt ?? usage.resetsAt) > Date.now();
  const [previewEnabled, setPreviewEnabled] = useState(true);
  useEffect(() => {
    if (!config.templateId) { shareLink.current = null; return; }
    let cancelled = false;
    shareLink.current = { config };
    void createShareUrl(config, window.location).then(url => {
      if (!cancelled) shareLink.current = { config, url };
    }).catch(error => {
      if (!cancelled) shareLink.current = { config, error: error instanceof Error ? error.message : 'Could not create a remix link.' };
    });
    return () => { cancelled = true; };
  }, [config]);
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
    setPanel('adjust');
    setPromptMode('new');
    setPreviewEnabled(true);
    if (!config.templateId) return;
    dispatch({ type: 'commit', version: createVersion({ templateId: '', seed: Math.floor(Math.random() * 1000000), params: {} }, [], 'New artwork') });
  };

  const handleExport = (type: 'png' | 'gif' | 'video') => {
    if (!previewEnabled) {
      setNotice('Resume the preview before exporting.');
      return;
    }
    setNotice(type === 'video' || type === 'gif' ? 'Preparing your animation…' : 'Preparing your image…');
    setExportEvent({ type, duration: type === 'gif' ? 3 : 5, fps: 15 });
  };

  const handleExportJs = () => {
    try {
      downloadSketchSource(config);
      analytics.export('js', 'success');
      setNotice('Source code downloaded.');
    } catch {
      analytics.export('js', 'failure');
      setNotice('Source code could not be downloaded.');
    }
  };

  const handleSave = async () => {
    if (!config.templateId) { setNotice('Open or create a sketch before saving it.'); return; }
    try {
      await api.saveSketch({
        title: config.generated?.title ?? templates[config.templateId]?.name ?? 'Untitled sketch',
        config,
        thumbnail_url: '',
        collection: 'Unsorted',
        tags: '',
      });
      setNotice('Sketch saved to your account.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save the sketch.';
      if (message.includes('Sign in')) window.location.assign('/signin?next=%2F');
      else setNotice(message);
    }
  };

  const handleShare = async () => {
    try {
      const prepared = shareLink.current;
      if (prepared?.config !== config || !prepared.url) {
        setNotice(prepared?.error ?? 'Preparing your remix link. Try again in a moment.');
        return;
      }
      const url = prepared.url;
      if (!isWide && navigator.share) {
        try {
          await navigator.share({ title: config.generated?.title ?? templates[config.templateId]?.name ?? 'Canvas sketch', url });
          analytics.share('created');
          setNotice('Remix link shared.');
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      }
      await navigator.clipboard.writeText(url);
      analytics.share('created');
      setNotice('Remix link copied. Anyone with the link can open a copy of this sketch.');
    } catch (error) {
      analytics.share('failed');
      setNotice(error instanceof Error ? error.message : 'Could not create a remix link.');
    }
  };

  const clearSharedHash = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setSharedPayload(null);
    setShareError('');
  };

  const handleOpenShared = async () => {
    if (!sharedPayload) return;
    try {
      const imported = await decodeShareConfig(sharedPayload);
      cancelGeneration();
      dispatch({ type: 'commit', version: createVersion(imported, [], 'Remixed shared artwork') });
      analytics.share('opened');
      clearSharedHash();
      setNotice('Shared sketch opened. Your earlier work remains in History.');
    } catch (error) {
      analytics.share('failed');
      setShareError(error instanceof Error ? error.message : 'This remix link could not be opened.');
    }
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
          analytics.generation(mode, 'success');
          setPromptMode('refine');
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
      analytics.generation(mode, 'failure');
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
    if (previous.config.templateId !== newConfig.templateId) {
      setPanel('adjust');
      setPromptMode('refine');
    }
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
  }, []);

  const hasAnyTemplate = !!config.templateId;
  const handleSketchError = (message: string) => {
    const active = activeRepair.current;
    if (!active || active.config.params.code !== animatedConfig.params.code) return;
    activeRepair.current = null;
    dispatch({ type: 'reject', id: studioRef.current.currentId, fallbackId: active.fallbackId, error: message });
    if (active.remaining > 0) {
      void handleGenerate(active.prompt, active.mode, { broken: active.config, error: message, remaining: active.remaining, fallbackId: active.fallbackId, conversation: active.conversation, submissionId: active.submissionId });
    } else {
      setFailure('This sketch still could not run after two repairs. Try a simpler description.');
    }
  };
  const sketchPreview = (
    <div className="relative h-full w-full">
      <CanvasRunner config={animatedConfig} exportEvent={exportEvent} previewEnabled={previewEnabled}
        onError={handleSketchError}
        onExportResult={result => {
          analytics.export(result.type, result.ok ? 'success' : 'failure');
          setNotice(result.ok ? `${result.type.toUpperCase()} export started.` : result.message || 'Export failed.');
        }} />
      {candidate && (
        <div key={candidate.id} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden="true">
          <CanvasRunner config={candidate.config}
            onReady={() => { if (validation.current?.id === candidate.id) validation.current.resolve(); }}
            onError={message => { if (validation.current?.id === candidate.id) validation.current.reject(new Error(message)); }} />
        </div>
      )}
    </div>
  );

  if (!isWide) return (
    <MobileStudio
      config={config} preview={sketchPreview} versions={studio.versions} currentId={studio.currentId}
      onGenerate={handleGenerate} onConfigChange={handleConfigChange} onHome={handleHome}
      onRestore={id => navigateHistory({ type: 'restore', id })}
      onUndo={() => navigateHistory({ type: 'undo' })} onRedo={() => navigateHistory({ type: 'redo' })}
      canUndo={studio.undo.length > 0} canRedo={studio.redo.length > 0}
      onExport={handleExport} onExportJs={handleExportJs} onShare={() => { void handleShare(); }} onSave={() => { void handleSave(); }}
      previewEnabled={previewEnabled} onTogglePreview={() => setPreviewEnabled(value => !value)}
      isGenerating={isGenerating} usage={usage} usageUnavailable={usageUnavailable} usageBlocked={usageBlocked}
      status={status} failure={failure} onRetry={() => { void handleGenerate(lastPrompt.current, lastMode.current); }}
      onCancel={cancelGeneration} notice={notice} warning={storageWarning}
      feedbackVersionId={config.generated ? feedbackId(config) : undefined}
      sharedPayload={sharedPayload} shareError={shareError}
      onOpenShared={() => { void handleOpenShared(); }} onDismissShared={clearSharedHash}
    />
  );

  return (
    <div className="flex flex-col h-screen w-full bg-canvas-bg text-canvas-text overflow-hidden font-sans antialiased relative">
      <TopBar
        config={config}
        onExport={handleExport}
        onExportJs={handleExportJs}
        onShare={() => { void handleShare(); }}
        onSave={() => { void handleSave(); }}
        onToggleInfo={() => setPanel(panel === 'help' ? lastToolPanel.current : 'help')}
        showInfo={panel === 'help'}
        onHome={handleHome}
        onUndo={() => navigateHistory({ type: 'undo' })}
        onRedo={() => navigateHistory({ type: 'redo' })}
        canUndo={studio.undo.length > 0}
        canRedo={studio.redo.length > 0}
        showHistory={panel === 'history'}
        onToggleHistory={() => setPanel(panel === 'history' ? lastToolPanel.current : 'history')}
      />

      {storageWarning && <p role="alert" className="shrink-0 border-b border-amber-300/20 bg-amber-950 px-4 py-2 text-xs text-amber-100">{storageWarning}</p>}
      {notice && <p role="status" className="shrink-0 border-b border-canvas-line bg-canvas-surface px-4 py-2 text-xs text-canvas-text/80">{notice}</p>}
      {(sharedPayload || shareError) && <div className="shrink-0 flex items-center gap-3 border-b border-canvas-line bg-canvas-surface px-4 py-2 text-xs text-canvas-text/80"><span>{shareError || `Open shared sketch: ${sharedPayload?.title || 'Untitled'}`}</span>{sharedPayload && <button className="underline" onClick={() => { void handleOpenShared(); }}>Open sketch</button>}<button className="ml-auto underline" onClick={clearSharedHash}>Dismiss</button></div>}

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <TemplateGallery config={config} onChange={handleConfigChange} />

        <main className="flex min-w-0 flex-1 flex-col bg-canvas-bg">
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-5">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-canvas-line bg-canvas-art-deep">
              {sketchPreview}
              {!hasAnyTemplate && <PromptBar variant="hero" onGenerate={handleGenerate} isLoading={isGenerating}
                mode="new" onModeChange={setPromptMode} usage={usage} usageUnavailable={usageUnavailable} usageBlocked={usageBlocked} />}
            </div>
            {hasAnyTemplate && <div className="flex min-h-10 shrink-0 items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] text-canvas-muted"><span className={`size-1.5 rounded-full ${previewEnabled ? 'bg-canvas-art-gold' : 'bg-canvas-white/35'}`} />{previewEnabled ? 'Live preview' : 'Preview paused'}</span>
              <button type="button" onClick={() => setPreviewEnabled(value => !value)} aria-label={previewEnabled ? 'Pause preview' : 'Resume preview'}
                className="flex h-10 items-center gap-2 rounded-lg bg-canvas-surface px-3 text-[13px] hover:bg-canvas-raised">
                {previewEnabled ? <Pause size={15} /> : <Play size={15} />}{previewEnabled ? 'Pause' : 'Resume'}
              </button>
            </div>}
          </div>

          {hasAnyTemplate && <PromptBar variant="desktop-dock" onGenerate={handleGenerate} isLoading={isGenerating}
            config={config} mode={promptMode} onModeChange={setPromptMode}
            usage={usage} usageUnavailable={usageUnavailable} usageBlocked={usageBlocked} />}

          {(status || failure) && <div className="absolute left-1/2 top-4 z-50 w-[min(90%,32rem)] -translate-x-1/2 rounded-xl border border-canvas-white/15 bg-canvas-raised px-4 py-3 shadow-xl">
            <p role={failure ? 'alert' : 'status'} className="text-sm text-canvas-text/90">{failure || status}</p>
            {hasAnyTemplate && <p className="mt-1 text-xs text-canvas-text/50">Your previous artwork is unchanged.</p>}
            <div className="mt-2 flex gap-4 text-xs">
              {failure && <button disabled={usageBlocked} className="underline disabled:opacity-40" onClick={() => handleGenerate(lastPrompt.current, lastMode.current)}>Retry</button>}
              <button className="text-canvas-text/60 hover:text-canvas-text" onClick={cancelGeneration}>{failure ? 'Dismiss' : 'Cancel'}</button>
            </div>
          </div>}
        </main>

        {hasAnyTemplate && panel !== 'help' && panel !== 'history' && <aside aria-label="Artwork tools" className="flex w-82 shrink-0 flex-col border-l border-canvas-line bg-canvas-surface">
          <div role="tablist" aria-label="Artwork tools" className="grid grid-cols-3 gap-2 border-b border-canvas-line p-3">
            {([
              ['refine', MessageCircle, 'Refine'],
              ['adjust', SlidersHorizontal, 'Adjust'],
              ['code', Code2, 'Code'],
            ] as const).map(([value, Icon, label]) => <button key={value} type="button" role="tab"
              aria-selected={panel === value} onClick={() => { setPanel(value); if (value === 'refine') setPromptMode('refine'); }}
              className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-[13px] ${panel === value ? 'bg-canvas-white font-semibold text-canvas-bg' : 'bg-canvas-raised text-canvas-text hover:bg-canvas-white/15'}`}>
              <Icon size={15} /> {label}
            </button>)}
          </div>
          <div role="tabpanel" className="min-h-0 flex-1">
            {panel === 'adjust' && <ControlPanel config={config} onChange={handleConfigChange} embedded />}
            {panel === 'code' && <CodeViewer config={config} onChange={handleConfigChange} embedded />}
            {panel === 'refine' && <div className="custom-scrollbar h-full overflow-y-auto p-4">
              <h2 className="text-sm font-semibold">Refine this artwork</h2>
              <p className="mt-2 text-xs leading-5 text-canvas-text/60">Describe the change you want in the prompt below the preview. Canvas will use this artwork as its starting point.</p>
              <button type="button" onClick={() => { setPromptMode('refine'); document.getElementById('desktop-artwork-prompt')?.focus(); }}
                className="mt-4 min-h-10 w-full rounded-lg bg-canvas-white text-[13px] font-semibold text-canvas-bg hover:bg-canvas-white/90">Describe a change</button>
              {config.generated && <div className="mt-6"><SketchFeedback versionId={feedbackId(config)} onNeedsWork={() => { setPromptMode('refine'); document.getElementById('desktop-artwork-prompt')?.focus(); }} /></div>}
              {current.conversation.length > 0 && <div className="mt-6 border-t border-canvas-line pt-4">
                <h3 className="text-xs font-semibold text-canvas-text/70">Recent prompts</h3>
                <div className="mt-3 space-y-2">{current.conversation.filter(turn => turn.role === 'user').slice(-5).map((turn, index) =>
                  <p key={index} className="rounded-lg bg-canvas-raised p-3 text-xs leading-5 text-canvas-text/75">{turn.content}</p>)}</div>
              </div>}
            </div>}
          </div>
        </aside>}
        {panel === 'help' && <InfoPanel template={activeTemplate} title={config.generated?.title} onClose={() => setPanel(lastToolPanel.current)} />}
        {panel === 'history' && <HistoryPanel versions={studio.versions} currentId={studio.currentId}
          onRestore={id => { navigateHistory({ type: 'restore', id }); setPanel(lastToolPanel.current); }} onClose={() => setPanel(lastToolPanel.current)} />}
      </div>
    </div>
  );
}
