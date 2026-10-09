'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui';
import { useFetch } from '@/components/hooks';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { Booking, Listing } from '@/lib/types';
import { cn, fmtLong, guestLabel, inr, toISO, today } from '@/lib/utils';

export default function Today() {
  const { startDraft, draft, toast, user } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<'today' | 'upcoming'>('today');
  const { data: listings } = useFetch((s) => api.get<Listing[]>('/host/listings', undefined, s), [user?.id], !!user);
  const { data, setData, loading, error } = useFetch((s) => api.get<Booking[]>('/host/bookings', { scope: tab }, s), [tab, user?.id], !!user);
  const list = data ?? [];
  const published = (listings?.length ?? 0) > 0;
  const complete = async () => {
    if (!draft) await startDraft();
    router.push(`/host/setup/${draft?.step || 1}`);
  };
  const respond = async (id: string, status: 'confirmed' | 'declined') => {
    try {
      const b = await api.patch<Booking>(`/host/bookings/${id}`, { status });
      setData((x) => (x ? (status === 'declined' ? x.filter((o) => o.id !== id) : x.map((o) => (o.id === id ? b : o))) : x));
      toast(status === 'confirmed' ? 'Reservation approved' : 'Reservation declined');
    } catch (e) { toast(errMsg(e)); }
  };
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10">
      <div className="flex justify-center mb-10">
        <div className="inline-flex bg-surface2 border border-line2 rounded-full p-1">
          {(['today', 'upcoming'] as const).map((t) => (<button key={t} onClick={() => setTab(t)} className={cn('px-6 py-2 rounded-full text-sm font-semibold capitalize transition-colors', tab === t ? 'bg-fg text-bg' : 'text-muted hover:text-fg')}>{t === 'today' ? 'Today' : 'Upcoming'}</button>))}
        </div>
      </div>
      {loading ? (<p className="text-center text-muted py-16">Loading reservations…</p>) : error ? (<p className="text-center text-[#C13515] py-16">{error}</p>) : list.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-8xl mb-6">📖</div>
          <h1 className="text-[34px] leading-tight font-semibold tracking-tight">You don’t have<br />any reservations</h1>
          <p className="text-muted mt-3">{published ? (tab === 'today' ? 'Nobody is checking in or out today.' : 'New reservations will show up here.') : 'To get booked, you’ll need to complete and publish your listing.'}</p>
          {!published && <button onClick={complete} className="inline-block mt-8 btn-dark px-8 py-3.5 text-base">Complete your listing</button>}
        </div>
      ) : (
        <div className="space-y-4">
          <h1 className="text-[26px] font-semibold mb-4">{list.length} reservation{list.length > 1 ? 's' : ''}</h1>
          {list.map((b) => {
            return (
              <div key={b.id} className="border border-line rounded-2xl p-5 bg-surface flex flex-col sm:flex-row gap-4 sm:items-center">
                <Avatar name={b.guestName} color="#6366F1" size={48} />
                <div className="flex-1"><div className="font-semibold">{b.guestName} <span className={cn('ml-2 text-xs rounded-full border px-2 py-0.5', b.status === 'confirmed' ? 'border-[#008A05] text-[#008A05]' : 'border-[#FFB400] text-[#FFB400]')}>{b.status === 'pending' ? 'Needs approval' : 'Confirmed'}</span></div><div className="text-sm text-muted">{b.listing.title} · {fmtLong(b.checkIn)} → {fmtLong(b.checkOut)} · {guestLabel(b)}</div><div className="text-sm font-semibold mt-1">Payout {inr((b.subtotal - b.discountAmount) * 0.97)}</div></div>
                {b.status === 'pending' && (<div className="flex gap-2"><button onClick={() => { respond(b.id, 'confirmed'); }} className="btn-dark px-4 py-2 text-sm">Approve</button><button onClick={() => { respond(b.id, 'declined'); }} className="btn-outline px-4 py-2 text-sm">Decline</button></div>)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
