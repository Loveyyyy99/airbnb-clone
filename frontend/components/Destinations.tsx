'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevL, ChevR } from './Icons';
import { Img } from './ui';
import { cn } from '@/lib/utils';

export function Destinations({ items }: { items: { name: string; sub: string; image: string }[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ l: true, r: false });
  const update = useCallback(() => {
    const e = ref.current;
    if (e) setPos({ l: e.scrollLeft <= 4, r: e.scrollLeft + e.clientWidth >= e.scrollWidth - 4 });
  }, []);
  useEffect(() => { update(); }, [update]);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  const btn = 'w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center transition-colors';
  return (
    <section className="pt-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[22px] font-semibold tracking-tight">Destinations for you</h2>
        <div className="flex items-center gap-2">
          <button aria-label="Scroll left" disabled={pos.l} onClick={() => scroll(-1)} className={cn(btn, pos.l ? 'text-muted/50 cursor-not-allowed' : 'hover:bg-hover')}><ChevL /></button>
          <button aria-label="Scroll right" disabled={pos.r} onClick={() => scroll(1)} className={cn(btn, pos.r ? 'text-muted/50 cursor-not-allowed' : 'hover:bg-hover')}><ChevR /></button>
        </div>
      </div>
      <div ref={ref} onScroll={update} className="flex gap-4 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        {items.map((d) => (
          <Link key={d.name} href={`/search?where=${encodeURIComponent(d.name)}`} className="shrink-0 w-36 sm:w-40 group">
            <div className="aspect-square w-full rounded-2xl overflow-hidden mb-2 bg-surface border border-line2">
              <Img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <h4 className="text-sm font-semibold">{d.name}</h4>
            <p className="text-xs text-muted truncate">{d.sub}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
