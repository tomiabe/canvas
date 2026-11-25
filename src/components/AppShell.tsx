import React, { useEffect, useState } from 'react';
import { Palette, LayoutGrid, FolderOpen, Send, ShieldCheck, LogOut } from 'lucide-react';
import { api, type User } from '../lib/api';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const links = [
  { href: '/', label: 'Studio', icon: Palette },
  { href: '/gallery', label: 'Gallery', icon: LayoutGrid },
  { href: '/sketches', label: 'My sketches', icon: FolderOpen },
  { href: '/submit', label: 'Submit', icon: Send },
];

export function AppShell({ title, subtitle, children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    api.me().then(data => setUser(data.user)).catch(() => setUser(null));
  }, []);

  const signOut = async () => {
    await api.logout().catch(() => undefined);
    window.location.assign('/');
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas-bg text-canvas-text">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-canvas-line bg-canvas-surface px-6">
        <div className="flex items-center gap-4">
          <a href="/" className="flex items-center gap-2 text-[15px] font-semibold"><Palette size={19} /> Canvas</a>
          <span aria-hidden="true" className="h-6 w-px bg-canvas-white/10" />
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <a key={href} href={href} className={`flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] ${window.location.pathname === href ? 'bg-canvas-raised text-canvas-text' : 'text-canvas-muted hover:bg-canvas-white/5'}`}>
                <Icon size={15} /> <span className="hidden sm:inline">{label}</span>
              </a>
            ))}
            {user?.role === 'curator' && <a href="/moderation" className="flex h-9 items-center gap-2 rounded-lg px-3 text-[13px] text-canvas-muted hover:bg-canvas-white/5"><ShieldCheck size={15} /> Review</a>}
          </nav>
        </div>
        <div className="relative">
          {user ? (
            <>
              <button type="button" onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-lg bg-canvas-raised px-3 py-2 text-[13px]">
                <span className="flex size-6 items-center justify-center rounded-md bg-canvas-art-teal text-[11px] font-semibold">{user.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden sm:inline">{user.name}</span>
              </button>
              {menu && (
                <div className="absolute right-0 top-12 z-20 flex w-56 flex-col gap-1 rounded-xl border border-canvas-line bg-canvas-raised p-2 shadow-xl">
                  <div className="flex flex-col border-b border-canvas-line px-2 pb-2"><span className="text-[12px] font-semibold">{user.name}</span><span className="text-[11px] text-canvas-muted">{user.email}</span></div>
                  <a href="/sketches" className="rounded-md px-2 py-2 text-[12px] hover:bg-canvas-white/10">My sketches</a>
                  <a href="/submit" className="rounded-md px-2 py-2 text-[12px] hover:bg-canvas-white/10">My submissions</a>
                  <button type="button" onClick={signOut} className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-[12px] text-canvas-muted hover:bg-canvas-white/10"><LogOut size={13} /> Sign out</button>
                </div>
              )}
            </>
          ) : (
            <a href="/signin" className="rounded-lg bg-canvas-white px-4 py-2 text-[13px] font-semibold text-canvas-bg">Sign in</a>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-[32px] font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-[13px] text-canvas-muted">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
