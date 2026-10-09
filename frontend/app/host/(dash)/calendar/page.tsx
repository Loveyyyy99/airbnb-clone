'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Modal } from '@/components/ui';
import { useFetch } from '@/components/hooks';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { Booking, Listing } from '@/lib/types';
import { cn, fmtLong, inr, MONTHS, toISO, today } from '@/lib/utils';

export default function CalendarPage() {
  const { user, toast } = useApp();
  const { data, setData, loading } = useFetch((sg) => api.get<Listing[]>('/host/listings', undefined, sg), [user?.id], !!user);
  const pub = (data ?? []).filter((l) => l.status === 'published');
  const [sel, setSel] = useState(0);
  const [day, setDay] = useState('');
  const [priceModal, setPriceModal] = useState(false);
  const [discModal, setDiscModal] = useState(false);
  const [price, setPrice] = useState('');
  const l = pub[sel];
  const lid = l?.id;
  const [bk, setBk] = useState<Booking[]>([]);
  useEffect(() => {
    if (!lid) return;
    api.get<Booking[]>(`/host/listings/${lid}/bookings`).then(setBk).catch(() => {});
  }, [lid]);
  const swap = (n: Listing) => setData((x) => (x ? x.map((o) => (o.id === n.id ? n : o)) : x));
  const patch = async (body: Record<string, unknown>, ok: string) => {
    try { swap(await api.patch<Listing>(`/host/listings/${l!.id}`, body)); toast(ok); return true; } catch (e) { toast(errMsg(e)); return false; }
  };
  const months = useMemo(() => { const t = today(); return [0, 1, 2].map((i) => new Date(t.getFullYear(), t.getMonth() + i, 1)); }, []);
  if (loading) return <div className="max-w-xl mx-auto px-6 py-24 text-center text-muted">Loading calendar…</div>;
  if (!l) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center"><div className="text-6xl mb-4">🗓️</div><h1 className="text-2xl font-semibold">No published listings</h1><p className="text-muted mt-2">Publish a listing to manage your availability and pricing.</p><Link href="/host/listings" className="inline-block mt-6 btn-dark px-6 py-3 text-sm">Go to listings</Link></div>
    );
  }
  const booked = (d: string) => bk.find((b) => b.checkIn <= d && d < b.checkOut);
  const blockedByHost = (d: string) => (l.hostBlocked || []).includes(d);
  const dayPrice = (d: string) => { const w = new Date(d + 'T00:00').getDay(); return w === 5 || w === 6 ? Math.round(l.price * (1 + (l.weekend ?? 4) / 100)) : l.price; };
  const k = (n: number) => '₹' + (n / 1000).toFixed(1) + 'K';
  const toggleBlock = async () => {
    const was = blockedByHost(day);
    try {
      swap(await api.put<Listing>(`/host/listings/${l.id}/blocked-dates`, { day, blocked: !was }));
      toast(was ? 'Date unblocked' : 'Date blocked');
    } catch (e) { toast(errMsg(e)); }
  };
  const dayBooking = day ? booked(day) : undefined;
  return (
    <div className="grid lg:grid-cols-[1fr_380px] min-h-[calc(100vh-5rem)]">
      <section className="px-6 sm:px-10 py-8 overflow-y-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-[28px] font-semibold">Calendar</h1>
          {pub.length > 1 && (<select value={sel} onChange={(e) => { setSel(Number(e.target.value)); setDay(''); }} className="bg-bg border border-line rounded-full px-4 py-2 text-sm font-semibold">{pub.map((p, i) => (<option key={p.id} value={i}>{p.title}</option>))}</select>)}
        </div>
        {months.map((m) => {
          const dim = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
          return (
            <div key={m.toISOString()} className="mb-10">
              <h2 className="text-xl font-semibold mb-3">{MONTHS[m.getMonth()]} {m.getFullYear()}</h2>
              <div className="grid grid-cols-7 text-xs text-muted mb-2">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (<div key={d} className="px-2">{d}</div>))}</div>
              <div className="grid grid-cols-7 border-l border-t border-line2">
                {Array.from({ length: m.getDay() }).map((_, i) => (<div key={'e' + i} className="border-r border-b border-line2 h-24" />))}
                {Array.from({ length: dim }).map((_, i) => {
                  const d = toISO(new Date(m.getFullYear(), m.getMonth(), i + 1));
                  const past = d < toISO(today());
                  const b = booked(d);
                  const hb = blockedByHost(d);
                  return (
                    <button key={d} disabled={past} onClick={() => setDay(d)} className={cn('border-r border-b border-line2 h-24 p-2 text-left flex flex-col justify-between transition-colors', past ? 'opacity-40 cursor-not-allowed' : 'hover:bg-hover', day === d && 'ring-2 ring-fg ring-inset', d === toISO(today()) && 'bg-hover')}>
                      <span className="text-sm font-semibold">{i + 1}</span>
                      {b ? (<span className="text-[11px] font-semibold bg-[#008A05]/20 text-[#3fbf4a] rounded px-1.5 py-0.5 truncate">{b.guestName.split(' ')[0]}</span>) : hb ? (<span className="text-[11px] text-muted line-through">Blocked</span>) : (<span className="text-xs text-muted">{k(dayPrice(d))}</span>)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
      <aside className="border-l border-line2 p-6 bg-bg">
        {day ? (
          <div>
            <button onClick={() => setDay('')} className="text-sm underline mb-4">← Back to settings</button>
            <h2 className="text-xl font-semibold">{fmtLong(day)}</h2>
            <p className="text-muted text-sm mt-1">{dayBooking ? `Reserved by ${dayBooking.guestName}` : blockedByHost(day) ? 'Blocked' : 'Available'}</p>
            <div className="mt-6 border border-line rounded-2xl p-5 bg-surface"><div className="text-sm text-muted">Nightly price</div><div className="text-3xl font-semibold">{inr(dayPrice(day))}</div></div>
            {!dayBooking && (<button onClick={toggleBlock} className="mt-4 w-full btn-outline py-3 text-sm">{blockedByHost(day) ? 'Unblock this date' : 'Block this date'}</button>)}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">{l.title}</h2>
            {[['Pricing', `${inr(l.price)} – ${inr(Math.round(l.price * (1 + (l.weekend ?? 4) / 100)))} per night`, () => { setPrice(String(l.price)); setPriceModal(true); }], ['Discounts', `${l.weeklyDiscount || 0}% weekly discount · ${l.monthlyDiscount || 0}% monthly discount`, () => setDiscModal(true)], ['Availability', '1–365 night stays · Same-day advance notice', () => toast('Select a date to block it')], ['Cancellations', l.freeCancel ? 'Flexible for short-term stays' : 'Non-refundable', () => patch({ freeCancel: !l.freeCancel }, l.freeCancel ? 'Cancellation set to non-refundable' : 'Free cancellation enabled')]].map(([t, d, fn]) => (
              <button key={t as string} onClick={fn as () => void} className="w-full text-left border border-line rounded-2xl p-5 bg-surface hover:shadow-pill transition-shadow"><h3 className="font-semibold">{t as string}</h3><p className="text-sm text-muted mt-1">{d as string}</p></button>
            ))}
          </div>
        )}
      </aside>
      <Modal open={priceModal} onClose={() => setPriceModal(false)} title="Base price" footer={<><span /><button onClick={async () => { const n = Number(price); if (!n || n < 300) return toast('Enter a price of at least ₹300'); if (await patch({ price: n }, 'Price updated')) setPriceModal(false); }} className="btn-dark px-6 py-3 text-sm">Save</button></>}>
        <input className="field text-2xl" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} aria-label="Base price" />
      </Modal>
      <Modal open={discModal} onClose={() => setDiscModal(false)} title="Discounts" footer={<><span /><button onClick={() => setDiscModal(false)} className="btn-dark px-6 py-3 text-sm">Done</button></>}>
        {([['new', 'New listing promotion', '20% off your first 3 bookings'], ['last', 'Last-minute discount', '3% off stays that start within 14 days'], ['weekly', 'Weekly discount', '10% off stays of 7 nights or more'], ['monthly', 'Monthly discount', '15% off stays of 28 nights or more']] as const).map(([k, t, d]) => {
          const on = (l.discounts || []).includes(k);
          return (
            <label key={k} className="flex items-center justify-between py-3 cursor-pointer">
              <span><span className="block font-medium">{t}</span><span className="block text-sm text-muted">{d}</span></span>
              <input type="checkbox" className="w-6 h-6 accent-brand" checked={on} onChange={() => patch({ discounts: on ? (l.discounts || []).filter((x) => x !== k) : [...(l.discounts || []), k] }, 'Discounts updated')} />
            </label>
          );
        })}
      </Modal>
    </div>
  );
}
