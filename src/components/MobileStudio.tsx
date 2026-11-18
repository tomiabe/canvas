import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Code2, Download, History, MessageCircle, Palette, Pause,
  Play, Redo2, SlidersHorizontal, Undo2, X,
} from 'lucide-react';
import { AIUsage, GenerationMode } from '../lib/ai';
import { ArtworkVersion } from '../lib/studio';
import { templates } from '../templates';
import { SketchConfig } from '../types';
import { CodeViewer } from './CodeViewer';
import { ControlPanel } from './ControlPanel';
import { HistoryPanel } from './HistoryPanel';
import { PromptBar } from './PromptBar';
import { SketchFeedback } from './SketchFeedback';
import { TemplateGallery } from './TemplateGallery';

type MobilePanel = 'refine' | 'adjust' | 'code';
type MobileOverlay = 'templates' | 'history' | 'export' | null;

interface MobileStudioProps {
  config: SketchConfig;
  preview: React.ReactNode;
  versions: ArtworkVersion[];
  currentId: string;
  onGenerate: (prompt: string, mode: GenerationMode) => Promise<void>;
  onConfigChange: (config: SketchConfig) => void;
  onHome: () => void;
  onRestore: (id: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: (type: 'png' | 'gif' | 'video') => void;
  onExportJs: () => void;
  onShare: () => void;
  previewEnabled: boolean;
  onTogglePreview: () => void;
  isGenerating: boolean;
  usage: AIUsage | null;
  usageUnavailable: boolean;
  usageBlocked: boolean;
  status: string;
  failure: string;
  onRetry: () => void;
  onCancel: () => void;
  notice: string;
  warning: string;
  feedbackVersionId?: string;
  sharedPayload: string | null;
  shareError: string;
  onOpenShared: () => void;
  onDismissShared: () => void;
}

function useVisibleHeight() {
  const [height, setHeight] = useState<number | undefined>();
  useEffect(() => {
    const update = () => setHeight(Math.round(window.visualViewport?.height ?? window.innerHeight));
    update();
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    return () => {
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return height;
}

function FeaturedTemplate({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 rounded-xl border border-canvas-line bg-canvas-surface p-3 text-left">
      <span aria-hidden="true" className="relative size-[122px] shrink-0 overflow-hidden rounded-lg bg-canvas-art-deep">
        <span className="absolute inset-0 canvas-featured-glow" />
        <span className="absolute left-[30%] top-[31%] size-1.5 rounded-full bg-canvas-art-gold canvas-featured-spark" />
        <span className="absolute left-[70%] top-[22%] size-1 rounded-full bg-canvas-art-gold canvas-featured-spark" />
        <span className="absolute left-[57%] top-[65%] size-2 rounded-full bg-canvas-art-gold canvas-featured-spark-large" />
        <span className="absolute left-[22%] top-[78%] size-1 rounded-full bg-canvas-art-gold canvas-featured-spark-small" />
      </span>
      <span className="min-w-0 space-y-2">
        <span className="block text-[15px] font-semibold">Particle System</span>
        <span className="block text-[13px] leading-5 text-canvas-text/65">Make moving fields of light and motion.</span>
        <span className="block text-[13px] font-medium">Open template →</span>
      </span>
    </button>
  );
}

export function MobileStudio(props: MobileStudioProps) {
  const [panel, setPanel] = useState<MobilePanel>('refine');
  const [overlay, setOverlay] = useState<MobileOverlay>(null);
  const height = useVisibleHeight();
  const hasArtwork = !!props.config.templateId;
  const title = props.config.generated?.title ?? templates[props.config.templateId]?.name ?? 'Artwork';

  const openExport = (type: 'png' | 'gif' | 'video' | 'js' | 'share') => {
    setOverlay(null);
    if (type === 'js') props.onExportJs();
    else if (type === 'share') props.onShare();
    else props.onExport(type);
  };

  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-canvas-bg text-canvas-text antialiased" style={{ height: height ?? '100dvh' }}>
      {hasArtwork ? (
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-canvas-line px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button type="button" onClick={() => { props.onHome(); setPanel('refine'); setOverlay(null); }} aria-label="Start new artwork"
              className="flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-canvas-white/10"><ArrowLeft size={22} /></button>
            <span className="truncate text-sm font-semibold">{title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={() => setOverlay('history')} aria-label="History" className="flex size-10 items-center justify-center rounded-lg hover:bg-canvas-white/10"><History size={20} /></button>
            <button type="button" onClick={() => setOverlay('export')} aria-label="Export and share" className="flex size-10 items-center justify-center rounded-lg hover:bg-canvas-white/10"><Download size={20} /></button>
          </div>
        </header>
      ) : (
        <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-canvas-line px-6">
          <div className="flex items-center gap-2 text-[17px] font-semibold"><Palette size={20} /> Canvas</div>
          <button type="button" onClick={() => setOverlay('history')} className="flex min-h-10 items-center gap-2 text-[13px] text-canvas-text/65"><History size={18} /> History</button>
        </header>
      )}

      {props.warning && <p role="alert" className="shrink-0 border-b border-amber-300/20 bg-amber-950 px-4 py-2 text-sm text-amber-100">{props.warning}</p>}
      {props.notice && <p role="status" className="shrink-0 border-b border-canvas-line bg-canvas-surface px-4 py-2 text-sm text-canvas-text">{props.notice}</p>}
      {props.sharedPayload && (
        <div className="shrink-0 border-b border-canvas-white/15 bg-canvas-raised px-4 py-3 text-sm">
          <p className="font-medium">A shared sketch is ready to remix</p>
          {props.shareError && <p role="alert" className="mt-1 text-amber-200">{props.shareError}</p>}
          <div className="mt-2 flex gap-4 text-xs">
            <button type="button" onClick={props.onOpenShared} className="font-semibold underline">Open sketch</button>
            <button type="button" onClick={props.onDismissShared} className="text-canvas-text/70">Dismiss</button>
          </div>
        </div>
      )}

      {hasArtwork ? (
        <>
          <main className="flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4">
            <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-canvas-line bg-canvas-preview">{props.preview}</div>
            <div className="flex shrink-0 items-center justify-between pt-3">
              <span className="flex items-center gap-2 text-[13px] text-canvas-text/65"><span className={`size-1.5 rounded-full ${props.previewEnabled ? 'bg-canvas-art-gold' : 'bg-canvas-white/35'}`} /> {props.previewEnabled ? 'Live preview' : 'Preview paused'}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={props.onUndo} disabled={!props.canUndo} aria-label="Undo" className="flex size-10 items-center justify-center rounded-lg bg-canvas-surface disabled:opacity-35"><Undo2 size={19} /></button>
                <button type="button" onClick={props.onRedo} disabled={!props.canRedo} aria-label="Redo" className="flex size-10 items-center justify-center rounded-lg bg-canvas-surface disabled:opacity-35"><Redo2 size={19} /></button>
                <button type="button" onClick={props.onTogglePreview} aria-label={props.previewEnabled ? 'Pause preview' : 'Resume preview'} className="flex size-10 items-center justify-center rounded-lg bg-canvas-surface">
                  {props.previewEnabled ? <Pause size={17} /> : <Play size={17} />}
                </button>
              </div>
            </div>
          </main>
          <section aria-label="Artwork tools" className="max-h-[48%] shrink-0 overflow-y-auto border-t border-canvas-line bg-canvas-surface px-4 pt-4" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
            <div role="tablist" aria-label="Artwork tools" className="grid grid-cols-3 gap-2">
              {([
                ['refine', MessageCircle, 'Refine'],
                ['adjust', SlidersHorizontal, 'Adjust'],
                ['code', Code2, 'Code'],
              ] as const).map(([value, Icon, label]) => (
                <button key={value} type="button" role="tab" aria-selected={panel === value} onClick={() => setPanel(value)}
                  className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-[13px] ${panel === value ? 'bg-canvas-white font-semibold text-canvas-bg' : 'bg-canvas-raised text-canvas-text'}`}>
                  <Icon size={15} /> {label}
                </button>
              ))}
            </div>
            <div role="tabpanel" className="min-h-0 pt-3">
              {panel === 'refine' && <div className="space-y-3">
                <PromptBar variant="mobile-refine" onGenerate={props.onGenerate} isLoading={props.isGenerating} config={props.config}
                  mode="refine" onModeChange={() => {}} usage={props.usage} usageUnavailable={props.usageUnavailable} usageBlocked={props.usageBlocked} />
                {props.feedbackVersionId && <SketchFeedback versionId={props.feedbackVersionId} onNeedsWork={() => setPanel('refine')} />}
              </div>}
              {panel === 'adjust' && <div className="h-[min(300px,32dvh)]"><ControlPanel config={props.config} onChange={props.onConfigChange} mobile /></div>}
              {panel === 'code' && <div className="h-[min(300px,32dvh)]"><CodeViewer config={props.config} onChange={props.onConfigChange} mobile /></div>}
            </div>
          </section>
        </>
      ) : (
        <main className="min-h-0 flex-1 overflow-y-auto pb-8">
          <PromptBar variant="mobile-start" onGenerate={props.onGenerate} isLoading={props.isGenerating}
            mode="new" onModeChange={() => {}} usage={props.usage} usageUnavailable={props.usageUnavailable} usageBlocked={props.usageBlocked} />
          <section className="space-y-3 px-6 pt-7">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Start with a template</h2>
              <button type="button" onClick={() => setOverlay('templates')} className="text-[13px] text-canvas-text/65">Browse all {Object.keys(templates).length - 1}</button>
            </div>
            <FeaturedTemplate onOpen={() => {
              const template = templates['particle-system'];
              props.onConfigChange({
                templateId: template.id,
                seed: Math.floor(Math.random() * 1000000),
                params: Object.fromEntries(template.params.map(param => [param.id, param.default])),
                libraries: template.libraries,
              });
            }} />
          </section>
        </main>
      )}
      {!hasArtwork && <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-0">{props.preview}</div>}

      {(props.status || props.failure) && (
        <div role={props.failure ? 'alert' : 'status'} className="absolute inset-x-4 top-[72px] z-40 rounded-xl border border-canvas-white/15 bg-canvas-raised p-4 text-sm shadow-xl">
          <p>{props.failure || props.status}</p>
          <div className="mt-3 flex gap-4 text-xs">
            {props.failure && <button type="button" onClick={props.onRetry} disabled={props.usageBlocked} className="font-semibold underline disabled:opacity-45">Retry</button>}
            <button type="button" onClick={props.onCancel} className="text-canvas-text/70">{props.failure ? 'Dismiss' : 'Cancel'}</button>
          </div>
        </div>
      )}

      {overlay === 'templates' && <div className="absolute inset-0 z-50"><TemplateGallery config={props.config} onChange={props.onConfigChange} mobile onClose={() => setOverlay(null)} /></div>}
      {overlay === 'history' && <HistoryPanel versions={props.versions} currentId={props.currentId} mobile
        onRestore={id => { props.onRestore(id); setOverlay(null); }} onClose={() => setOverlay(null)} />}
      {overlay === 'export' && (
        <div className="absolute inset-0 z-50 flex items-end bg-canvas-bg/70" onClick={() => setOverlay(null)}>
          <div role="dialog" aria-label="Export and share" className="w-full rounded-t-2xl bg-canvas-surface p-4" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }} onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h2 className="text-base font-semibold">Export and share</h2><button type="button" onClick={() => setOverlay(null)} aria-label="Close export menu" className="flex size-10 items-center justify-center"><X size={20} /></button></div>
            {([
              ['png', 'PNG image'], ['gif', 'GIF animation'], ['video', 'Video recording'],
              ['js', 'p5.js source'], ['share', 'Share remix link'],
            ] as const).map(([type, label]) => <button key={type} type="button" onClick={() => openExport(type)}
              className="flex min-h-12 w-full items-center border-t border-canvas-line text-left text-sm">{label}</button>)}
          </div>
        </div>
      )}
    </div>
  );
}
