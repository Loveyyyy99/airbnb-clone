'use client';
import React from 'react';
import { Footer } from './Footer';
import { Header, Tab } from './Header';
import type { Variant } from './SearchBar';

export function Shell({ active, variant, compact, children, footer = true }: { active?: Tab; variant?: Variant; compact?: boolean; children: React.ReactNode; footer?: boolean }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header active={active} variant={variant} compact={compact} />
      <main className="flex-1">{children}</main>
      {footer && <Footer />}
    </div>
  );
}
