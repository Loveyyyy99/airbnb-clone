'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import type { Activity, Listing } from '@/lib/types';
import { cn, inr } from '@/lib/utils';
import { ChevL, ChevR, Heart } from './Icons';
import { Img } from './ui';

export function HeartButton({ id, className = '' }: { id: string; className?: string }) {
  const { wishlist, toggleWish } = useApp();
  const on = wishlist.includes(id);
  return (
    <button
      type="button"
      aria-label={on ? 'Remove from wishlist' : 'Save to wishlist'}
      aria-pressed={on}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(id); }}
      className={cn('absolute top-3 right-3 drop-shadow-md hover:scale-110 transition-transform', className)}
    >
      <Heart filled={on} className={cn('h-6 w-6', on && 'animate-heart')} />
    </button>
  );
}

export function ListingCard({ l, nights = 1, carousel = false, className = '' }: { l: Listing; nights?: number; carousel?: boolean; className?: string }) {
  const [i, setI] = useState(0);
  const label = `${l.kind} in ${l.area}`;
  const imgs = carousel ? l.images : [l.images[0]];
  const move = (d: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setI((x) => (x + d + imgs.length) % imgs.length);
  };
  return (
    <Link href={`/rooms/${l.id}`} className={cn('group block cursor-pointer', className)}>
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2.5 bg-surface border border-line2">
        {imgs.map((src, k) => (
          <Img key={k} src={src} alt={label} className={cn('absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300', k !== i && 'hidden')} />
        ))}
        {l.guestFavourite && (
          <span className="absolute top-3 left-3 bg-bg/85 backdrop-blur-md text-fg border border-fg/10 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">Guest favourite</span>
        )}
        <HeartButton id={l.id} className="text-white" />
        {carousel && imgs.length > 1 && (
          <>
            <button aria-label="Previous photo" onClick={move(-1)} className="opacity-0 group-hover:opacity-100 absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow hover:scale-105 transition"><ChevL /></button>
            <button aria-label="Next photo" onClick={move(1)} className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow hover:scale-105 transition"><ChevR /></button>
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1">
              {imgs.map((_, k) => (<span key={k} className={cn('w-1.5 h-1.5 rounded-full', k === i ? 'bg-white' : 'bg-white/60')} />))}
            </div>
          </>
        )}
      </div>
      <h3 className="text-sm font-semibold truncate">{label}</h3>
      <p className="text-xs text-muted font-medium">
        <span className="text-fg font-semibold">{inr(l.price * nights)}</span> for {nights} night{nights > 1 ? 's' : ''}
        {l.rating > 0 && <> · <span className="font-normal text-fg/80">★ {l.rating}</span></>}
      </p>
    </Link>
  );
}

export function ActivityCard({ a, className = '' }: { a: Activity; className?: string }) {
  const href = `/${a.kind === 'experience' ? 'experiences' : 'services'}/${a.id}`;
  return (
    <Link href={href} className={cn('group block cursor-pointer', className)}>
      <div className="relative aspect-square w-full rounded-2xl overflow-hidden mb-2.5 bg-surface border border-line2">
        <Img src={a.image} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        {a.badge && (
          <span className="absolute top-3 left-3 bg-bg/85 backdrop-blur-md text-fg border border-fg/10 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
            {a.badge === 'Original' ? '✏️ Original' : a.badge}
          </span>
        )}
        <HeartButton id={a.id} className="text-white" />
      </div>
      {a.when && <p className="text-xs text-muted font-medium">{a.when}</p>}
      <h3 className="text-sm font-semibold leading-snug line-clamp-2">{a.title}</h3>
      {a.location && <p className="text-xs text-muted">{a.location}</p>}
      <p className="text-xs text-muted font-medium">
        {a.comingSoon ? a.comingSoon : (
          <>
            From <span className="text-fg font-semibold">{inr(a.price)}</span> / {a.unit}
            {a.rating > 0 && <> · <span className="font-normal text-fg/80">★ {a.rating}</span></>}
          </>
        )}
      </p>
      {a.minimum && <p className="text-xs text-muted">Minimum {inr(a.minimum)} to book</p>}
    </Link>
  );
}

export function Row({ title, href, children, cols = 7, size, sub }: { title: string; href?: string; children: React.ReactNode; cols?: number; size?: string; sub?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ l: true, r: false });
  const router = useRouter();
  const update = useCallback(() => {
    const e = ref.current;
    if (!e) return;
    setPos({ l: e.scrollLeft <= 4, r: e.scrollLeft + e.clientWidth >= e.scrollWidth - 4 });
  }, []);
  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);
  const count = React.Children.count(children);
  useEffect(() => { update(); }, [count, update]);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.9, behavior: 'smooth' });
  const btn = 'w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center transition-colors';
  const w = size || (cols === 7 ? 'w-[44%] sm:w-[30%] md:w-[23%] lg:w-[calc((100%-6*16px)/7)]' : 'w-[44%] sm:w-[30%] lg:w-[calc((100%-5*16px)/6)]');
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2
            onClick={() => href && router.push(href)}
            className={cn('text-[22px] font-semibold tracking-tight flex items-center gap-2 group', href && 'cursor-pointer')}
          >
            {title}
            {href && <span className="inline-block transition-transform group-hover:translate-x-1">→</span>}
          </h2>
          {sub && <p className="text-sm text-muted mt-0.5">{sub}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Scroll left" disabled={pos.l} onClick={() => scroll(-1)} className={cn(btn, pos.l ? 'text-muted/50 cursor-not-allowed' : 'hover:bg-hover hover:border-muted')}><ChevL /></button>
          <button aria-label="Scroll right" disabled={pos.r} onClick={() => scroll(1)} className={cn(btn, pos.r ? 'text-muted/50 cursor-not-allowed' : 'hover:bg-hover hover:border-muted')}><ChevR /></button>
        </div>
      </div>
      <div ref={ref} onScroll={update} className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-1">
        {React.Children.map(children, (c) => (<div className={cn('shrink-0 snap-start', w)}>{c}</div>))}
      </div>
    </section>
  );
}

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="aspect-square w-full rounded-2xl bg-surface2 mb-2.5" />
      <div className="h-3.5 w-3/4 rounded bg-surface2 mb-2" />
      <div className="h-3 w-1/2 rounded bg-surface2" />
    </div>
  );
}
