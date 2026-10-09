'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { inr } from '@/lib/utils';

export interface MapPoint { id: string; lat: number; lng: number; price: number }

export function MapPanel({ items }: { items: MapPoint[] }) {
  const router = useRouter();
  if (!items.length) return <div className="h-full rounded-2xl border border-line2 bg-surface flex items-center justify-center text-muted">No stays to show on the map</div>;
  const lats = items.map((i) => i.lat);
  const lngs = items.map((i) => i.lng);
  const [a, b] = [Math.min(...lats), Math.max(...lats)];
  const [c, d] = [Math.min(...lngs), Math.max(...lngs)];
  const px = (v: number, lo: number, hi: number) => (hi === lo ? 50 : 8 + ((v - lo) / (hi - lo)) * 84);
  return (
    <div className="relative h-full min-h-[480px] rounded-2xl border border-line2 overflow-hidden bg-surface2" style={{ backgroundImage: 'linear-gradient(rgb(var(--line2)/.7) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--line2)/.7) 1px,transparent 1px)', backgroundSize: '48px 48px' }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 30% 40%, rgba(255,56,92,0.08), transparent 55%)' }} />
      {items.slice(0, 40).map((l) => (
        <button key={l.id} onClick={() => router.push(`/rooms/${l.id}`)} style={{ left: `${px(l.lng, c, d)}%`, top: `${100 - px(l.lat, a, b)}%` }} className="absolute -translate-x-1/2 -translate-y-1/2 bg-bg text-fg border border-line shadow-pill rounded-full px-3 py-1.5 text-sm font-semibold hover:scale-110 hover:bg-fg hover:text-bg transition-transform">
          {inr(l.price)}
        </button>
      ))}
    </div>
  );
}
