'use client';
import React from 'react';
import Link from 'next/link';
import { Footer } from './Footer';
import { UserMenu } from './Header';
import { Logo, ThemeToggle } from './ui';
import { ASSETS } from '@/lib/data';

export function AuthBackdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-20 border-b border-line2 bg-bg/95 sticky top-0 z-30">
        <div className="container-page h-full flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1"><Link href="/hosting" className="hidden sm:block text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-hover">Become a host</Link><ThemeToggle /><UserMenu /></div>
        </div>
      </header>
      <main className="flex-1 relative flex items-center justify-center py-12 px-4 overflow-hidden">
        <img src={ASSETS.loginBg} alt="Travel destinations" referrerPolicy="no-referrer" className="absolute inset-0 w-full h-full object-cover opacity-60 blur-[2px]" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <div className="absolute inset-0 bg-bg/60" />
        <div className="relative w-full flex justify-center">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

