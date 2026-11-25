import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { api } from '../lib/api';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const next = new URLSearchParams(window.location.search).get('next') || '/sketches';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await api.devLogin(email, name);
      window.location.assign(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas-bg px-5 text-canvas-text">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-xl border border-canvas-line bg-canvas-surface p-7">
        <div className="flex items-center gap-2 text-[15px] font-semibold"><Palette size={19} /> Canvas</div>
        <div className="flex flex-col gap-1"><h1 className="text-[22px] font-semibold">Save your work</h1><p className="text-[12px] leading-5 text-canvas-muted">Sign in to keep sketches, submit to the gallery, and come back to them later.</p></div>
        <div className="flex flex-col gap-2">
          {['Google', 'Apple', 'Yahoo'].map(provider => (
            <div key={provider} className="flex h-11 items-center justify-between rounded-lg border border-canvas-line bg-canvas-raised px-4 text-[13px]">
              <span>Continue with {provider}</span><span className="text-[10px] text-canvas-muted">needs credentials</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-canvas-muted"><span className="h-px flex-1 bg-canvas-white/10" /> or <span className="h-px flex-1 bg-canvas-white/10" /></div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input value={name} onChange={event => setName(event.target.value)} placeholder="Your name" className="h-11 rounded-lg border border-canvas-line bg-canvas-raised px-3 text-[13px] outline-none focus:border-canvas-white/40" />
          <input value={email} onChange={event => setEmail(event.target.value)} type="email" placeholder="Email address" className="h-11 rounded-lg border border-canvas-line bg-canvas-raised px-3 text-[13px] outline-none focus:border-canvas-white/40" />
          {error && <p role="alert" className="text-[11px] text-canvas-art-gold">{error}</p>}
          <button type="submit" className="h-11 rounded-lg bg-canvas-white text-[13px] font-semibold text-canvas-bg">Continue with local account</button>
        </form>
        <p className="text-[10px] text-canvas-muted">Local accounts are for development. Google, Apple and Yahoo can be enabled once OAuth credentials are configured.</p>
        <a href="/" className="text-center text-[11px] text-canvas-muted underline">Back to Canvas</a>
      </div>
    </div>
  );
}
