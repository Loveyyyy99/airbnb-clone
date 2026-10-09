'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Globe, Menu, UserIcon } from './Icons';
import { SearchBar, Variant } from './SearchBar';
import { Avatar, Logo, Modal, ThemeToggle, useOutside } from './ui';

export type Tab = 'all' | 'homes' | 'experiences' | 'services' | 'none';

const TABS: { id: Exclude<Tab, 'none'>; label: string; icon: string; href: string }[] = [
  { id: 'all', label: 'All', icon: '🌐', href: '/' },
  { id: 'homes', label: 'Homes', icon: '🏡', href: '/homes' },
  { id: 'experiences', label: 'Experiences', icon: '🎈', href: '/experiences' },
  { id: 'services', label: 'Services', icon: '🛎️', href: '/services' },
];

export function LocaleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useApp();
  return (
    <Modal open={open} onClose={onClose} title="Language and region">
      <div className="grid grid-cols-2 gap-3">
        {[['English (IN)', 'India'], ['English (US)', 'United States'], ['हिन्दी', 'भारत'], ['ਪੰਜਾਬੀ', 'ਭਾਰਤ']].map(([a, b], i) => (
          <button key={a} onClick={() => { toast(i === 0 ? 'Already using English (IN)' : 'More languages coming soon'); onClose(); }} className={cn('text-left rounded-xl px-4 py-3 border hover:bg-hover', i === 0 ? 'border-fg' : 'border-line')}>
            <div className="text-sm">{a}</div>
            <div className="text-sm text-muted">{b}</div>
          </button>
        ))}
      </div>
      <h3 className="font-semibold mt-6 mb-3">Currency</h3>
      <button onClick={onClose} className="rounded-xl px-4 py-3 border border-fg text-left">
        <div className="text-sm">Indian rupee</div>
        <div className="text-sm text-muted">INR – ₹</div>
      </button>
    </Modal>
  );
}

export function UserMenu({ onLocale }: { onLocale?: () => void }) {
  const { user, logout, setHosting, toast } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  const go = (href: string) => { setOpen(false); router.push(href); };
  const item = 'w-full text-left px-4 py-3 text-sm hover:bg-hover';
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Menu" className="flex items-center gap-3 border border-line rounded-full pl-3.5 pr-2 py-1.5 hover:shadow-pill hover:border-muted transition-all bg-surface ml-1">
        <Menu />
        {user ? <Avatar name={user.firstName || 'U'} src={user.avatarUrl || undefined} size={28} color="#222" /> : (
          <div className="w-7 h-7 bg-surface2 rounded-full flex items-center justify-center text-muted overflow-hidden border border-line"><UserIcon className="w-5 h-5 translate-y-0.5" /></div>
        )}
      </button>
      {open && (
        <div className="animate-pop absolute right-0 top-[calc(100%+8px)] w-64 bg-surface border border-line2 rounded-2xl shadow-pop py-2 z-[60]">
          {user ? (
            <>
              <button className={cn(item, 'font-semibold')} onClick={() => go('/messages')}>Messages</button>
              <button className={cn(item, 'font-semibold')} onClick={() => go('/trips')}>Trips</button>
              <button className={cn(item, 'font-semibold')} onClick={() => go('/wishlists')}>Wishlists</button>
              <div className="my-2 border-t border-line2" />
              <button className={item} onClick={() => go('/host')}>Switch to hosting</button>
              <button className={item} onClick={() => go('/profile')}>Profile</button>
              <button className={item} onClick={() => go('/account')}>Account</button>
              <button className={item} onClick={() => go('/hosting')}>Airbnb your home</button>
              <div className="my-2 border-t border-line2" />
              <button className={item} onClick={() => go('/coming-soon?t=Help Centre')}>Help Centre</button>
              <button className={item} onClick={() => { setOpen(false); logout(); toast('Logged out'); router.push('/'); }}>Log out</button>
            </>
          ) : (
            <>
              <button className={cn(item, 'font-semibold')} onClick={() => go('/signup')}>Sign up</button>
              <button className={item} onClick={() => go('/login')}>Log in</button>
              <div className="my-2 border-t border-line2" />
              <button className={item} onClick={() => go('/coming-soon?t=Gift cards')}>Gift cards</button>
              <button className={item} onClick={() => go('/hosting')}>Airbnb your home</button>
              <button className={item} onClick={() => go('/coming-soon?t=Host an experience')}>Host an experience</button>
              <button className={item} onClick={() => go('/coming-soon?t=Help Centre')}>Help Centre</button>
            </>
          )}
          <button className={cn(item, 'md:hidden')} onClick={() => { setOpen(false); onLocale?.(); }}>Language & currency</button>
        </div>
      )}
    </div>
  );
}

export function Header({ active = 'all', variant, compact = false, border = true }: { active?: Tab; variant?: Variant; compact?: boolean; border?: boolean }) {
  const { user, setHosting } = useApp();
  const router = useRouter();
  const [locale, setLocale] = useState(false);
  const v: Variant = variant || (active === 'experiences' ? 'experiences' : active === 'services' ? 'services' : 'stays');
  return (
    <header className={cn('sticky top-0 z-50 bg-bg/95 backdrop-blur-md', border && 'border-b border-line2')}>
      <div className="container-page flex items-center justify-between h-20">
        <Logo className="w-[120px]" />
        {!compact ? (
          <nav className="flex items-center gap-4 sm:gap-8 text-[15px] font-medium" aria-label="Main categories">
            {TABS.map((t) => (
              <Link key={t.id} href={t.href} className={cn('flex items-center gap-2 pb-2 border-b-2 transition-all', active === t.id ? 'border-fg text-fg font-semibold' : 'border-transparent text-muted hover:text-fg')}>
                <span className="text-xl">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </Link>
            ))}
          </nav>
        ) : (
          <Link href="/search" className="hidden md:flex items-center border border-line rounded-full shadow-pill pl-4 pr-2 py-2 text-sm font-semibold gap-3 hover:shadow-card transition-shadow">
            <span>🏡 Anywhere</span><span className="h-5 w-px bg-line" /><span>Anytime</span><span className="h-5 w-px bg-line" /><span className="text-muted font-normal">Add guests</span>
            <span className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
          </Link>
        )}
        <div className="flex items-center gap-1 w-[120px] sm:w-auto justify-end">
          {user ? (
            <button onClick={() => { setHosting(true); router.push('/host'); }} className="hidden sm:inline-block text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-hover transition-colors">Switch to hosting</button>
          ) : (
            <Link href="/hosting" className="hidden sm:inline-block text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-hover transition-colors">Become a host</Link>
          )}
          <ThemeToggle />
          <button aria-label="Language & currency selector" onClick={() => setLocale(true)} className="hidden md:block p-2.5 rounded-full hover:bg-hover transition-colors"><Globe /></button>
          <UserMenu onLocale={() => setLocale(true)} />
        </div>
      </div>
      {!compact && (
        <div className="pb-6 px-4">
          <SearchBar variant={v} />
        </div>
      )}
      <LocaleModal open={locale} onClose={() => setLocale(false)} />
    </header>
  );
}
