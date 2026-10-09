'use client';
import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_PLACES, SERVICE_TYPES, SUGGESTED_WHERE } from '@/lib/data';
import { filtersToQuery } from '@/lib/search';
import { useApp } from '@/lib/store';
import { cn, fmtRange, fmtShort, guestLabel, today, toISO, addDays } from '@/lib/utils';
import { Calendar, weekendOf } from './Calendar';
import { Search as SearchIcon, Close } from './Icons';
import { Stepper, useOutside } from './ui';

export type Variant = 'stays' | 'experiences' | 'services';
type Seg = 'where' | 'when' | 'who' | 'type' | null;

export function SearchBar({ variant = 'stays', onSearched, initialType = '' }: { variant?: Variant; onSearched?: () => void; initialType?: string }) {
  const router = useRouter();
  const { search, setSearch } = useApp();
  const [active, setActive] = useState<Seg>(null);
  const [type, setType] = useState(initialType);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setActive(null), active !== null);

  const single = variant !== 'stays';
  const g = search.guests;
  const whoLabel = guestLabel(g);
  const set = (k: 'adults' | 'children' | 'infants' | 'pets', v: number) => {
    const next = { ...g, [k]: v };
    if ((k === 'children' || k === 'infants') && v > 0 && next.adults === 0) next.adults = 1;
    setSearch({ guests: next });
  };

  const go = () => {
    setActive(null);
    const q = filtersToQuery({ where: search.where, checkIn: search.checkIn, checkOut: single ? '' : search.checkOut, guests: g });
    const extra = type ? `${q ? '&' : ''}type=${encodeURIComponent(type)}` : '';
    const base = variant === 'stays' ? '/search' : variant === 'experiences' ? '/experiences' : '/services';
    router.push(`${base}?${q}${extra}`);
    onSearched?.();
  };

  const q = search.where.trim().toLowerCase();
  const matches = q ? ALL_PLACES.filter((p) => p.name.toLowerCase().includes(q)) : [];
  const seg = (s: Exclude<Seg, null>) =>
    cn('text-left px-6 py-2 rounded-full transition-colors min-w-0', active === s ? 'bg-surface2 shadow-pill ring-1 ring-line' : 'hover:bg-hover');

  const dateLabel = search.checkIn ? (single ? fmtShort(search.checkIn) : fmtRange(search.checkIn, search.checkOut)) : 'Add dates';

  return (
    <div ref={ref} className="relative max-w-[850px] mx-auto w-full">
      <div className={cn('flex items-center bg-surface border border-line rounded-full shadow-pill p-2 transition-colors', active ? 'bg-surface2' : '')}>
        <div className={cn(seg('where'), 'flex-[1.2]')} onClick={() => setActive('where')} role="button" tabIndex={0}>
          <div className="text-xs font-bold tracking-wide">Where</div>
          <input
            value={search.where}
            onChange={(e) => { setSearch({ where: e.target.value }); setActive('where'); }}
            onFocus={() => setActive('where')}
            onKeyDown={(e) => e.key === 'Enter' && go()}
            placeholder="Search destinations"
            className="w-full bg-transparent text-sm text-fg placeholder:text-muted outline-none truncate"
            aria-label="Where"
          />
        </div>
        <div className="h-8 w-px bg-line shrink-0" />
        <button type="button" className={cn(seg('when'), 'flex-1')} onClick={() => setActive('when')}>
          <div className="text-xs font-bold tracking-wide">When</div>
          <div className={cn('text-sm truncate', search.checkIn ? 'text-fg' : 'text-muted')}>{dateLabel}</div>
        </button>
        <div className="h-8 w-px bg-line shrink-0" />
        {variant === 'services' ? (
          <div className="flex-[1.2] flex items-center justify-between min-w-0 pr-0">
            <button type="button" className={cn(seg('type'), 'flex-1')} onClick={() => setActive('type')}>
              <div className="text-xs font-bold tracking-wide">Type of service</div>
              <div className={cn('text-sm truncate', type ? 'text-fg' : 'text-muted')}>{type || 'Add service'}</div>
            </button>
            <SearchBtn onClick={go} label />
          </div>
        ) : (
          <div className="flex-[1.2] flex items-center justify-between min-w-0">
            <button type="button" className={cn(seg('who'), 'flex-1')} onClick={() => setActive('who')}>
              <div className="text-xs font-bold tracking-wide">Who</div>
              <div className={cn('text-sm truncate', g.adults + g.children ? 'text-fg' : 'text-muted')}>{whoLabel}</div>
            </button>
            <SearchBtn onClick={go} label={active !== null} />
          </div>
        )}
      </div>

      {active === 'where' && (
        <div className="animate-pop absolute z-50 left-0 top-[calc(100%+12px)] w-[min(420px,calc(100vw-2rem))] bg-surface border border-line2 rounded-3xl shadow-pop p-4 max-h-[420px] overflow-y-auto">
          <div className="px-3 pt-2 pb-2 text-sm font-semibold">{q ? 'Matching destinations' : 'Suggested destinations'}</div>
          {(q ? matches : SUGGESTED_WHERE).map((p) => (
            <button key={p.name} type="button" onClick={() => { setSearch({ where: p.q }); setActive('when'); }} className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-hover text-left">
              <span className="w-12 h-12 rounded-xl bg-surface2 border border-line2 flex items-center justify-center text-2xl">{p.icon}</span>
              <span>
                <span className="block text-sm font-semibold">{p.name}</span>
                <span className="block text-sm text-muted">{p.sub}</span>
              </span>
            </button>
          ))}
          {q && matches.length === 0 && (
            <button type="button" onClick={() => { setActive('when'); }} className="w-full flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-hover text-left">
              <span className="w-12 h-12 rounded-xl bg-surface2 border border-line2 flex items-center justify-center text-2xl">🔎</span>
              <span className="text-sm font-semibold">Search “{search.where}”</span>
            </button>
          )}
        </div>
      )}

      {active === 'when' && (
        <div className="animate-pop absolute z-50 left-1/2 -translate-x-1/2 top-[calc(100%+12px)] w-[min(780px,calc(100vw-1.5rem))] bg-surface border border-line2 rounded-[32px] shadow-pop p-6 md:p-8 flex gap-8">
          <div className="hidden md:flex w-40 flex-col gap-3 shrink-0">
            {(() => {
              const t = today();
              const tm = addDays(t, 1);
              const [wa, wb] = weekendOf();
              const presets: [string, string, () => void][] = [
                ['Today', fmtShort(toISO(t)), () => setSearch({ checkIn: toISO(t), checkOut: single ? '' : toISO(tm) })],
                ['Tomorrow', fmtShort(toISO(tm)), () => setSearch({ checkIn: toISO(tm), checkOut: single ? '' : toISO(addDays(tm, 1)) })],
                ['This weekend', fmtRange(wa, wb), () => setSearch({ checkIn: wa, checkOut: single ? '' : wb })],
              ];
              return presets.map(([a, b, fn]) => (
                <button key={a} type="button" onClick={() => { fn(); if (single) setActive(variant === 'services' ? 'type' : 'who'); }} className="border border-line rounded-2xl p-4 text-left hover:border-fg transition-colors">
                  <div className="font-semibold text-[15px]">{a}</div>
                  <div className="text-sm text-muted mt-0.5">{b}</div>
                </button>
              ));
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <Calendar
              start={search.checkIn}
              end={search.checkOut}
              single={single}
              months={single ? 1 : 2}
              onChange={(a, b) => {
                setSearch({ checkIn: a, checkOut: b });
                if (single && a) setActive(variant === 'services' ? 'type' : 'who');
                else if (a && b) setActive('who');
              }}
            />
            {(search.checkIn || search.checkOut) && (
              <div className="text-right mt-3">
                <button type="button" onClick={() => setSearch({ checkIn: '', checkOut: '' })} className="text-sm font-semibold underline">Clear dates</button>
              </div>
            )}
          </div>
        </div>
      )}

      {active === 'who' && (
        <div className="animate-pop absolute z-50 right-0 top-[calc(100%+12px)] w-[min(400px,calc(100vw-2rem))] bg-surface border border-line2 rounded-3xl shadow-pop px-6 py-3 divide-y divide-line2">
          <Stepper label="Adults" sub="Ages 13 or above" value={g.adults} onChange={(n) => set('adults', n)} max={16} />
          <Stepper label="Children" sub="Ages 2–12" value={g.children} onChange={(n) => set('children', n)} max={15} />
          <Stepper label="Infants" sub="Under 2" value={g.infants} onChange={(n) => set('infants', n)} max={5} />
          <Stepper label="Pets" sub="Bringing a service animal?" value={g.pets} onChange={(n) => set('pets', n)} max={5} />
        </div>
      )}

      {active === 'type' && (
        <div className="animate-pop absolute z-50 right-0 top-[calc(100%+12px)] w-[min(450px,calc(100vw-2rem))] bg-surface border border-line2 rounded-3xl shadow-pop p-6">
          <div className="flex flex-wrap gap-2.5">
            {SERVICE_TYPES.map((s) => (
              <button key={s} type="button" onClick={() => { setType(type === s ? '' : s); }} className={cn('px-4 py-2 rounded-full border text-sm font-medium transition-colors', type === s ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg hover:bg-hover')}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchBtn({ onClick, label }: { onClick: () => void; label?: boolean }) {
  return (
    <button type="button" aria-label="Search" onClick={onClick} className={cn('h-12 bg-brand hover:bg-brand-dark rounded-full flex items-center justify-center gap-2 text-white shrink-0 ml-2 shadow-lg shadow-brand/20 transition-colors font-semibold text-[15px]', label ? 'px-5' : 'w-12')}>
      <SearchIcon />
      {label && <span>Search</span>}
    </button>
  );
}

export { Close };
