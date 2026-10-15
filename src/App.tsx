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
import { generateConfigFromPrompt } from './lib/ai';
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

    if (from.templateId !== to.templateId || morphDuration <= 0 || !from.templateId || !to.templateId) {
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

  const [showCode, setShowCode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [exportEvent, setExportEvent] = useState<{ type: 'png' | 'gif' | 'video'; duration?: number; fps?: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [configVersion, setConfigVersion] = useState(0);

  const handleExport = (type: 'png' | 'gif' | 'video') => {
    setExportEvent({ type, duration: type === 'gif' ? 3 : 5, fps: 15 });
  };

  const handleGenerate = async (prompt: string) => {
    setIsGenerating(true);
    try {
      const newConfig = await generateConfigFromPrompt(prompt, config);
      setConfig(newConfig);
      setConfigVersion(v => v + 1);
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert("Failed to generate sketch from prompt. Please check your console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfigChange = useCallback((newConfig: SketchConfig) => {
    setConfig(newConfig);
    setConfigVersion(v => v + 1);
  }, []);

  const hasAnyTemplate = !!config.templateId;

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-white overflow-hidden font-sans antialiased relative">
      <TopBar
        config={config}
        onChange={handleConfigChange}
        onExport={handleExport}
        onToggleCode={() => setShowCode(!showCode)}
        showCode={showCode}
        showSettings={showSettings}
        onToggleSettings={() => setShowSettings(!showSettings)}
        previewEnabled={previewEnabled}
        onTogglePreview={() => setPreviewEnabled(!previewEnabled)}
        onToggleInfo={() => setShowInfo(!showInfo)}
        showInfo={showInfo}
        hasTemplate={hasAnyTemplate}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <TemplateGallery config={config} onChange={handleConfigChange} />

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showSettings && hasAnyTemplate ? 'w-80 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {hasAnyTemplate && <ControlPanel config={config} onChange={handleConfigChange} />}
        </div>

        <div className="flex-1 relative">
          <CanvasRunner config={animatedConfig} exportEvent={exportEvent} previewEnabled={previewEnabled} />

          {showInfo && (
            <InfoPanel
              template={activeTemplate}
              onClose={() => setShowInfo(false)}
            />
          )}

          {!hasAnyTemplate && (
            // Stop short of the w-80 info panel so it doesn't cover the hero.
            <div className={`absolute inset-y-0 left-0 ${showInfo ? 'right-80' : 'right-0'}`}>
              <PromptBar variant="hero" onGenerate={handleGenerate} isLoading={isGenerating} />
            </div>
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
        </div>

        {showCode && hasAnyTemplate && (
          <CodeViewer config={config} onChange={handleConfigChange} />
        )}
      </div>
    </div>
  );
}
