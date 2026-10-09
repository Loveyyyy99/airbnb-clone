'use client';
import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { ArrowL, Star } from '@/components/Icons';
import { Img, Modal, Stepper, useAuthGuard } from '@/components/ui';
import { useFetch } from '@/components/hooks';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { Booking, Listing, Quote } from '@/lib/types';
import { cn, fmtLong, guestLabel, inr, nightsBetween } from '@/lib/utils';

function Inner() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const { ready, user } = useAuthGuard();
  const { toast } = useApp();
  const { data: l, loading } = useFetch((signal) => api.get<Listing>(`/listings/${id}`, undefined, signal), [id]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [checkIn, setIn] = useState(sp.get('in') || '');
  const [checkOut, setOut] = useState(sp.get('out') || '');
  const [g, setG] = useState({ adults: Number(sp.get('adults') || 1), children: Number(sp.get('children') || 0), infants: Number(sp.get('infants') || 0), pets: Number(sp.get('pets') || 0) });
  const [dates, setDates] = useState(false);
  const [guestsM, setGuestsM] = useState(false);
  const [method, setMethod] = useState<'card' | 'upi'>('card');
  const [card, setCard] = useState({ num: '', exp: '', cvv: '', zip: '', upi: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const lid = l?.id;
  useEffect(() => {
    setQuote(null);
    if (!lid || !checkIn || !checkOut) return;
    const ac = new AbortController();
    api.get<Quote>(`/listings/${lid}/quote`, { checkIn, checkOut, ...g }, ac.signal).then(setQuote).catch((e) => {
      if (e?.name !== 'AbortError') setQuote({ available: false, reason: errMsg(e), nights: 0, nightlyAvg: 0, subtotal: 0, cleaningFee: 0, serviceFee: 0, total: 0 });
    });
    return () => ac.abort();
  }, [lid, checkIn, checkOut, g.adults, g.children, g.infants, g.pets]); // eslint-disable-line
  if (!ready || !user) return null;
  if (loading) return <div className="container-page py-28 text-center text-muted">Loading…</div>;
  if (!l) return <div className="container-page py-28 text-center">Listing not found</div>;
  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;
  const blocked = (l.unavailable || []) as [string, string][];

  const pay = () => {
    if (method === 'card') {
      if (card.num.replace(/\s/g, '').length !== 16) return toast('Enter a valid 16-digit card number');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.exp)) return toast('Enter expiry as MM/YY');
      if (card.cvv.length < 3) return toast('Enter a valid CVV');
    } else if (!/^[\w.-]+@[\w]+$/.test(card.upi)) return toast('Enter a valid UPI ID, e.g. name@upi');
    if (quote && !quote.available) return toast(quote.reason || 'Those dates are not available');
    setBusy(true);
    // Mock checkout: the card/UPI details are validated here and never sent to the server.
    setTimeout(async () => {
      try {
        const b = await api.post<Booking>('/bookings', { listingId: l.id, checkIn, checkOut, ...g, message: msg.trim() || undefined, paymentMethod: method });
        router.push(`/trips?confirmed=${b.code}`);
      } catch (e) {
        toast(errMsg(e));
        setBusy(false);
      }
    }, 700);
  };
  const row = 'flex items-center justify-between py-4';
  return (
    <div className="min-h-screen flex flex-col">
      <Header active="none" compact />
      <main className="flex-1 max-w-[1120px] mx-auto w-full px-6 py-10">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => router.back()} aria-label="Back" className="p-2 rounded-full hover:bg-hover"><ArrowL /></button>
          <h1 className="text-[32px] font-semibold tracking-tight">{l.instantBook ? 'Confirm and pay' : 'Request to book'}</h1>
        </div>
        <div className="grid lg:grid-cols-[1fr_440px] gap-24">
          <div>
            <section className="pb-8 border-b border-line2">
              <h2 className="text-[22px] font-semibold mb-2">Your trip</h2>
              <div className={row}><div><div className="font-semibold">Dates</div><div className="text-muted">{nights ? `${fmtLong(checkIn)} – ${fmtLong(checkOut)}` : 'Select dates'}</div></div><button onClick={() => setDates(true)} className="font-semibold underline">Edit</button></div>
              <div className={row}><div><div className="font-semibold">Guests</div><div className="text-muted">{guestLabel(g)}</div></div><button onClick={() => setGuestsM(true)} className="font-semibold underline">Edit</button></div>
            </section>
            <section className="py-8 border-b border-line2">
              <h2 className="text-[22px] font-semibold mb-5">Pay with</h2>
              <div className="flex gap-3 mb-5">
                {(['card', 'upi'] as const).map((m) => (<button key={m} onClick={() => setMethod(m)} className={cn('px-5 py-3 rounded-xl border font-semibold text-sm', method === m ? 'border-fg bg-hover' : 'border-line')}>{m === 'card' ? '💳 Credit or debit card' : '📱 UPI'}</button>))}
              </div>
              {method === 'card' ? (
                <div className="border border-line rounded-xl overflow-hidden divide-y divide-line">
                  <input className="w-full bg-transparent px-4 py-4 outline-none" placeholder="Card number" inputMode="numeric" value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })} />
                  <div className="grid grid-cols-2 divide-x divide-line">
                    <input className="bg-transparent px-4 py-4 outline-none" placeholder="MM/YY" value={card.exp} onChange={(e) => { let v = e.target.value.replace(/[^\d/]/g, '').slice(0, 5); if (v.length === 2 && !v.includes('/') && e.target.value.length > card.exp.length) v += '/'; setCard({ ...card, exp: v }); }} />
                    <input className="bg-transparent px-4 py-4 outline-none" placeholder="CVV" inputMode="numeric" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                  </div>
                  <input className="w-full bg-transparent px-4 py-4 outline-none" placeholder="PIN code" value={card.zip} onChange={(e) => setCard({ ...card, zip: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
                </div>
              ) : (
                <input className="field" placeholder="UPI ID (name@upi)" value={card.upi} onChange={(e) => setCard({ ...card, upi: e.target.value })} />
              )}
              <p className="text-xs text-muted mt-3">Demo checkout — no real payment is processed.</p>
            </section>
            <section className="py-8 border-b border-line2">
              <h2 className="text-[22px] font-semibold mb-3">Message the host</h2>
              <textarea className="field min-h-[100px]" placeholder="Share why you’re travelling and who’s coming along" value={msg} onChange={(e) => setMsg(e.target.value)} />
            </section>
            <section className="py-8 border-b border-line2 text-sm">
              <h2 className="text-[22px] font-semibold mb-3">Ground rules</h2>
              <p className="text-muted">We ask every guest to remember a few simple things about what makes a great guest: follow the house rules, and treat your host’s home like your own.</p>
            </section>
            <p className="text-xs text-muted py-6">By selecting the button below, I agree to the Host’s House Rules, Ground rules for guests, Airbnb’s Rebooking and Refund Policy and that Airbnb can charge my payment method if I’m responsible for damage.</p>
            <button onClick={pay} disabled={busy || !nights || (!!quote && !quote.available)} className="btn-brand px-10 py-4 text-base disabled:opacity-50">{busy ? 'Processing…' : l.instantBook ? 'Confirm and pay' : 'Request to book'}</button>
          </div>
          <aside className="lg:sticky lg:top-28 self-start border border-line rounded-2xl p-6 bg-surface">
            <div className="flex gap-4 pb-6 border-b border-line2">
              <div className="w-28 h-24 rounded-xl overflow-hidden bg-surface2 shrink-0"><Img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /></div>
              <div><div className="text-xs text-muted">{l.kind} in {l.area}</div><div className="font-semibold leading-snug">{l.title}</div>{l.rating > 0 && <div className="text-xs flex items-center gap-1 mt-1"><Star className="h-3 w-3" /> {l.rating} ({l.reviewCount})</div>}</div>
            </div>
            <div className="py-6 border-b border-line2 text-sm font-medium">{l.freeCancel ? 'Free cancellation before check-in.' : 'This booking is non-refundable.'}</div>
            <h3 className="text-[22px] font-semibold py-5">Price details</h3>
            {quote && !quote.available && <p className="text-sm text-[#C13515] mb-3">{quote.reason || 'Those dates are not available'}</p>}
            {quote?.available ? (
              <div className="space-y-3 text-[15px]">
                <div className="flex justify-between"><span>{inr(quote.nightlyAvg)} x {nights} night{nights === 1 ? '' : 's'}</span><span>{inr(quote.subtotal)}</span></div>
                {quote.discount && <div className="flex justify-between text-[#008A05]"><span>{quote.discount.label}</span><span>-{inr(quote.discount.amount)}</span></div>}
                <div className="flex justify-between"><span>Cleaning fee</span><span>{inr(quote.cleaningFee)}</span></div>
                <div className="flex justify-between"><span>Airbnb service fee</span><span>{inr(quote.serviceFee)}</span></div>
                <div className="flex justify-between font-semibold pt-4 border-t border-line2"><span>Total (INR)</span><span>{inr(quote.total)}</span></div>
              </div>
            ) : !quote && nights > 0 ? <p className="text-sm text-muted">Calculating price…</p> : null}
          </aside>
        </div>
      </main>
      <Footer />
      <Modal open={dates} onClose={() => setDates(false)} title="Edit dates" footer={<><button onClick={() => { setIn(''); setOut(''); }} className="underline font-semibold">Clear</button><button onClick={() => (checkIn && checkOut ? setDates(false) : toast('Select both dates'))} className="btn-dark px-6 py-3 text-sm">Save</button></>}>
        <Calendar start={checkIn} end={checkOut} blocked={blocked} onChange={(a, b) => { setIn(a); setOut(b); }} />
      </Modal>
      <Modal open={guestsM} onClose={() => setGuestsM(false)} title="Edit guests" footer={<><span /><button onClick={() => setGuestsM(false)} className="btn-dark px-6 py-3 text-sm">Save</button></>}>
        <div className="divide-y divide-line2">
          <Stepper label="Adults" value={g.adults} min={1} max={l.maxGuests} onChange={(n) => setG({ ...g, adults: n })} />
          <Stepper label="Children" value={g.children} max={l.maxGuests} onChange={(n) => setG({ ...g, children: n })} />
          <Stepper label="Infants" value={g.infants} max={5} onChange={(n) => setG({ ...g, infants: n })} />
          <Stepper label="Pets" value={g.pets} max={l.amenities.includes('pets') ? 3 : 0} onChange={(n) => setG({ ...g, pets: n })} />
        </div>
      </Modal>
    </div>
  );
}
export default function Page() { return (<Suspense><Inner /></Suspense>); }
