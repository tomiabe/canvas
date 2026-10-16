import React, { useState } from 'react';
import { Check, Copy, Monitor, Palette } from 'lucide-react';

export function DesktopNotice() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const link = 'https://canvas.tomiabe.com/';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-[#0b0b0d] text-white font-sans antialiased">
      <header className="px-6 py-6 sm:px-8">
        <a href="/" className="inline-flex items-center gap-2.5 text-sm font-semibold tracking-tight rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70">
          <Palette size={18} aria-hidden="true" />
          Canvas
        </a>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-7 w-20 h-20 rounded-3xl border border-white/10 bg-white/[0.03] flex items-center justify-center">
            <Monitor size={34} strokeWidth={1.25} className="text-white/65" aria-hidden="true" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/40 mb-3">Desktop experience</p>
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight text-white/90">A little more room to create</h1>
          <p className="mt-4 text-sm leading-6 text-white/50">
            Canvas is currently designed for laptop and desktop screens. Open this page on a larger screen to create and refine your generative art.
          </p>
          <button onClick={copyLink} className="mt-8 min-h-12 w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70">
            {copyState === 'copied' ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copyState === 'copied' ? 'Link copied' : 'Copy link'}
          </button>
          <p role="status" className="mt-3 text-xs leading-5 text-white/50">
            {copyState === 'copied' ? 'Ready to open on your computer.' : copyState === 'failed' ? 'Select and copy the link below.' : 'Already on a computer? Widen your browser window.'}
          </p>
          {copyState === 'failed' && <input aria-label="Site link" readOnly value={link} onFocus={event => event.target.select()}
            className="mt-3 w-full rounded-lg border border-white/15 bg-white/5 p-3 text-sm text-white/80 focus:outline-2 focus:outline-white/50" />}
        </div>
      </main>
    </div>
  );
}
