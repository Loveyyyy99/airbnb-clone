'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Menu } from './Icons';
import { Avatar, Logo, ThemeToggle, useOutside } from './ui';

const NAV = [['Today', '/host'], ['Calendar', '/host/calendar'], ['Listings', '/host/listings'], ['Messages', '/host/messages']];

export function HostHeader() {
  const { user, setHosting, logout, toast } = useApp();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  const item = 'w-full text-left px-4 py-3 text-sm hover:bg-hover';
  return (
    <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-md border-b border-line2">
      <div className="container-page h-20 flex items-center justify-between">
        <Logo className="w-[120px]" />
        <nav className="flex items-center gap-1 sm:gap-6 text-[15px] font-semibold">
          {NAV.map(([l, h]) => {
            const on = h === '/host' ? path === '/host' : path.startsWith(h);
            return (<Link key={h} href={h} className={cn('py-2 px-2 sm:px-0 border-b-2 transition-colors', on ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg')}>{l}</Link>);
          })}
        </nav>
        <div className="flex items-center gap-1 w-[120px] sm:w-auto justify-end">
          <Link href="/" onClick={() => setHosting(false)} className="hidden md:block text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-hover">Switch to travelling</Link>
          <ThemeToggle />
          <div ref={ref} className="relative">
            <button onClick={() => setOpen(!open)} aria-label="Menu" className="flex items-center gap-3 border border-line rounded-full pl-3.5 pr-2 py-1.5 hover:shadow-pill bg-surface">
              <Menu /><Avatar name={user?.firstName || 'H'} size={28} color="#222" />
            </button>
            {open && (
              <div className="animate-pop absolute right-0 top-[calc(100%+8px)] w-60 bg-surface border border-line2 rounded-2xl shadow-pop py-2">
                <button className={item} onClick={() => { setOpen(false); router.push('/host/profile'); }}>Profile</button>
                <button className={item} onClick={() => { setOpen(false); router.push('/account'); }}>Account</button>
                <button className={item} onClick={() => { setOpen(false); router.push('/host/listings'); }}>Listings</button>
                <button className={item} onClick={() => { setOpen(false); setHosting(false); router.push('/'); }}>Switch to travelling</button>
                <div className="my-2 border-t border-line2" />
                <button className={item} onClick={() => { setOpen(false); logout(); toast('Logged out'); router.push('/'); }}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
