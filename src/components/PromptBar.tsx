import React, { useState } from 'react';
import { ArrowUp, Sparkles, Loader2, X, Wand2, Sliders, Download, PanelLeft } from 'lucide-react';
import { templates } from '../templates';
import { SketchConfig } from '../types';
import { AIUsage, GenerationMode } from '../lib/ai';

interface PromptBarProps {
  onGenerate: (prompt: string, mode: GenerationMode) => Promise<void>;
  isLoading: boolean;
  onClose?: () => void;
  config?: SketchConfig;
  /** 'hero' is the centered prompt on the empty canvas; 'floating' edits an existing sketch. */
  variant?: 'floating' | 'hero' | 'mobile-start' | 'mobile-refine' | 'desktop-dock';
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  usage: AIUsage | null;
  usageUnavailable: boolean;
  usageBlocked: boolean;
}

const suggestionMap: Record<string, string[]> = {
  'particle-system': ['Double the particle count', 'Make particles follow mouse', 'Change to firefly colors', 'Add gravity pull', 'Slow everything down'],
  'noise-field': ['Make it ocean-like', 'Use warm sunset colors', 'Increase flow speed', 'More lines, less opacity', 'Create topographic map'],
  'grid-pattern': ['Bauhaus color scheme', 'Make it neon and animated', 'Use only circles', 'Dense grid with no padding', 'Monochrome minimal'],
  'brush-playground': ['Ink splatter style', 'Pastel clouds', 'Rainbow brush', 'Thick oil paint', 'Calligraphy strokes'],
  'radial-mandala': ['Hypnotic spinning colors', 'Sacred geometry', 'More segments', 'Slow rotation mandala', 'Minimal black and white'],
  'typography-warp': ['Gentle waving text', 'Glitch effect', 'Large bold letters', 'Slow subtle motion', 'Rainbow colored letters'],
  'webgl-geometry': ['Rotating torus with neon light', 'Smooth sphere ambient glow', 'Wobbling cube', 'Conical spiral', 'Cylinder with rim light'],
  'fractal-tree': ['Autumn colors tree', 'Winter bare branches', 'Dense jungle', 'Wind-blown tree', 'Symmetrical bonsai'],
  'math-art': ['Lissajous with trailing effect', 'Slow phase animation', 'Thick neon curve', 'Fast oscilloscope style', 'Double spiral'],
  'bouncing-balls': ['Zero gravity floating', 'Heavy planet collision', 'Many small balls', 'One big ball physics', 'Colorful chaos'],
  'flocking': ['Dense starling murmuration', 'Slow fish school', 'Wide dispersion', 'Tight formation', 'Colorful tropical fish'],
  'game-of-life': ['Dense chaotic soup', 'Glider gun pattern', 'Slow motion evolution', 'Neon green on black', 'Wide cells visible'],
  'metaballs': ['Neon goo organic blobs', 'Lava lamp style', 'Many small blobs', 'Slow morphing shapes', 'Psychedelic colors'],
  'terrain': ['Alpine mountain range', 'Desert dunes', 'Floating islands', 'Ocean waves terrain', 'Volcanic landscape'],
  'spirograph': ['Complex flower pattern', 'Galactic spiral', 'Dense nested rings', 'Slow drawing animation', 'Rainbow gradient'],
  'fireworks': ['Grand celebration burst', 'Golden sparklers', 'Colorful chrysanthemum', 'Rapid fire show', 'Silent silver stars'],
  'kaleidoscope': ['Draw butterfly wings', 'Mandala maker mode', 'Psychedelic symmetry', 'Flower petal pattern', 'Snowflake crystal'],
  'color-waves': ['Aurora borealis', 'Warm sunset gradient', 'Deep ocean blues', 'Neon synthwave', 'Fire and ice'],
  'rain': ['Heavy thunder storm', 'Gentle misty drizzle', 'Windy sideways rain', 'Cyberpunk rain', 'Morning dew drops'],
  'neon-lines': ['Neural network mesh', 'Constellation star map', 'Dense spider web', 'Slow pulsing nodes', 'Matrix digital rain'],
  'truchet-tiles': ['Classic black and white', 'Op art illusion', 'Colorful mosaic', 'Animated rotating tiles', 'Wave pattern'],
  'wave-interference': ['Water ripples pond', 'Quantum probability', 'Multi-source interference', 'Slow deep waves', 'Rainbow diffraction'],
  'reaction-diffusion': ['Coral reef growth', 'Slime mold pattern', 'Leopard spots', 'Zebra stripes', 'Fingerprint whorls'],
  'solar-system': ['Full 8 planets like ours', 'Binary star system', 'Fast chaotic orbits', 'Glowing star with trails', 'Minimal dot orbits'],
  'audio-visualizer': ['Nightclub energy bars', 'Ambient waveform', 'Radial frequency ring', 'Particle sound cloud', 'Soft glow rings'],
  'interactive-playground': ['Draw with light trails', 'Keyboard grid reaction', 'Motion dance particles', 'Gravity attractor', 'Webcam mirror paint'],
  'video-feedback': ['Glitch portrait effect', 'Dreamy feedback loop', 'Pixel art webcam', 'Edge-detect silhouette', 'Neon posterize'],
};

const defaultSuggestions = [
  'Make it colorful and vibrant',
  'Calm and minimal',
  'Dark moody atmosphere',
  'Surprise me with something wild',
  'Export-ready composition',
];

const examplePrompts = [
  'Ink drops slowly spreading in water',
  'Neon rain falling on a dark city',
  'A flower made of rotating circles',
  'Fireflies drifting over a pond at night',
  'Grass swaying in the wind at sunset',
  'Glitchy pixel waves in synthwave colors',
];

const heroSteps = [
  { icon: Sparkles, label: 'Describe it', desc: 'A mood, a motion, a subject' },
  { icon: Sliders, label: 'Refine it', desc: 'Keep prompting or adjust settings' },
  { icon: Download, label: 'Export it', desc: 'PNG, GIF, video, or p5.js code' },
];

export function PromptBar({ onGenerate, isLoading, onClose, config, variant = 'floating', mode, onModeChange, usage, usageUnavailable, usageBlocked }: PromptBarProps) {
  const isHero = variant === 'hero';
  const isMobileStart = variant === 'mobile-start';
  const isMobileRefine = variant === 'mobile-refine';
  const [prompt, setPrompt] = useState('');
  const disabled = isLoading || usageBlocked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || disabled) return;
    await onGenerate(prompt, mode);
  };

  const suggestions = mode === 'new' ? examplePrompts : config ? (suggestionMap[config.templateId] || defaultSuggestions) : defaultSuggestions;

  const handleSuggestion = async (suggestion: string) => {
    if (disabled) return;
    setPrompt(suggestion);
    await onGenerate(suggestion, mode);
  };

  const usageLabel = usageUnavailable ? 'AI allowance temporarily unavailable. Try again shortly.'
    : !usage ? 'Checking AI allowance…'
    : usage.reason === 'global' ? 'Shared daily AI budget reached. Resets at 00:00 UTC.'
    : usage.reason === 'burst' ? 'A short breather-try again in a minute.'
    : `${usage.remaining}/${usage.limit} AI submissions left today · resets at 00:00 UTC`;
  const allowance = (
    <p role="status" title="Anonymous allowance is shared by people on the same network. A submission includes up to two automatic repairs. Templates and manual adjustments are unlimited."
      className={`mt-3 text-[11px] ${usageBlocked ? 'text-amber-200/90' : 'text-canvas-text/45'}`}>
      {usageLabel}
    </p>
  );
  const modeSelector = !isHero && (
    <div className="mb-3">
      <div role="group" aria-label="AI artwork mode" className="flex flex-wrap gap-1">
        {(['new', 'refine'] as const).map(value => (
          <button key={value} type="button" aria-pressed={mode === value} disabled={isLoading}
            onClick={() => onModeChange(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${mode === value ? 'bg-canvas-white text-canvas-bg' : 'text-canvas-text/55 hover:bg-canvas-white/10 hover:text-canvas-text'}`}>
            {value === 'new' ? 'New artwork' : 'Refine this artwork'}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-canvas-text/45">
        {mode === 'new' ? 'Start fresh. Your current artwork stays in History.' : 'Keep this composition, palette and settings as the starting point.'}
      </p>
    </div>
  );

  const inputRow = (
    <div className="flex items-center">
      <div className="w-10 h-10 flex items-center justify-center shrink-0 text-canvas-text/50 bg-canvas-white/5 rounded-full">
        {isLoading ? <Loader2 className="animate-spin w-5 h-5 text-canvas-text" /> : <Sparkles className="w-5 h-5" />}
      </div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={mode === 'new' ? 'e.g. fireworks over a dark lake' : "Describe a change (e.g. 'slower, more pink')"}
        aria-label="Describe your sketch"
        autoFocus={isHero}
        disabled={isLoading}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-canvas-text placeholder:text-canvas-text/40 px-3 text-sm"
      />
      <button
        type="submit"
        disabled={!prompt.trim() || disabled}
        className={`h-9 px-5 rounded-full font-medium text-sm transition-colors cursor-pointer ${
          prompt.trim() && !disabled
            ? 'bg-canvas-white text-canvas-bg hover:bg-canvas-white/90'
            : 'bg-canvas-white/10 text-canvas-text/40 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Generating…' : mode === 'new' ? 'Create' : 'Refine'}
      </button>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI prompt"
          className="ml-2 p-2 text-canvas-text/40 hover:text-canvas-text/80 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );

  if (isMobileStart) {
    return (
      <section className="space-y-6 px-6 pt-6">
        <div className="space-y-3">
          <h1 className="max-w-xs text-[30px] font-semibold leading-[1.12] tracking-tight">What would you like to make?</h1>
          <p className="text-sm leading-relaxed text-canvas-text/65">Describe a scene, pattern or motion. Canvas will turn it into a live sketch.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="sr-only">Describe your sketch</span>
            <textarea value={prompt} onChange={event => setPrompt(event.target.value)} disabled={isLoading}
              placeholder="Fireflies drifting over a pond at night" rows={4}
              className="min-h-28 w-full resize-none rounded-xl border border-canvas-white/15 bg-canvas-surface p-4 text-[15px] leading-relaxed text-canvas-text outline-none placeholder:text-canvas-text/55 focus:border-canvas-white/50" />
          </label>
          <button type="submit" disabled={!prompt.trim() || disabled}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-canvas-white text-sm font-semibold text-canvas-bg disabled:cursor-not-allowed disabled:opacity-45">
            {isLoading ? 'Writing your sketch…' : 'Create sketch'}
          </button>
          <div className="text-center">{allowance}</div>
        </form>
      </section>
    );
  }

  if (isMobileRefine) {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="mobile-refine-prompt" className="block text-[13px] font-medium">Describe a change</label>
        <div className="flex min-h-12 items-center gap-2 rounded-lg border border-canvas-white/15 bg-canvas-bg px-2 focus-within:border-canvas-white/50">
          <input id="mobile-refine-prompt" value={prompt} onChange={event => setPrompt(event.target.value)} disabled={isLoading}
            placeholder="Make the particles move more slowly" className="min-w-0 flex-1 bg-transparent px-1 text-[13px] text-canvas-text outline-none placeholder:text-canvas-text/55" />
          <button type="submit" disabled={!prompt.trim() || disabled} aria-label="Refine sketch"
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-canvas-white text-canvas-bg disabled:opacity-45">
            {isLoading ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={17} />}
          </button>
        </div>
        {allowance}
      </form>
    );
  }

  if (variant === 'desktop-dock') {
    return (
      <form onSubmit={handleSubmit} className="shrink-0 space-y-2 border-t border-canvas-line bg-canvas-surface px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="desktop-artwork-prompt" className="text-[13px] font-medium">{mode === 'new' ? 'Describe new artwork' : 'Describe a change'}</label>
          <div role="group" aria-label="AI artwork mode" className="flex items-center gap-1 rounded-lg bg-canvas-raised p-1">
            {(['refine', 'new'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} disabled={isLoading} onClick={() => onModeChange(value)}
              className={`rounded-md px-3 py-1 text-xs disabled:opacity-50 ${mode === value ? 'bg-canvas-white font-semibold text-canvas-bg' : 'text-canvas-muted hover:text-canvas-text'}`}>
              {value === 'refine' ? 'Refine' : 'New artwork'}
            </button>)}
          </div>
        </div>
        <div className="flex min-h-12 items-center gap-3 rounded-lg border border-canvas-line bg-canvas-bg pr-2 pl-4 focus-within:border-canvas-white/50">
          <input id="desktop-artwork-prompt" value={prompt} onChange={event => setPrompt(event.target.value)} disabled={isLoading}
            placeholder={mode === 'new' ? 'Describe the artwork you want to make' : 'Make the particles move more slowly'}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-canvas-text outline-none placeholder:text-canvas-muted" />
          <button type="submit" disabled={!prompt.trim() || disabled} aria-label={mode === 'new' ? 'Create artwork' : 'Refine artwork'}
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-canvas-white text-canvas-bg disabled:opacity-45">
            {isLoading ? <Loader2 size={17} className="animate-spin" /> : <ArrowUp size={17} />}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-canvas-muted">
          <span>Try</span>
          {suggestions.slice(0, 3).map(suggestion => <button key={suggestion} type="button" disabled={disabled} onClick={() => handleSuggestion(suggestion)}
            className="rounded-full border border-canvas-line bg-canvas-raised px-2.5 py-1 hover:text-canvas-text disabled:opacity-40">{suggestion}</button>)}
          <span className="ml-auto text-[11px]" title={usageLabel}>{usageUnavailable ? 'AI allowance unavailable' : usage ? `${usage.remaining} AI submissions left` : 'Checking AI allowance…'}</span>
        </div>
      </form>
    );
  }

  if (isHero) {
    return (
      <div className="absolute inset-0 z-10 flex px-6 overflow-y-auto">
        {/* m-auto centers without clipping the top when the viewport is short. */}
        <div className="w-full max-w-2xl py-10 m-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-canvas-text/90 text-center">
            Describe the art you want to see
          </h1>
          <p className="text-sm text-canvas-text/40 text-center mt-2 mb-6">
            Canvas turns your words into a live, animated sketch. No code required.
          </p>

          <form
            onSubmit={handleSubmit}
            className="glass-panel rounded-2xl shadow-2xl p-3 focus-within:ring-2 focus-within:ring-canvas-white/20 transition-shadow"
          >
            {inputRow}
            {allowance}
          </form>

          <p className={`text-xs text-center mt-3 h-4 ${isLoading ? 'text-canvas-text/50' : 'text-transparent'}`} aria-live="polite">
            {isLoading ? 'Writing your sketch…' : ''}
          </p>

          <div className="mt-3 text-[10px] text-canvas-text/30 font-medium uppercase tracking-wider text-center">
            Try an example
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {examplePrompts.map(example => (
              <button
                key={example}
                type="button"
                disabled={disabled}
                onClick={() => handleSuggestion(example)}
                className="px-3 py-1.5 text-xs bg-canvas-white/5 hover:bg-canvas-white/10 text-canvas-text/60 hover:text-canvas-text/90 rounded-full border border-canvas-line transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {example}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-10">
            {heroSteps.map(step => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-8 h-8 rounded-full bg-canvas-white/5 flex items-center justify-center">
                    <Icon size={14} className="text-canvas-text/40" />
                  </div>
                  <div className="text-xs font-medium text-canvas-text/60">{step.label}</div>
                  <div className="text-[11px] text-canvas-text/30">{step.desc}</div>
                </div>
              );
            })}
          </div>

          <p className="flex items-center justify-center gap-1.5 text-xs text-canvas-text/30 mt-8">
            <PanelLeft size={12} />
            Or start from one of the templates on the left.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="glass-panel bg-canvas-raised/95! rounded-2xl shadow-2xl p-3 focus-within:ring-2 focus-within:ring-canvas-white/20 transition-shadow"
      >
        {modeSelector}
        {inputRow}
        {allowance}

        {!isLoading && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-canvas-line">
            <span className="text-[10px] text-canvas-text/30 font-medium uppercase tracking-wider mt-0.5 mr-1 shrink-0">
              <Wand2 size={10} className="inline mr-1" />
              Suggestions
            </span>
            {suggestions.slice(0, 5).map((s, i) => (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => handleSuggestion(s)}
                className="px-2.5 py-1 text-[10px] bg-canvas-white/5 hover:bg-canvas-white/10 text-canvas-text/60 hover:text-canvas-text/80 rounded-full border border-canvas-line transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
