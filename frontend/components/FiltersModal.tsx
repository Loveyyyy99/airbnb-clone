'use client';
import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AMENITIES } from '@/lib/data';
import { defaultFilters, Filters, KIND_GROUPS, toApiParams } from '@/lib/search';
import { cn, inr } from '@/lib/utils';
import { Check } from './Icons';
import { Modal } from './ui';

const OPTS = ['Any', '1', '2', '3', '4', '5', '6', '7', '8+'];

function Pills({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTS.map((o, i) => (
        <button key={o} type="button" onClick={() => onChange(i)} className={cn('min-w-[56px] px-4 py-2 rounded-full border text-sm font-medium transition-colors', value === i ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg')}>{o}</button>
      ))}
    </div>
  );
}

export function FiltersModal({ open, onClose, filters, onApply, }: { open: boolean; onClose: () => void; filters: Filters; onApply: (f: Filters) => void }) {
  const [f, setF] = useState(filters);
  useEffect(() => { if (open) setF(filters); }, [open, filters]);
  const up = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));
  const toggle = (k: 'kinds' | 'amenities', v: string) => up(k, f[k].includes(v) ? f[k].filter((x) => x !== v) : [...f[k], v]);
  const MAX = defaultFilters.maxPrice;
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      api.get<{ total: number }>('/listings/count', toApiParams(f), ac.signal).then((r) => setN(r.total)).catch(() => {});
    }, 250);
    return () => { clearTimeout(t); ac.abort(); };
  }, [open, f]);
  const sec = 'py-8 border-b border-line2';
  const h = 'text-[22px] font-semibold mb-5';
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Filters"
      wide
      footer={(
        <>
          <button onClick={() => setF({ ...defaultFilters, where: f.where, checkIn: f.checkIn, checkOut: f.checkOut, guests: f.guests, category: f.category, sort: f.sort })} className="font-semibold underline px-2 py-2 rounded-lg hover:bg-hover">Clear all</button>
          <button onClick={() => { onApply(f); onClose(); }} className="btn-dark px-6 py-3.5 text-base">{n === null ? 'Show places' : `Show ${n} place${n === 1 ? '' : 's'}`}</button>
        </>
      )}
    >
      <div className="-mt-4">
        <section className={sec}>
          <h3 className={h}>Type of place</h3>
          <div className="grid grid-cols-3 rounded-xl border border-line overflow-hidden text-center">
            {([['any', 'Any type'], ['room', 'Room'], ['entire', 'Entire home']] as const).map(([k, l]) => (
              <button key={k} onClick={() => up('place', k)} className={cn('py-4 font-medium text-sm transition-colors', f.place === k ? 'bg-fg text-bg' : 'hover:bg-hover')}>{l}</button>
            ))}
          </div>
        </section>
        <section className={sec}>
          <h3 className={h}>Price range</h3>
          <p className="text-muted text-sm -mt-3 mb-5">Nightly prices before fees and taxes</p>
          <div className="space-y-5">
            <label className="block text-xs text-muted">Minimum
              <input type="range" min={0} max={MAX} step={500} value={f.minPrice} onChange={(e) => up('minPrice', Math.min(Number(e.target.value), f.maxPrice - 500))} className="w-full accent-brand" />
            </label>
            <label className="block text-xs text-muted">Maximum
              <input type="range" min={0} max={MAX} step={500} value={f.maxPrice} onChange={(e) => up('maxPrice', Math.max(Number(e.target.value), f.minPrice + 500))} className="w-full accent-brand" />
            </label>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 border border-line rounded-full px-4 py-2"><div className="text-xs text-muted">Minimum</div><div className="font-medium">{inr(f.minPrice)}</div></div>
              <span className="text-muted">–</span>
              <div className="flex-1 border border-line rounded-full px-4 py-2"><div className="text-xs text-muted">Maximum</div><div className="font-medium">{inr(f.maxPrice)}{f.maxPrice >= MAX ? '+' : ''}</div></div>
            </div>
          </div>
        </section>
        <section className={sec}>
          <h3 className={h}>Rooms and beds</h3>
          <div className="space-y-6">
            <div><div className="mb-3 font-medium">Bedrooms</div><Pills value={f.bedrooms} onChange={(n) => up('bedrooms', n)} /></div>
            <div><div className="mb-3 font-medium">Beds</div><Pills value={f.beds} onChange={(n) => up('beds', n)} /></div>
            <div><div className="mb-3 font-medium">Bathrooms</div><Pills value={f.baths} onChange={(n) => up('baths', n)} /></div>
          </div>
        </section>
        <section className={sec}>
          <h3 className={h}>Property type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {KIND_GROUPS.map((k) => (
              <button key={k} onClick={() => toggle('kinds', k)} className={cn('rounded-xl border p-4 text-left font-medium text-sm transition-colors', f.kinds.includes(k) ? 'border-fg bg-hover' : 'border-line hover:border-fg')}>{k}</button>
            ))}
          </div>
        </section>
        <section className={sec}>
          <h3 className={h}>Amenities</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {AMENITIES.filter((a) => a.group !== 'safety').slice(0, 16).map((a) => (
              <label key={a.id} className="flex items-center gap-3 cursor-pointer">
                <span className={cn('w-6 h-6 rounded-md border flex items-center justify-center', f.amenities.includes(a.id) ? 'bg-fg border-fg text-bg' : 'border-line')}>{f.amenities.includes(a.id) && <Check className="w-3.5 h-3.5" />}</span>
                <input type="checkbox" className="sr-only" checked={f.amenities.includes(a.id)} onChange={() => toggle('amenities', a.id)} />
                <span className="text-[15px]">{a.label}</span>
              </label>
            ))}
          </div>
        </section>
        <section className="py-8">
          <h3 className={h}>Booking options</h3>
          {([['instantBook', 'Instant Book', 'Listings you can book without waiting for host approval'], ['selfCheckIn', 'Self check-in', 'Easy access to the property once you arrive'], ['freeCancel', 'Free cancellation', 'Only show stays that offer free cancellation'], ['favourite', 'Guest favourite', 'The most loved homes on Airbnb']] as const).map(([k, l, d]) => (
            <label key={k} className="flex items-center justify-between py-3 cursor-pointer">
              <span><span className="block font-medium">{l}</span><span className="block text-sm text-muted">{d}</span></span>
              <input type="checkbox" className="w-6 h-6 accent-brand" checked={f[k]} onChange={(e) => up(k, e.target.checked)} />
            </label>
          ))}
        </section>
      </div>
    </Modal>
  );
}
