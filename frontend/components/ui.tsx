'use client';
import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Close, LogoMark, Moon, Sun } from './Icons';

export function Logo({ word = true, className = '' }: { word?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="Airbnb Home" className={cn('flex items-center gap-1.5 text-brand', className)}>
      <LogoMark />
      {word && <span className="text-xl font-bold tracking-tight hidden md:inline-block">airbnb</span>}
    </Link>
  );
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useApp();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn('p-2.5 rounded-full hover:bg-hover text-fg transition-colors', className)}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </button>
  );
}

export function Toast() {
  const { toastMsg } = useApp();
  if (!toastMsg) return null;
  return (
    <div role="status" className="animate-toast fixed bottom-24 left-1/2 z-[100] -translate-x-1/2 rounded-xl bg-fg text-bg px-5 py-3 text-sm font-medium shadow-card max-w-[90vw]">
      {toastMsg}
    </div>
  );
}

export function useOutside(ref: React.RefObject<HTMLElement>, fn: () => void, on = true) {
  useEffect(() => {
    if (!on) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) fn();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, fn, on]);
}

export function Modal({ open, onClose, title, children, footer, wide = false }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', k);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] p-0 sm:p-4" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className={cn('animate-pop bg-surface text-fg border border-line2 shadow-card w-full max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-xl')}
      >
        <div className="relative flex items-center justify-center h-16 border-b border-line2 shrink-0">
          <button onClick={onClose} aria-label="Close" className="absolute left-4 p-2 rounded-full hover:bg-hover"><Close /></button>
          <h2 className="font-semibold text-base">{title}</h2>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
        {footer && <div className="border-t border-line2 p-4 flex items-center justify-between shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function Stepper({ label, sub, value, onChange, min = 0, max = 16 }: { label: string; sub?: string; value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  const b = 'w-8 h-8 rounded-full border border-line flex items-center justify-center text-muted hover:border-fg hover:text-fg transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:text-muted';
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <div className="font-semibold text-base">{label}</div>
        {sub && <div className="text-sm text-muted">{sub}</div>}
      </div>
      <div className="flex items-center gap-4">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={b}>−</button>
        <span className="w-6 text-center tabular-nums">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={b}>+</button>
      </div>
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label?: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cn('relative w-12 h-8 rounded-full transition-colors shrink-0', on ? 'bg-fg' : 'bg-line')}>
      <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-bg transition-all', on ? 'left-5' : 'left-1')} />
    </button>
  );
}

export function Avatar({ name, color = '#7C3AED', src, size = 40 }: { name: string; color?: string; src?: string; size?: number }) {
  if (src) return <img src={src} alt={name} referrerPolicy="no-referrer" style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />;
  return (
    <span style={{ width: size, height: size, background: color, fontSize: size * 0.42 }} className="rounded-full flex items-center justify-center text-white font-semibold shrink-0">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={className}
      onError={(e) => {
        const t = e.currentTarget;
        t.style.visibility = 'hidden';
        if (t.parentElement) t.parentElement.style.background = 'linear-gradient(135deg,#2a2a2a,#3a3a3a)';
      }}
    />
  );
}

export function useAuthGuard() {
  const { user, ready } = useApp();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (ready && !user) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [ready, user, path, router]);
  return { user, ready };
}

export function ComingSoonTag() {
  return <span className="text-xs font-semibold rounded-full border border-line px-2 py-0.5 text-muted">Coming soon</span>;
}
