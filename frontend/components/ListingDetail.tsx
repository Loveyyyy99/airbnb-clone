'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar } from './Calendar';
import { HeartButton, ListingCard, Row } from './Cards';
import { Footer } from './Footer';
import { Header } from './Header';
import { Check, ChevD, Heart, Share, Star } from './Icons';
import { Avatar, Img, Modal, Stepper, useOutside } from './ui';
import { amenityIcon, amenityLabel, AMENITIES, ASSETS } from '@/lib/data';
import { api, errMsg } from '@/lib/api';
import { useFetch } from './hooks';
import { useApp } from '@/lib/store';
import type { Listing, Quote, Review } from '@/lib/types';
import { addDays, cn, fmtLong, fmtShort, fromISO, guestLabel, inr, nightsBetween, toISO } from '@/lib/utils';

const KEYWORDS: Record<string, string[]> = { View: ['view', 'scenic', 'mountain'], Hospitality: ['host', 'friendly', 'hospitality', 'helpful'], Location: ['location', 'close', 'near'], Value: ['value', 'money'], Parking: ['parking'], Comfort: ['comfort', 'cosy', 'cozy', 'bed'], Condition: ['clean', 'maintained'], 'Indoor spaces': ['kitchen', 'living', 'indoor'] };

export function ListingDetail({ id }: { id: string }) {
  const { search, toast, wishlist, toggleWish } = useApp();
  const router = useRouter();
  const { data: l, loading, error: loadErr } = useFetch((signal) => api.get<Listing>(`/listings/${id}`, undefined, signal), [id]);
  const { data: nearby } = useFetch((signal) => api.get<Listing[]>(`/listings/${id}/nearby`, { limit: 7 }, signal), [id]);
  const [checkIn, setIn] = useState(search.checkIn);
  const [checkOut, setOut] = useState(search.checkOut);
  const [guests, setGuests] = useState({ adults: Math.max(1, search.guests.adults), children: search.guests.children, infants: search.guests.infants, pets: search.guests.pets });
  const [gallery, setGallery] = useState<number | null>(null);
  const [showAm, setShowAm] = useState(false);
  const [showRev, setShowRev] = useState(false);
  const [more, setMore] = useState(false);
  const [datePop, setDatePop] = useState(false);
  const [guestPop, setGuestPop] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [chip, setChip] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [revTotal, setRevTotal] = useState(0);
  const [allRev, setAllRev] = useState<Review[]>([]);
  const [allPage, setAllPage] = useState(0);
  const [allMore, setAllMore] = useState(true);
  const [revBusy, setRevBusy] = useState(false);
  const widget = useRef<HTMLDivElement>(null);
  useOutside(widget, () => { setDatePop(false); setGuestPop(false); }, datePop || guestPop);
  useEffect(() => {
    const h = () => setSticky(window.scrollY > 620);
    h();
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const lid = l?.id;
  // Server-authoritative price quote (also tells us if the dates are still free)
  useEffect(() => {
    setQuote(null); setQuoteErr('');
    if (!lid || !checkIn || !checkOut) return;
    const ac = new AbortController();
    const t = setTimeout(() => {
      api.get<Quote>(`/listings/${lid}/quote`, { checkIn, checkOut, adults: guests.adults, children: guests.children, infants: guests.infants, pets: guests.pets }, ac.signal)
        .then(setQuote).catch((e) => { if (e?.name !== 'AbortError') setQuoteErr(errMsg(e)); });
    }, 200);
    return () => { clearTimeout(t); ac.abort(); };
  }, [lid, checkIn, checkOut, guests.adults, guests.children, guests.infants, guests.pets]);

  // first page of reviews (filtered by the "guests mention" chip)
  useEffect(() => {
    if (!lid) return;
    const ac = new AbortController();
    api.get<{ items: Review[]; total: number }>(`/listings/${lid}/reviews`, { pageSize: 6, topic: chip }, ac.signal)
      .then((r) => { setReviews(r.items); setRevTotal(r.total); }).catch(() => {});
    return () => ac.abort();
  }, [lid, chip]);

  const loadAllReviews = async (reset = false) => {
    if (!lid || revBusy) return;
    setRevBusy(true);
    try {
      const page = reset ? 1 : allPage + 1;
      const r = await api.get<{ items: Review[]; hasMore: boolean }>(`/listings/${lid}/reviews`, { page, pageSize: 20 });
      setAllRev((x) => (reset ? r.items : [...x, ...r.items]));
      setAllPage(page); setAllMore(r.hasMore);
    } catch (e) { toast(errMsg(e)); }
    setRevBusy(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header active="none" compact />
        <div className="flex-1 max-w-[1120px] w-full mx-auto px-6 pt-8 animate-pulse">
          <div className="h-8 w-2/3 rounded bg-surface2" />
          <div className="mt-5 h-[260px] sm:h-[400px] rounded-2xl bg-surface2" />
          <div className="mt-8 h-6 w-1/3 rounded bg-surface2" />
        </div>
        <Footer />
      </div>
    );
  }
  if (!l) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header active="none" compact />
        <div className="flex-1 container-page py-28 text-center">
          <h1 className="text-3xl font-semibold">This listing isn’t available</h1>
          <p className="text-muted mt-2">{loadErr || 'It may have been removed by the host.'}</p>
          <Link href="/search" className="inline-block mt-8 btn-dark px-6 py-3 text-sm">Explore stays</Link>
        </div>
        <Footer />
      </div>
    );
  }
  const blocked: [string, string][] = (l.unavailable || []) as [string, string][];
  const host = l.host!;
  const nights = checkIn && checkOut ? Math.max(0, nightsBetween(checkIn, checkOut)) : 0;
  const filtered = reviews;
  const wished = wishlist.includes(l.id);
  const totalGuests = guests.adults + guests.children;
  const rating = l.rating || 0;
  const hist = l.ratingHistogram && l.ratingHistogram.length === 5 ? l.ratingHistogram : [0, 0, 0, 0, 0];
  const histMax = Math.max(1, ...hist);

  const reserve = () => {
    if (!checkIn || !checkOut) { setDatePop(true); toast('Select your check-in and checkout dates'); return; }
    if (totalGuests > l.maxGuests) return toast(`This place allows up to ${l.maxGuests} guests`);
    if (quote && !quote.available) return toast(quote.reason || 'Those dates are not available');
    const q = new URLSearchParams({ in: checkIn, out: checkOut, adults: String(guests.adults), children: String(guests.children), infants: String(guests.infants), pets: String(guests.pets) });
    router.push(`/book/${l.id}?${q.toString()}`);
  };
  const scrollTo = (s: string) => document.getElementById(s)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const lastFree = checkIn ? fmtLong(toISO(addDays(fromISO(checkIn), -1))) : '';
  const sec = 'py-8 border-b border-line2 scroll-mt-32';
  const img = l.images;
  const kindLabel = l.place === 'room' ? 'Room in a rental unit' : `Entire ${l.kind === 'Home' ? 'home' : l.kind.toLowerCase()}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Header active="none" compact />
      {sticky && (
        <div className="sticky top-20 z-40 bg-bg border-b border-line2">
          <div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between">
            <nav className="flex gap-6 text-sm font-semibold">
              {[['Photos', 'photos'], ['Amenities', 'amenities'], ['Reviews', 'reviews'], ['Location', 'location']].map(([a, b]) => (
                <button key={b} onClick={() => scrollTo(b)} className="py-5 border-b-2 border-transparent hover:border-fg">{a}</button>
              ))}
            </nav>
            <div className="flex items-center gap-4">
              <div className="text-sm hidden sm:block">
                <div className="font-semibold">{nights && quote?.available ? inr(quote.total) : `${inr(l.price)}`} <span className="font-normal text-muted">{nights && quote?.available ? `for ${nights} nights` : 'night'}</span></div>
                {rating > 0 && <div className="text-xs flex items-center gap-1"><Star className="h-3 w-3" /> {rating} · <span className="underline text-muted">{l.reviewCount} reviews</span></div>}
              </div>
              <button onClick={() => (nights ? reserve() : scrollTo('booking'))} className="btn-brand px-8 py-3 text-sm">Reserve</button>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1">
        <div className="max-w-[1120px] mx-auto px-6 pt-6 pb-16" id="photos">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-[26px] font-semibold tracking-tight">{l.title}</h1>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); toast('Link copied to clipboard'); }} className="flex items-center gap-2 text-sm font-semibold underline px-3 py-2 rounded-lg hover:bg-hover"><Share /> Share</button>
              <button onClick={() => toggleWish(l.id)} className="flex items-center gap-2 text-sm font-semibold underline px-3 py-2 rounded-lg hover:bg-hover">
                <Heart className="h-5 w-5" filled={wished} /> {wished ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[260px] sm:h-[400px] relative">
            {img.slice(0, 5).map((src, i) => (
              <button key={i} onClick={() => setGallery(i)} className={cn('relative bg-surface overflow-hidden group', i === 0 ? 'col-span-4 sm:col-span-2 row-span-2' : 'hidden sm:block')}>
                <Img src={src} alt={`${l.title} photo ${i + 1}`} className="w-full h-full object-cover group-hover:brightness-90 transition" />
              </button>
            ))}
            <button onClick={() => setGallery(0)} className="absolute bottom-4 right-4 bg-surface border border-fg/70 text-sm font-semibold rounded-lg px-4 py-2 hover:bg-hover shadow">Show all photos</button>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-x-20 mt-8">
            <div>
              <div className={sec + ' pt-0'}>
                <h2 className="text-[22px] font-semibold">{kindLabel === 'Room in a rental unit' ? 'Room' : l.kind} in {l.area}, {l.state === l.city ? 'India' : `${l.city}`}</h2>
                <p className="text-muted mt-1">{l.maxGuests} guests · {l.bedrooms} bedroom{l.bedrooms > 1 ? 's' : ''} · {l.beds} bed{l.beds > 1 ? 's' : ''} · {l.baths} bath{l.baths > 1 ? 's' : ''}</p>
                {rating > 0 && l.guestFavourite && (
                  <div className="mt-6 border border-line rounded-2xl p-4 flex items-center gap-4">
                    <div className="text-center font-semibold leading-tight text-sm px-2">🌿 Guest<br />favourite</div>
                    <p className="flex-1 text-sm font-semibold">One of the most loved homes on Airbnb, according to guests</p>
                    <div className="text-center px-3 border-l border-line2"><div className="text-xl font-bold">{rating}</div><div className="flex text-fg"><Star /><Star /><Star /><Star /><Star /></div></div>
                    <div className="text-center px-3 border-l border-line2"><div className="text-xl font-bold">{l.reviewCount}</div><div className="text-xs text-muted">Reviews</div></div>
                  </div>
                )}
              </div>
              <div className={sec}>
                <div className="flex items-center gap-4">
                  <Avatar name={host.name} src={host.avatar} color={host.color} size={48} />
                  <div><div className="font-semibold">Stay with {host.name}</div><div className="text-sm text-muted">{host.superhost ? 'Superhost · ' : ''}{host.years} hosting</div></div>
                </div>
              </div>
              <div className={sec + ' space-y-6'}>
                {[[l.selfCheckIn ? '🔑' : '🛎️', l.selfCheckIn ? 'Self check-in' : 'Great check-in experience', l.selfCheckIn ? 'You can check in with the building staff.' : '100% of recent guests gave the check-in process a 5-star rating.'], ['🏞️', 'Beautiful area', 'Guests love this home’s scenic location.'], ['🏠', kindLabel, l.place === 'room' ? 'Your own room in a home, plus access to shared spaces.' : 'You’ll have the whole place to yourself.'], ...(l.freeCancel ? [['📅', 'Free cancellation', 'Cancel before check-in for a full refund.']] : [])].map(([i, t, d]) => (
                  <div key={t} className="flex gap-5"><span className="text-2xl w-7">{i}</span><div><div className="font-semibold">{t}</div><div className="text-sm text-muted">{d}</div></div></div>
                ))}
              </div>
              <div className={sec}>
                <p className={cn('whitespace-pre-line leading-relaxed', !more && 'line-clamp-6')}>{l.description}</p>
                <button onClick={() => setMore(!more)} className="font-semibold underline mt-3 flex items-center gap-1">{more ? 'Show less' : 'Show more'} <ChevD className={cn('h-4 w-4', more && 'rotate-180')} /></button>
              </div>
              <div className={sec} id="amenities">
                <h2 className="text-[22px] font-semibold mb-6">What this place offers</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                  {l.amenities.slice(0, 10).map((a) => (<div key={a} className="flex items-center gap-4 text-[15px]"><span className="text-xl w-7">{amenityIcon(a)}</span>{amenityLabel(a)}</div>))}
                </div>
                <button onClick={() => setShowAm(true)} className="mt-8 border border-fg rounded-lg px-6 py-3 font-semibold hover:bg-hover">Show all {l.amenities.length} amenities</button>
              </div>
              <div className={sec} id="calendar">
                <h2 className="text-[22px] font-semibold">{nights ? `${nights} night${nights > 1 ? 's' : ''} in ${l.area}` : 'Select check-in date'}</h2>
                <p className="text-sm text-muted mt-1 mb-6">{nights ? `${fmtLong(checkIn)} - ${fmtLong(checkOut)}` : 'Add your travel dates for exact pricing'}</p>
                <Calendar start={checkIn} end={checkOut} blocked={blocked} onChange={(a, b) => { setIn(a); setOut(b); }} />
                <div className="text-right mt-2"><button onClick={() => { setIn(''); setOut(''); }} className="font-semibold underline text-sm">Clear dates</button></div>
              </div>
            </div>

            <aside id="booking" className="relative">
              <div ref={widget} className="sticky top-28 border border-line rounded-2xl shadow-card p-6 bg-surface mt-0">
                <div className="mb-4 text-xs font-semibold inline-flex items-center gap-1.5 bg-surface2 border border-line2 rounded-full px-3 py-1">🏷️ Prices include all fees</div>
                <div className="flex items-end justify-between mb-4">
                  <div>{nights && quote?.available ? (<><span className="text-[22px] font-semibold">{inr(quote.total)}</span> <span className="text-muted">for {nights} night{nights > 1 ? 's' : ''}</span></>) : (<><span className="text-[22px] font-semibold">{inr(l.price)}</span> <span className="text-muted">night</span></>)}</div>
                  {rating > 0 && <div className="text-sm flex items-center gap-1 font-semibold"><Star className="h-3.5 w-3.5" />{rating} <span className="text-muted font-normal">· <button onClick={() => scrollTo('reviews')} className="underline">{l.reviewCount} reviews</button></span></div>}
                </div>
                <div className="relative border border-line rounded-xl">
                  <div className="grid grid-cols-2 divide-x divide-line">
                    <button onClick={() => { setDatePop(!datePop); setGuestPop(false); }} className="text-left px-3 py-2.5 hover:bg-hover rounded-tl-xl"><div className="text-[10px] font-bold uppercase">Check-in</div><div className={cn('text-sm', !checkIn && 'text-muted')}>{checkIn ? fmtShort(checkIn) + ' ' + fromISO(checkIn).getFullYear() : 'Add date'}</div></button>
                    <button onClick={() => { setDatePop(!datePop); setGuestPop(false); }} className="text-left px-3 py-2.5 hover:bg-hover rounded-tr-xl"><div className="text-[10px] font-bold uppercase">Checkout</div><div className={cn('text-sm', !checkOut && 'text-muted')}>{checkOut ? fmtShort(checkOut) + ' ' + fromISO(checkOut).getFullYear() : 'Add date'}</div></button>
                  </div>
                  <button onClick={() => { setGuestPop(!guestPop); setDatePop(false); }} className="w-full text-left px-3 py-2.5 border-t border-line hover:bg-hover rounded-b-xl flex items-center justify-between">
                    <div><div className="text-[10px] font-bold uppercase">Guests</div><div className="text-sm">{guestLabel(guests)}</div></div><ChevD className={cn('h-4 w-4', guestPop && 'rotate-180')} />
                  </button>
                  {datePop && (
                    <div className="animate-pop absolute right-0 top-full mt-2 z-30 bg-surface border border-line2 rounded-2xl shadow-pop p-5 w-[340px] max-w-[85vw]">
                      <Calendar start={checkIn} end={checkOut} blocked={blocked} months={1} onChange={(a, b) => { setIn(a); setOut(b); if (a && b) setDatePop(false); }} />
                      <div className="text-right mt-2"><button onClick={() => { setIn(''); setOut(''); }} className="font-semibold underline text-sm">Clear dates</button></div>
                    </div>
                  )}
                  {guestPop && (
                    <div className="animate-pop absolute right-0 top-full mt-2 z-30 bg-surface border border-line2 rounded-2xl shadow-pop px-5 py-2 w-[340px] max-w-[85vw] divide-y divide-line2">
                      <Stepper label="Adults" sub="Age 13+" value={guests.adults} min={1} max={l.maxGuests} onChange={(n) => setGuests({ ...guests, adults: n })} />
                      <Stepper label="Children" sub="Ages 2–12" value={guests.children} max={l.maxGuests} onChange={(n) => setGuests({ ...guests, children: n })} />
                      <Stepper label="Infants" sub="Under 2" value={guests.infants} max={5} onChange={(n) => setGuests({ ...guests, infants: n })} />
                      <Stepper label="Pets" sub={l.amenities.includes('pets') ? 'Pets allowed' : 'Not allowed here'} value={guests.pets} max={l.amenities.includes('pets') ? 3 : 0} onChange={(n) => setGuests({ ...guests, pets: n })} />
                      <p className="text-xs text-muted py-3">This place has a maximum of {l.maxGuests} guests, not including infants.</p>
                      <div className="text-right py-2"><button onClick={() => setGuestPop(false)} className="font-semibold underline text-sm">Close</button></div>
                    </div>
                  )}
                </div>
                {l.freeCancel && checkIn && <div className="mt-3 text-xs bg-surface2 border border-line2 rounded-full px-3 py-1.5 text-center">Free cancellation before <b>{lastFree}</b></div>}
                <button onClick={reserve} className="w-full btn-brand py-3.5 text-base mt-4">{nights ? 'Reserve' : 'Check availability'}</button>
                <p className="text-center text-sm text-muted mt-3">You won’t be charged yet</p>
                {nights > 0 && quoteErr && <p className="mt-4 text-sm text-[#C13515]">{quoteErr}</p>}
                {nights > 0 && quote && !quote.available && <p className="mt-4 text-sm text-[#C13515] text-center">{quote.reason || 'Those dates are not available'}</p>}
                {nights > 0 && quote?.available && (
                  <div className="mt-5 space-y-3 text-[15px]">
                    <div className="flex justify-between"><span className="underline">{inr(quote.nightlyAvg)} x {nights} night{nights > 1 ? 's' : ''}</span><span>{inr(quote.subtotal)}</span></div>
                    {quote.discount && <div className="flex justify-between text-[#008A05]"><span>{quote.discount.label}</span><span>-{inr(quote.discount.amount)}</span></div>}
                    <div className="flex justify-between"><span className="underline">Cleaning fee</span><span>{inr(quote.cleaningFee)}</span></div>
                    <div className="flex justify-between"><span className="underline">Airbnb service fee</span><span>{inr(quote.serviceFee)}</span></div>
                    <div className="flex justify-between font-semibold pt-4 border-t border-line2"><span>Total</span><span>{inr(quote.total)}</span></div>
                  </div>
                )}
              </div>
              <button onClick={() => toast('Thanks — our team will review this listing')} className="mt-6 mx-auto flex items-center gap-2 text-sm text-muted underline">🚩 Report this listing</button>
            </aside>
          </div>

          {rating > 0 && (
            <div className="py-12 border-t border-line2 scroll-mt-32" id="reviews">
              <div className="text-center">
                <div className="text-[80px] leading-none font-bold">{rating}</div>
                <div className="text-xl font-semibold mt-2">Guest favourite</div>
                <p className="text-muted text-sm max-w-xs mx-auto mt-1">This home is a guest favourite based on ratings, reviews and reliability</p>
              </div>
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-6 border border-line2 rounded-2xl overflow-hidden text-center">
                <div className="p-4 border-r border-line2 text-left"><div className="font-semibold text-sm mb-2">Overall rating</div>{[5, 4, 3, 2, 1].map((n) => (<div key={n} className="flex items-center gap-2 text-xs"><span>{n}</span><div className="flex-1 h-1 bg-line rounded"><div className="h-1 bg-fg rounded" style={{ width: `${hist[5 - n] / histMax * 100}%` }} /></div></div>))}</div>
                {(l.ratingBreakdown || []).map((r) => (<div key={r.label} className="p-4 border-r last:border-r-0 border-line2 flex flex-col items-center justify-between"><div className="text-sm font-semibold">{r.label}</div><div className="text-lg font-bold">{r.value}</div><div className="text-2xl">{r.icon}</div></div>))}
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-2">
                <span className="font-semibold mr-2">Guests mention</span>
                {Object.keys(KEYWORDS).map((c) => (<button key={c} onClick={() => setChip(chip === c ? '' : c)} className={cn('px-3 py-1.5 rounded-full border text-sm', chip === c ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg')}>{c}</button>))}
              </div>
              <div className="mt-8 grid md:grid-cols-2 gap-x-20 gap-y-10">
                {filtered.map((r) => <ReviewItem key={r.id} r={r} />)}
                {filtered.length === 0 && revTotal === 0 && <p className="text-muted">No reviews mention “{chip}” yet.</p>}
              </div>
              <button onClick={() => { setShowRev(true); loadAllReviews(true); }} className="mt-10 border border-fg rounded-lg px-6 py-3 font-semibold hover:bg-hover">Show all {l.reviewCount} reviews</button>
            </div>
          )}

          <div className="py-12 border-t border-line2 scroll-mt-32" id="location">
            <h2 className="text-[22px] font-semibold">Where you’ll be</h2>
            <p className="text-sm text-muted mt-1 mb-6">{l.area}, {l.city}, {l.state === l.city ? '' : l.state + ', '}India</p>
            <div className="relative h-[360px] rounded-2xl overflow-hidden border border-line2 bg-surface2" style={{ backgroundImage: 'linear-gradient(rgb(var(--line2)/.8) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--line2)/.8) 1px,transparent 1px)', backgroundSize: '56px 56px' }}>
              <Img src={ASSETS.map} alt={`Map of ${l.area}`} className="absolute inset-0 w-full h-full object-cover opacity-80" />
              <div className="absolute left-4 top-4 bg-surface border border-line rounded-full px-4 py-2 text-sm font-semibold shadow">🚌 Find public transport</div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg border-2 border-white text-xl">🏠</div>
            </div>
            <p className="text-sm text-muted mt-3">Exact location will be provided after booking.</p>
          </div>

          <div className="py-12 border-t border-line2">
            <div className="grid md:grid-cols-[320px_1fr] gap-12">
              <div className="rounded-3xl border border-line2 shadow-pill p-6 flex items-center gap-6 bg-surface">
                <div className="text-center"><Avatar name={host.name} src={host.avatar} color={host.color} size={96} /><div className="text-2xl font-bold mt-3">{host.name}</div>{host.superhost && <div className="text-sm text-muted">Superhost</div>}</div>
                <div className="text-sm space-y-3"><div><div className="text-lg font-bold">{host.reviews}</div><div className="text-xs text-muted">Reviews</div></div><div><div className="text-lg font-bold">{host.rating || '—'}★</div><div className="text-xs text-muted">Rating</div></div><div><div className="text-lg font-bold">{host.years.split(' ')[0]}</div><div className="text-xs text-muted">{host.years.split(' ').slice(1).join(' ') || 'hosting'}</div></div></div>
              </div>
              <div>
                <h2 className="text-[22px] font-semibold">{host.name} is {host.superhost ? 'a Superhost' : 'your host'}</h2>
                <p className="text-muted mt-2 max-w-md">{host.about}</p>
                <div className="mt-6 text-sm"><div className="font-semibold">Host details</div><div className="text-muted">Response rate: 100%</div><div className="text-muted">Responds within an hour</div></div>
                <button onClick={() => toast('Messaging is coming soon')} className="mt-6 btn-dark px-6 py-3 text-sm">Message host</button>
              </div>
            </div>
          </div>

          <div className="py-12 border-t border-line2">
            <h2 className="text-[22px] font-semibold mb-6">Things to know</h2>
            <div className="grid md:grid-cols-3 gap-10 text-sm">
              <div><div className="font-semibold mb-3">House rules</div><ul className="space-y-2 text-muted"><li>Check-in after 2:00 pm</li><li>Checkout before 11:00 am</li><li>{l.maxGuests} guests maximum</li></ul></div>
              <div><div className="font-semibold mb-3">Safety & property</div><ul className="space-y-2 text-muted"><li>{l.amenities.includes('smoke') ? 'Smoke alarm' : 'No smoke alarm'}</li><li>{l.amenities.includes('co') ? 'Carbon monoxide alarm' : 'No carbon monoxide alarm'}</li><li>Some spaces are shared</li></ul></div>
              <div><div className="font-semibold mb-3">Cancellation policy</div><p className="text-muted">{l.freeCancel ? `Free cancellation before check-in. After that, cancel before check-in and get a 50% refund, minus the first night and service fee.` : 'This reservation is non-refundable.'}</p></div>
            </div>
          </div>

          {nearby && nearby.length > 0 && (
            <div className="py-12 border-t border-line2">
              <Row title="More stays nearby" size="w-[44%] sm:w-[30%] md:w-[22%]">{nearby.map((n) => (<ListingCard key={n.id} l={n} />))}</Row>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <Modal open={gallery !== null} onClose={() => setGallery(null)} title="Photo tour" wide>
        <div className="space-y-3">
          {img.map((src, i) => (<Img key={i} src={src} alt={`${l.title} photo ${i + 1}`} className="w-full rounded-xl object-cover max-h-[70vh]" />))}
        </div>
      </Modal>
      <Modal open={showAm} onClose={() => setShowAm(false)} title="What this place offers">
        {(['basics', 'standout', 'safety'] as const).map((g) => {
          const items = l.amenities.filter((a) => AMENITIES.find((x) => x.id === a)?.group === g);
          if (!items.length) return null;
          return (
            <div key={g} className="mb-6"><h3 className="font-semibold text-lg mb-3 capitalize">{g === 'basics' ? 'Basic' : g === 'standout' ? 'Standout' : 'Safety'}</h3>
              {items.map((a) => (<div key={a} className="flex items-center gap-4 py-3.5 border-b border-line2 text-[15px]"><span className="text-xl w-7">{amenityIcon(a)}</span>{amenityLabel(a)}</div>))}
            </div>
          );
        })}
      </Modal>
      <Modal open={showRev} onClose={() => setShowRev(false)} title={`★ ${rating} · ${l.reviewCount} reviews`} wide>
        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">{allRev.map((r) => <ReviewItem key={r.id} r={r} />)}</div>
        {allMore && <div className="text-center mt-8"><button onClick={() => loadAllReviews()} disabled={revBusy} className="border border-fg rounded-lg px-6 py-3 font-semibold hover:bg-hover disabled:opacity-60">{revBusy ? 'Loading…' : 'Show more reviews'}</button></div>}
      </Modal>
    </div>
  );
}

function ReviewItem({ r }: { r: Review }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-3 mb-3"><Avatar name={r.name} src={r.avatar} color="#6366F1" size={44} /><div><div className="font-semibold">{r.name}</div><div className="text-xs text-muted">{r.since}</div></div></div>
      <div className="flex items-center gap-1 text-xs mb-2">{Array.from({ length: r.stars }).map((_, i) => (<Star key={i} className="h-2.5 w-2.5" />))}<span className="text-muted ml-1">· {r.when}</span></div>
      <p className={cn('text-[15px] leading-relaxed', !open && 'line-clamp-3')}>{r.text}</p>
      {r.text.length > 90 && <button onClick={() => setOpen(!open)} className="font-semibold underline text-sm mt-1">{open ? 'Show less' : 'Show more'}</button>}
    </div>
  );
}
