import React, { useState } from 'react';
import { Sparkles, Loader2, X, Wand2 } from 'lucide-react';
import { templates } from '../templates';
import { SketchConfig } from '../types';

interface PromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
  onClose?: () => void;
  config?: SketchConfig;
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

export function PromptBar({ onGenerate, isLoading, onClose, config }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await onGenerate(prompt);
  };

  const suggestions = config ? (suggestionMap[config.templateId] || defaultSuggestions) : defaultSuggestions;

  const handleSuggestion = async (suggestion: string) => {
    setPrompt(suggestion);
    await onGenerate(suggestion);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl shadow-2xl p-3 focus-within:ring-2 focus-within:ring-white/20 transition-shadow"
      >
        <div className="flex items-center">
          <div className="w-10 h-10 flex items-center justify-center shrink-0 text-white/50 bg-white/5 rounded-full">
            {isLoading ? <Loader2 className="animate-spin w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your design (e.g. 'indigo organic blobs slow breathing')"
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 px-3 text-sm"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className={`h-9 px-5 rounded-full font-medium text-sm transition-colors cursor-pointer ${
              prompt.trim() && !isLoading
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            Generate
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 p-2 text-white/40 hover:text-white/80 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {!isLoading && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
            <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider mt-0.5 mr-1 shrink-0">
              <Wand2 size={10} className="inline mr-1" />
              Suggestions
            </span>
            {suggestions.slice(0, 5).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="px-2.5 py-1 text-[10px] bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 rounded-full border border-white/10 transition-colors cursor-pointer whitespace-nowrap"
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
