'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { INSPIRATION } from '@/lib/data';
import { cn } from '@/lib/utils';

export function Inspiration() {
  const [tab, setTab] = useState('Popular');
  const [more, setMore] = useState(false);
  const list = INSPIRATION[tab];
  const shown = more ? list : list.slice(0, 11);
  return (
    <section className="pt-8 border-t border-line2">
      <h2 className="text-[22px] font-semibold mb-4 tracking-tight">Inspiration for future getaways</h2>
      <div className="flex items-center gap-6 border-b border-line2 text-sm overflow-x-auto no-scrollbar">
        {Object.keys(INSPIRATION).map((t) => (
          <button key={t} onClick={() => { setTab(t); setMore(false); }} className={cn('pb-3 border-b-2 whitespace-nowrap transition-colors', tab === t ? 'border-fg font-semibold' : 'border-transparent text-muted hover:text-fg')}>{t}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-y-6 gap-x-4 pt-6 text-sm">
        {shown.map(([c, t]) => (
          <div key={c + t}>
            <Link href={`/search?where=${encodeURIComponent(c)}`} className="font-semibold hover:underline block truncate">{c}</Link>
            <span className="text-muted text-xs block">{t}</span>
          </div>
        ))}
        {list.length > 11 && (
          <button onClick={() => setMore(!more)} className="text-left font-semibold hover:underline">{more ? 'Show less ∧' : 'Show more ∨'}</button>
        )}
      </div>
    </section>
  );
}
