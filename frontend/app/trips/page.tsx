'use client';
import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useFetch } from '@/components/hooks';
import { Star } from '@/components/Icons';
import { Modal, Img, useAuthGuard } from '@/components/ui';
import { Shell } from '@/components/Shell';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { ActivityBooking, Booking } from '@/lib/types';
import { cn, fmtLong, guestLabel, inr, toISO, today } from '@/lib/utils';

function Inner() {
  const { ready, user } = useAuthGuard();
  const { toast } = useApp();
  const confirmed = useSearchParams().get('confirmed');
  const { data: bookings, setData, loading, error } = useFetch((s) => api.get<Booking[]>('/bookings/mine', undefined, s), [user?.id], !!user);
  const { data: acts } = useFetch((s) => api.get<ActivityBooking[]>('/activity-bookings/mine', undefined, s), [user?.id], !!user);
  const [cancel, setCancel] = useState<string | null>(null);
  const [review, setReview] = useState<Booking | null>(null);
  const [stars, setStars] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  if (!ready || !user) return null;
  const now = toISO(today());
  const dead = (s: string) => s === 'cancelled' || s === 'declined';
  const list = (bookings ?? []).filter((b) => (tab === 'cancelled' ? dead(b.status) : tab === 'upcoming' ? !dead(b.status) && b.checkOut >= now : !dead(b.status) && b.checkOut < now));
  const replace = (b: Booking) => setData((x) => (x ? x.map((o) => (o.id === b.id ? b : o)) : x));

  const doCancel = async () => {
    setBusy(true);
    try {
      replace(await api.post<Booking>(`/bookings/${cancel}/cancel`));
      toast('Reservation cancelled — dates are available again');
      setCancel(null);
    } catch (e) { toast(errMsg(e)); }
    setBusy(false);
  };
  const sendReview = async () => {
    if (!review) return;
    if (text.trim().length < 3) return toast('Write a few words about your stay');
    setBusy(true);
    try {
      await api.post(`/bookings/${review.id}/review`, { stars, text: text.trim() });
      replace({ ...review, canReview: false, reviewed: true });
      toast('Thanks for your review!');
      setReview(null); setText(''); setStars(5);
    } catch (e) { toast(errMsg(e)); }
    setBusy(false);
  };
  const statusLabel = (s: string) => (s === 'pending' ? 'Awaiting host approval' : s === 'declined' ? 'Declined by host' : s);

  return (
    <Shell active="none" compact>
      <div className="max-w-[1000px] mx-auto px-6 py-10">
        {confirmed && (
          <div className="mb-8 rounded-2xl border border-[#008A05]/50 bg-[#008A05]/10 p-5"><div className="font-semibold text-lg">🎉 Your reservation is in!</div><div className="text-sm text-muted mt-1">Confirmation code <b className="text-fg">{confirmed}</b>. The dates are now blocked on the listing.</div></div>
        )}
        <h1 className="text-[32px] font-semibold tracking-tight mb-6">Trips</h1>
        <div className="flex gap-2 mb-8">{(['upcoming', 'past', 'cancelled'] as const).map((t) => (<button key={t} onClick={() => setTab(t)} className={cn('px-5 py-2 rounded-full border text-sm font-medium capitalize', tab === t ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg')}>{t}</button>))}</div>
        {error && <p className="text-[#C13515] mb-4">{error}</p>}
        {loading ? (
          <p className="text-muted py-10">Loading your trips…</p>
        ) : list.length === 0 ? (
          <div className="border-t border-line2 py-16 text-center"><div className="text-5xl mb-4">🧳</div><h2 className="text-xl font-semibold">No {tab} trips</h2><p className="text-muted mt-1">Time to dust off your bags and start planning your next adventure.</p><Link href="/search" className="inline-block mt-6 btn-dark px-6 py-3 text-sm">Start searching</Link></div>
        ) : (
          <div className="space-y-5">
            {list.map((b) => {
              const l = b.listing;
              return (
                <div key={b.id} className="border border-line rounded-2xl overflow-hidden flex flex-col sm:flex-row bg-surface">
                  <Link href={`/rooms/${l.id}`} className="sm:w-60 h-48 sm:h-auto bg-surface2 shrink-0"><Img src={l.image} alt={l.title} className="w-full h-full object-cover" /></Link>
                  <div className="p-5 flex-1">
                    <div className="flex items-start justify-between gap-3"><div><div className="text-xs text-muted">{l.kind} in {l.area}, {l.city}</div><Link href={`/rooms/${l.id}`} className="font-semibold text-lg hover:underline">{l.title}</Link></div><span className={cn('text-xs font-semibold rounded-full px-3 py-1 border whitespace-nowrap', b.status === 'confirmed' ? 'border-[#008A05] text-[#008A05]' : b.status === 'pending' ? 'border-[#FFB400] text-[#FFB400]' : 'border-line text-muted')}>{statusLabel(b.status)}</span></div>
                    <div className="text-sm mt-3 space-y-1"><div>{fmtLong(b.checkIn)} → {fmtLong(b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''}</div><div className="text-muted">{guestLabel(b)} · Code {b.code}</div><div className="font-semibold">Total {inr(b.total)}</div></div>
                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                      <Link href={`/rooms/${l.id}`} className="btn-outline px-4 py-2 text-sm">View listing</Link>
                      {!dead(b.status) && b.checkOut >= now && <button onClick={() => setCancel(b.id)} className="px-4 py-2 text-sm font-semibold underline">Cancel</button>}
                      {b.canReview && <button onClick={() => setReview(b)} className="btn-dark px-4 py-2 text-sm">Leave a review</button>}
                      {b.reviewed && <span className="text-sm text-muted flex items-center gap-1"><Star className="h-3 w-3" /> Reviewed</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {(acts?.length ?? 0) > 0 && tab === 'upcoming' && (
          <div className="mt-12"><h2 className="text-[22px] font-semibold mb-4">Experiences & services</h2>
            <div className="space-y-3">{acts!.map((a) => { const x = a.activity; return (<Link key={a.id} href={`/${x.kind === 'experience' ? 'experiences' : 'services'}/${x.id}`} className="flex gap-4 border border-line rounded-2xl p-4 bg-surface hover:bg-hover"><div className="w-20 h-20 rounded-xl overflow-hidden bg-surface2"><Img src={x.image} alt={x.title} className="w-full h-full object-cover" /></div><div><div className="font-semibold">{x.title}</div><div className="text-sm text-muted">{fmtLong(a.day)} · {a.guests} guest{a.guests > 1 ? 's' : ''} · {inr(a.total)} · {a.code}</div></div></Link>); })}</div>
          </div>
        )}
      </div>
      <Modal open={!!cancel} onClose={() => setCancel(null)} title="Cancel reservation" footer={<><button onClick={() => setCancel(null)} className="underline font-semibold">Keep it</button><button disabled={busy} onClick={doCancel} className="btn-dark px-6 py-3 text-sm disabled:opacity-60">Cancel reservation</button></>}>
        <p>Are you sure? The dates will be released for other guests.</p>
      </Modal>
      <Modal open={!!review} onClose={() => setReview(null)} title="Leave a review" footer={<><button onClick={() => setReview(null)} className="underline font-semibold">Not now</button><button disabled={busy} onClick={sendReview} className="btn-dark px-6 py-3 text-sm disabled:opacity-60">Submit review</button></>}>
        <p className="font-semibold mb-1">{review?.listing.title}</p>
        <p className="text-sm text-muted mb-4">How was your stay?</p>
        <div className="flex gap-1 mb-4">{[1, 2, 3, 4, 5].map((n) => (<button key={n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setStars(n)} className={cn('text-3xl leading-none', n <= stars ? 'text-fg' : 'text-line')}>★</button>))}</div>
        <textarea className="field min-h-[120px]" placeholder="Share what you loved about this place" value={text} maxLength={1500} onChange={(e) => setText(e.target.value)} />
      </Modal>
    </Shell>
  );
}
export default function Page() { return (<Suspense><Inner /></Suspense>); }
