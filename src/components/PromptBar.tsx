import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface PromptBarProps {
  onGenerate: (prompt: string) => Promise<void>;
  isLoading: boolean;
}

export function PromptBar({ onGenerate, isLoading }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await onGenerate(prompt);
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4">
      <form 
        onSubmit={handleSubmit}
        className="glass-panel rounded-full shadow-2xl flex items-center p-1.5 focus-within:ring-2 focus-within:ring-white/20 transition-shadow"
      >
        <div className="w-10 h-10 flex items-center justify-center shrink-0 text-white/50 bg-white/5 rounded-full ml-1">
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
          className={`h-10 px-6 rounded-full font-medium text-sm transition-colors cursor-pointer ${
            prompt.trim() && !isLoading 
              ? 'bg-white text-black hover:bg-white/90' 
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          }`}
        >
          Generate
        </button>
      </form>
    </div>
  );
}
