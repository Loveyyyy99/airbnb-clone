'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AMENITIES, ASSETS, PLACE_TYPES } from '@/lib/data';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { Draft } from '@/lib/types';
import { cn, inr } from '@/lib/utils';
import { Check, Close, Minus, Plus } from './Icons';
import { Logo, Modal, Stepper, Switch, ThemeToggle } from './ui';

export const TOTAL = 19;
const PHASES: [number, number][] = [[1, 6], [7, 12], [13, 19]];

const SAMPLE = ASSETS.meleto;
const ADDRESSES = [
  ['Maharaja Agarsen Marg, New Delhi, Delhi 110019, India', 'New Delhi', 'Delhi', 'Maharaja Agarsen Marg', '110019'],
  ['Leela Bhawan, Patiala, Punjab 147001, India', 'Patiala', 'Punjab', 'Leela Bhawan', '147001'],
  ['Sector 17, Chandigarh 160017, India', 'Chandigarh', 'Chandigarh', 'Sector 17', '160017'],
  ['Mall Road, Manali, Himachal Pradesh 175131, India', 'Manali', 'Himachal Pradesh', 'Mall Road', '175131'],
  ['Calangute Beach Road, North Goa, Goa 403516, India', 'North Goa', 'Goa', 'Calangute', '403516'],
  ['Bandra West, Mumbai, Maharashtra 400050, India', 'Mumbai', 'Maharashtra', 'Bandra West', '400050'],
];

const PLACE_ICON: Record<string, string> = { House: '🏠', 'Flat/apartment': '🏢', Barn: '🌾', 'Bed & breakfast': '🥐', Boat: '⛵', Cabin: '🛖', 'Campervan/motorhome': '🚐', 'Casa particular': '🏡', Castle: '🏰', Cave: '🕳️', Container: '📦', 'Cycladic home': '🏛️', Dammuso: '🪨', Dome: '🛖', 'Earth home': '🌍' };

function canNext(step: number, d: Draft) {
  if (step === 9) return d.photos.length >= 5;
  if (step === 10) return d.title.trim().length > 0;
  if (step === 12) return d.description.trim().length > 0;
  if (step === 11) return true;
  return true;
}

export function Wizard() {
  const { step: s } = useParams<{ step: string }>();
  const step = Math.min(TOTAL, Math.max(1, Number(s) || 1));
  const router = useRouter();
  const app = useApp();
  const { draft, patchDraft, startDraft, publishDraft, flushDraft, toast, user, ready } = app;
  const [help, setHelp] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace('/login?next=/hosting'); return; }
    if (!draft) startDraft().catch((e) => toast(errMsg(e)));
  }, [ready, user]); // eslint-disable-line
  useEffect(() => { if (draft && draft.step !== step) patchDraft({ step }); }, [step]); // eslint-disable-line
  if (!draft) return <div className="min-h-screen" />;
  const d = draft;
  const up = (p: Partial<Draft>) => patchDraft(p);
  const go = (n: number) => router.push(`/host/setup/${n}`);
  const next = () => {
    if (!canNext(step, d)) return toast(step === 9 ? 'Add at least 5 photos to continue' : step === 10 ? 'Give your place a title' : 'Please complete this step');
    if (step === 18) {
      const miss = !d.street.trim() ? 'Street address' : !d.city.trim() ? 'City/town' : !d.state.trim() ? 'State/union territory' : '';
      if (miss) return toast(`${miss} is required`);
    }
    if (step === TOTAL) {
      if (d.business === null) return toast('Tell us if you’re hosting as a business');
      if (!/^\d{6}$/.test(d.pin)) return toast('Enter a valid 6-digit PIN code');
      setBusy(true);
      publishDraft()
        .then((l) => { if (l) { toast('Your listing is published 🎉'); router.push('/host/listings'); } })
        .catch((e) => toast(errMsg(e)))
        .finally(() => setBusy(false));
      return;
    }
    go(step + 1);
  };
  const phase = (i: number) => {
    const [a, b] = PHASES[i];
    if (step > b) return 100;
    if (step < a) return 0;
    return Math.round(((step - a + 1) / (b - a + 1)) * 100);
  };
  const last = step === TOTAL;
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="h-20 px-6 sm:px-10 flex items-center justify-between shrink-0">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setHelp(true)} className="px-5 py-2.5 rounded-full border border-line text-sm font-semibold hover:border-fg hover:bg-hover">Questions?</button>
          <button onClick={async () => { await flushDraft(); toast('Progress saved'); router.push('/host/listings'); }} className="px-5 py-2.5 rounded-full border border-line text-sm font-semibold hover:border-fg hover:bg-hover">Save & exit</button>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center px-6 pb-12"><div className="w-full flex-1 flex flex-col justify-center">{renderStep(step, d, up, toast)}</div></main>
      <footer className="shrink-0 sticky bottom-0 bg-bg">
        <div className="grid grid-cols-3 gap-1.5">{PHASES.map((_, i) => (<div key={i} className="h-1.5 bg-line"><div className="h-full bg-fg transition-all duration-300" style={{ width: `${phase(i)}%` }} /></div>))}</div>
        <div className="px-6 sm:px-10 h-20 flex items-center justify-between">
          <button onClick={() => (step === 1 ? router.push('/host/listings') : go(step - 1))} className="font-semibold underline px-3 py-2 rounded-lg hover:bg-hover">Back</button>
          <button onClick={next} disabled={busy} className={cn('px-8 py-3.5 rounded-lg font-semibold text-base transition-opacity', canNext(step, d) ? (last ? 'btn-brand' : 'bg-fg text-bg hover:opacity-90') : 'bg-line text-muted cursor-not-allowed')}>{busy ? 'Creating…' : last ? (app.draftListingId ? 'Save listing' : 'Create listing') : step === 1 || step === 7 || step === 13 ? 'Get started' : 'Next'}</button>
        </div>
      </footer>
      <Modal open={help} onClose={() => setHelp(false)} title="Questions?" footer={<><span /><button onClick={() => setHelp(false)} className="btn-dark px-6 py-3 text-sm">Got it</button></>}>
        <p className="text-muted">Need a hand? Every step can be changed after you publish. Use <b className="text-fg">Save & exit</b> any time — your progress is saved and you can pick up from the Listings tab.</p>
      </Modal>
    </div>
  );
}

const H1 = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (<div className="max-w-[640px] mx-auto w-full mb-8"><h1 className="text-[32px] sm:text-[40px] leading-tight font-semibold tracking-tight">{children}</h1>{sub && <p className="text-muted mt-2 text-lg">{sub}</p>}</div>);
const Wrap = ({ children, w = 640 }: { children: React.ReactNode; w?: number }) => (<div style={{ maxWidth: w }} className="mx-auto w-full">{children}</div>);

function Intro({ n, title, body, img }: { n: number; title: string; body: string; img: string }) {
  return (
    <div className="max-w-[1100px] mx-auto w-full grid md:grid-cols-2 gap-10 items-center">
      <div><div className="text-lg font-semibold">Step {n}</div><h1 className="text-[40px] sm:text-[56px] leading-[1.05] font-semibold tracking-tight mt-3">{title}</h1><p className="text-lg text-muted mt-6 max-w-md">{body}</p></div>
      <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-surface2 border border-line2 flex items-center justify-center"><img src={img} alt={title} referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} /></div>
    </div>
  );
}

function renderStep(step: number, d: Draft, up: (p: Partial<Draft>) => void, toast: (m: string) => void) {
  switch (step) {
    case 1: return <Intro n={1} title="Tell us about your place" body="In this step, we’ll ask you which type of property you have and if guests will book the entire place or just a room. Then let us know the location and how many guests can stay." img={ASSETS.illu1} />;
    case 2: return (
      <Wrap w={820}><H1>Which of these best describes your place?</H1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{PLACE_TYPES.map((p) => (<button key={p} onClick={() => up({ kind: p })} className={cn('border rounded-xl p-5 text-left transition-all hover:border-fg', d.kind === p ? 'border-fg border-2 bg-hover' : 'border-line')}><div className="text-3xl mb-3">{PLACE_ICON[p]}</div><div className="font-semibold text-[15px]">{p}</div></button>))}</div></Wrap>
    );
    case 3: return (
      <Wrap><H1>What type of place will guests have?</H1>
        <div className="space-y-3">{([['entire', '🏠', 'An entire place', 'Guests have the whole place to themselves.'], ['room', '🚪', 'A room', 'Guests have their own room in a home, plus access to shared spaces.'], ['shared', '🛏️', 'A shared room in a hostel', 'Guests sleep in a shared room in a professionally managed hostel with staff on-site 24/7.']] as const).map(([k, i, t, b]) => (<button key={k} onClick={() => up({ place: k })} className={cn('w-full border rounded-xl p-5 flex items-center justify-between gap-6 text-left hover:border-fg transition-all', d.place === k ? 'border-fg border-2 bg-hover' : 'border-line')}><div><div className="font-semibold text-lg">{t}</div><div className="text-muted text-sm mt-1">{b}</div></div><span className="text-4xl">{i}</span></button>))}</div></Wrap>
    );
    case 4: return <LocationStep d={d} up={up} />;
    case 5: return (
      <Wrap><H1 sub="We only share your address after guests book. Until then, they’ll see an approximate location.">Choose how guests see your location on a map</H1>
        <div className="relative h-[360px] rounded-2xl overflow-hidden border border-line bg-surface2" style={{ backgroundImage: 'linear-gradient(rgb(var(--line2)/.9) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--line2)/.9) 1px,transparent 1px)', backgroundSize: '48px 48px' }}>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface border border-line rounded-full px-4 py-2 text-sm font-semibold shadow max-w-[90%] truncate">{d.address}</div>
          {d.precise ? <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg text-xl">🏠</div> : <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-brand/20 border-2 border-brand flex items-center justify-center text-2xl">🏠</div>}
        </div>
        <div className="mt-5 border border-line rounded-2xl p-5 flex items-center justify-between gap-4 bg-surface"><div><h3 className="font-semibold">Show precise location</h3><p className="text-sm text-muted">Let guests see your home’s exact location on the map before they book.</p></div><Switch on={d.precise} onChange={(b) => up({ precise: b })} label="Show precise location" /></div></Wrap>
    );
    case 6: return (
      <Wrap w={560}><H1 sub="You’ll add more details later, such as bed types.">Share some basics about your place</H1>
        <div className="divide-y divide-line2">
          <Stepper label="Guests" value={d.guests} min={1} max={16} onChange={(n) => up({ guests: n })} />
          <Stepper label="Bedrooms" value={d.bedrooms} min={0} max={10} onChange={(n) => up({ bedrooms: n })} />
          <Stepper label="Beds" value={d.beds} min={1} max={16} onChange={(n) => up({ beds: n })} />
          <Stepper label="Bathrooms" value={d.baths} min={1} max={10} onChange={(n) => up({ baths: n })} />
        </div></Wrap>
    );
    case 7: return <Intro n={2} title="Make your place stand out" body="In this step, you’ll add some of the amenities your place offers, plus 5 or more photos. Then you’ll create a title and description." img={ASSETS.illu7} />;
    case 8: {
      const tog = (id: string) => up({ amenities: d.amenities.includes(id) ? d.amenities.filter((x) => x !== id) : [...d.amenities, id] });
      const grp = (g: string, cols: string) => (<div className={cn('grid gap-3', cols)}>{AMENITIES.filter((a) => a.group === g).map((a) => { const on = d.amenities.includes(a.id); return (<button key={a.id} onClick={() => tog(a.id)} className={cn('border rounded-xl p-4 text-left hover:border-fg transition-all', on ? 'border-fg border-2 bg-hover' : 'border-line')}><div className="text-2xl mb-2">{a.icon}</div><div className="font-semibold text-sm">{a.label}</div>{a.hint && <div className="text-xs text-muted mt-1">{a.hint}</div>}</button>); })}</div>);
      return (<Wrap w={820}><H1 sub="You can add more amenities after you publish your listing.">Tell guests which amenities they’ll find at your place</H1>
        <h2 className="font-semibold text-lg mb-3">Basics</h2>{grp('basics', 'grid-cols-2 sm:grid-cols-3')}
        <h2 className="font-semibold text-lg mt-8 mb-3">Standout amenities</h2>{grp('standout', 'grid-cols-2 sm:grid-cols-3')}
        <h2 className="font-semibold text-lg mt-8 mb-3">Safety items</h2>{grp('safety', 'grid-cols-2 sm:grid-cols-4')}
        <div className="mt-8 rounded-2xl bg-surface2 border border-line2 p-5"><h4 className="font-semibold">Host tip</h4><p className="text-sm text-muted mt-1">Guests search most frequently for listings that have Wifi, air conditioning, and a dedicated workspace. Make sure to confirm items before completing setup.</p></div></Wrap>);
    }
    case 9: return <PhotosStep d={d} up={up} toast={toast} />;
    case 10: return (
      <Wrap><H1 sub="Short titles work best. Have fun with it – you can always change it later.">Now, let’s give your house a title</H1>
        <textarea autoFocus maxLength={50} value={d.title} onChange={(e) => up({ title: e.target.value })} className="field text-2xl min-h-[160px] rounded-xl p-5" aria-label="Title" /><div className="text-sm text-muted mt-2">{d.title.length}/50</div></Wrap>
    );
    case 11: return (
      <Wrap><H1 sub="Choose up to 2 highlights. We’ll use these to get your description started.">Next, let’s describe your house</H1>
        <div className="flex flex-wrap gap-3">{[['Peaceful', '🕊️'], ['Unique', '✨'], ['Family-friendly', '👨‍👩‍👧'], ['Stylish', '🛋️'], ['Central', '📍'], ['Spacious', '🏡']].map(([h, i]) => { const on = d.highlights.includes(h); return (<button key={h} onClick={() => { if (on) up({ highlights: d.highlights.filter((x) => x !== h) }); else if (d.highlights.length >= 2) toast('Choose up to 2 highlights'); else { const hl = [...d.highlights, h]; up({ highlights: hl, description: d.description || `Relax with the whole family at this ${hl.map((x) => x.toLowerCase()).join(' and ')} place to stay.` }); } }} className={cn('px-5 py-3 rounded-full border text-[15px] font-medium flex items-center gap-2 hover:border-fg', on ? 'border-fg border-2 bg-hover' : 'border-line')}><span>{i}</span>{h}</button>); })}</div></Wrap>
    );
    case 12: return (
      <Wrap><H1 sub="Share what makes your place special.">Create your description</H1>
        <textarea maxLength={500} value={d.description} onChange={(e) => up({ description: e.target.value })} placeholder="Relax with the whole family at this peaceful place to stay." className="field min-h-[220px] rounded-xl p-5 text-lg" aria-label="Property description" /><div className="text-sm text-muted mt-2">{d.description.length}/500</div></Wrap>
    );
    case 13: return <Intro n={3} title="Finish up and publish" body="Finally, you’ll choose booking settings, set up pricing and publish your listing." img={ASSETS.illu13} />;
    case 14: return (
      <Wrap><H1 sub="You can change this at any time.">Pick your booking settings</H1>
        <div className="space-y-3">{[[false, '📅', 'Approve your first 5 bookings', 'Start by reviewing reservation requests, then switch to Instant Book so guests can book automatically.', 'Recommended'], [true, '⚡', 'Use Instant Book', 'Let guests book automatically.', '']].map(([v, i, t, b, tag]) => (<label key={t as string} className={cn('flex items-start gap-4 border rounded-xl p-5 cursor-pointer hover:border-fg', d.instantBook === v ? 'border-fg border-2 bg-hover' : 'border-line')}><input type="radio" name="bk" className="sr-only" checked={d.instantBook === v} onChange={() => up({ instantBook: v as boolean })} /><div className="flex-1"><div className="font-semibold text-lg">{t as string} {tag && <span className="ml-2 text-xs bg-[#008A05]/20 text-[#3fbf4a] rounded-full px-2 py-0.5 align-middle">{tag as string}</span>}</div><div className="text-sm text-muted mt-1">{b as string}</div></div><span className="text-3xl">{i as string}</span></label>))}</div></Wrap>
    );
    case 15: return <PriceStep d={d} up={up} toast={toast} />;
    case 16: return (
      <Wrap><H1 sub="Help your place stand out to get booked faster and earn your first reviews.">Add discounts</H1>
        <div className="space-y-3">{[['new', '20%', 'New listing promotion', 'Offer 20% off your first 3 bookings'], ['last', '3%', 'Last-minute discount', 'For stays booked 14 days or less before arrival'], ['weekly', '10%', 'Weekly discount', 'For stays of 7 nights or more'], ['monthly', '15%', 'Monthly discount', 'For stays of 28 nights or more']].map(([k, p, t, b]) => { const on = d.discounts.includes(k); return (<label key={k} className={cn('flex items-center gap-4 border rounded-xl p-5 cursor-pointer hover:border-fg', on ? 'border-fg border-2 bg-hover' : 'border-line')}><span className="w-16 h-12 rounded-lg border border-line flex items-center justify-center font-bold">{p}</span><span className="flex-1"><span className="block font-semibold">{t}</span><span className="block text-sm text-muted">{b}</span></span><input type="checkbox" className="w-6 h-6 accent-brand" checked={on} onChange={() => up({ discounts: on ? d.discounts.filter((x) => x !== k) : [...d.discounts, k] })} /></label>); })}</div>
        <p className="text-sm text-muted mt-5">Only one discount will be applied per stay.</p></Wrap>
    );
    case 17: return <SafetyStep d={d} up={up} />;
    case 18: return (
      <Wrap w={560}><H1 sub="This is required to comply with financial regulations and helps us prevent fraud.">Provide a few final details</H1>
        <h2 className="font-semibold text-lg">What’s your residential address?</h2><p className="text-sm text-muted mb-4">Guests won’t see this information.</p>
        <div className="border border-line rounded-xl overflow-hidden divide-y divide-line"><div className="px-4 py-3"><div className="text-xs text-muted">Country/region</div><div>India</div></div>
          {([['flat', 'Flat, house, etc. (if applicable)'], ['street', 'Street address'], ['landmark', 'Nearby landmark (if applicable)'], ['locality', 'District/locality (if applicable)'], ['city', 'City/town'], ['state', 'State/union territory']] as const).map(([k, p]) => (<input key={k} value={d[k]} onChange={(e) => up({ [k]: e.target.value } as Partial<Draft>)} placeholder={p} aria-label={p} className="w-full bg-transparent px-4 py-4 outline-none" />))}</div></Wrap>
    );
    default: return (
      <Wrap w={560}><div className="border border-line rounded-xl overflow-hidden divide-y divide-line mb-10"><input value={d.pin} onChange={(e) => up({ pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} placeholder="PIN code" aria-label="PIN code" className="w-full bg-transparent px-4 py-4 outline-none" /></div>
        <h2 className="text-2xl font-semibold">Are you hosting as a business?</h2><p className="text-muted mt-2">This means your business is most likely registered with your government.</p>
        <div className="grid grid-cols-2 gap-3 mt-6">{[[true, 'Yes'], [false, 'No']].map(([v, l]) => (<button key={l as string} onClick={() => up({ business: v as boolean })} className={cn('border rounded-xl py-4 font-semibold hover:border-fg', d.business === v ? 'border-fg border-2 bg-hover' : 'border-line')}>{l as string}</button>))}</div></Wrap>
    );
  }
}

function LocationStep({ d, up }: { d: Draft; up: (p: Partial<Draft>) => void }) {
  const [q, setQ] = useState(d.address);
  const [open, setOpen] = useState(false);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const list = ADDRESSES.filter((a) => a[0].toLowerCase().includes(q.toLowerCase()) || q === d.address);
  const pick = (a: string[]) => { up({ address: a[0], city: a[1], state: a[2], area: a[3], pin: a[4], street: d.street || a[3] } as Partial<Draft>); setQ(a[0]); setOpen(false); };
  return (
    <Wrap w={820}><H1 sub="Your address is only shared with guests after they’ve made a reservation.">Is the pin in the right spot?</H1>
      <div className="relative h-[420px] rounded-2xl overflow-hidden border border-line bg-surface2 touch-none cursor-grab active:cursor-grabbing" onPointerDown={(e) => (drag.current = { x: e.clientX - off.x, y: e.clientY - off.y })} onPointerMove={(e) => drag.current && setOff({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y })} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)}>
        <div className="absolute inset-[-200px]" style={{ transform: `translate(${off.x}px,${off.y}px)`, backgroundImage: 'linear-gradient(rgb(var(--line)/.6) 2px,transparent 2px),linear-gradient(90deg,rgb(var(--line)/.6) 2px,transparent 2px),linear-gradient(rgb(var(--line2)/.9) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--line2)/.9) 1px,transparent 1px)', backgroundSize: '240px 240px,240px 240px,48px 48px,48px 48px' }}><span className="absolute left-[360px] top-[300px] text-xs text-muted">{d.area}</span></div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none"><div className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg text-xl">🏠</div><div className="mx-auto w-0 h-0 border-x-8 border-x-transparent border-t-[10px] border-t-brand" /></div>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[min(92%,520px)]" onPointerDown={(e) => e.stopPropagation()}>
          <input value={q} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true); }} aria-label="Address" className="w-full bg-surface border border-line rounded-full px-5 py-3 text-sm font-semibold shadow outline-none focus:border-fg" />
          {open && (<div className="mt-2 bg-surface border border-line rounded-2xl shadow-pop overflow-hidden">{list.map((a) => (<button key={a[0]} onClick={() => pick(a)} className="w-full text-left px-5 py-3 text-sm hover:bg-hover flex gap-3">📍 {a[0]}</button>))}{list.length === 0 && <button onClick={() => { up({ address: q }); setOpen(false); }} className="w-full text-left px-5 py-3 text-sm hover:bg-hover">Use “{q}”</button>}</div>)}
        </div>
        <div className="absolute left-1/2 top-[calc(50%+16px)] -translate-x-1/2 bg-fg text-bg text-xs rounded-full px-3 py-1.5 pointer-events-none">Drag the map to reposition the pin</div>
        <div className="absolute right-4 bottom-4 flex flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>{[['＋', 'Zoom in'], ['－', 'Zoom out']].map(([s, l]) => (<button key={l} aria-label={l} onClick={() => setOff({ x: off.x * (l === 'Zoom in' ? 1.1 : 0.9), y: off.y * (l === 'Zoom in' ? 1.1 : 0.9) })} className="w-10 h-10 rounded-lg bg-surface border border-line shadow font-bold hover:bg-hover">{s}</button>))}</div>
      </div></Wrap>
  );
}

function PhotosStep({ d, up, toast }: { d: Draft; up: (p: Partial<Draft>) => void; toast: (m: string) => void }) {
  const [modal, setModal] = useState(false);
  const [url, setUrl] = useState('');
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const read = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!arr.length) return toast('Please choose image files');
    setBusy(true);
    const urls: string[] = [];
    for (const f of arr) {
      try { urls.push((await api.upload(f)).url); } catch (e) { toast(`${f.name}: ${errMsg(e)}`); }
    }
    if (urls.length) up({ photos: [...d.photos, ...urls] });
    setBusy(false);
  };
  const addUrl = () => { if (!/^https?:\/\//.test(url)) return toast('Enter a valid image URL'); up({ photos: [...d.photos, url] }); setUrl(''); };
  return (
    <Wrap w={720}><H1 sub={d.photos.length >= 5 ? 'Looking good! You can add more or reorder later.' : `You’ll need 5 photos to get started. You can add more or make changes later. (${d.photos.length}/5)`}>Add some photos of your house</H1>
      {d.photos.length === 0 ? (
        <div onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={(e) => { e.preventDefault(); setOver(false); read(e.dataTransfer.files); }} className={cn('border-2 border-dashed rounded-2xl py-16 flex flex-col items-center gap-5 bg-surface2', over ? 'border-fg' : 'border-line')}><div className="text-7xl">📷</div><button onClick={() => setModal(true)} className="px-6 py-3 rounded-lg border border-fg font-semibold hover:bg-hover">Add photos</button></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {d.photos.map((p, i) => (<div key={i} className={cn('relative rounded-xl overflow-hidden bg-surface2 group', i === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square')}><img src={p} alt={`Photo ${i + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />{i === 0 && <span className="absolute top-2 left-2 bg-bg text-fg text-xs font-semibold rounded-full px-3 py-1">Cover photo</span>}<button aria-label="Remove photo" onClick={() => up({ photos: d.photos.filter((_, k) => k !== i) })} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-bg/90 text-fg flex items-center justify-center opacity-0 group-hover:opacity-100"><Close /></button></div>))}
          <button onClick={() => setModal(true)} className="aspect-square rounded-xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-1 hover:border-fg"><Plus className="h-6 w-6" /><span className="text-sm font-semibold">Add more</span></button>
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Upload photos" footer={<><span className="text-sm text-muted">{d.photos.length} photo{d.photos.length === 1 ? '' : 's'} added</span><button onClick={() => setModal(false)} className="btn-dark px-6 py-3 text-sm">Done</button></>}>
        <label className="block border-2 border-dashed border-line rounded-2xl py-12 text-center cursor-pointer hover:border-fg"><div className="text-5xl mb-3">🖼️</div><div className="font-semibold">{busy ? 'Uploading…' : 'Drag and drop or browse'}</div><input type="file" multiple accept="image/*" className="sr-only" onChange={(e) => e.target.files && read(e.target.files)} /></label>
        <div className="flex gap-2 mt-5"><input className="field" placeholder="…or paste an image URL" value={url} onChange={(e) => setUrl(e.target.value)} /><button onClick={addUrl} className="btn-outline px-5 text-sm">Add</button></div>
        <button onClick={() => up({ photos: [...d.photos, ...SAMPLE.filter((s) => !d.photos.includes(s))] })} className="mt-5 underline font-semibold text-sm">Use sample photos</button>
      </Modal>
    </Wrap>
  );
}

function PriceStep({ d, up, toast }: { d: Draft; up: (p: Partial<Draft>) => void; toast: (m: string) => void }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(String(d.price));
  const wk = Math.round(d.price * (1 + d.weekend / 100));
  const commit = () => { const n = Number(v); if (!n || n < 300) { toast('Minimum price is ₹300'); setV(String(d.price)); } else up({ price: n }); setEdit(false); };
  return (
    <Wrap w={560}><H1 sub="These suggestions are based on guest demand for similar listings.">Now, set your prices</H1>
      <div className="border border-line rounded-2xl p-6 bg-surface"><div className="text-sm text-muted">Base price</div>
        {edit ? <div className="flex items-center gap-2 mt-2"><span className="text-4xl font-semibold">₹</span><input autoFocus value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, ''))} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && commit()} className="bg-transparent text-5xl font-semibold w-full outline-none" aria-label="Base price" /></div> : <button onClick={() => { setV(String(d.price)); setEdit(true); }} className="text-5xl font-semibold mt-2 hover:underline text-left" aria-label="Edit base price">{inr(d.price)}</button>}
      </div>
      <div className="border border-line rounded-2xl p-6 bg-surface mt-3 flex items-center justify-between"><div><div className="text-sm text-muted">Weekend adjustment</div><div className="text-3xl font-semibold mt-1">+{d.weekend}%</div><div className="text-sm text-muted">{inr(wk)} for Fri and Sat</div></div><div className="flex gap-2"><button aria-label="Decrease" onClick={() => up({ weekend: Math.max(0, d.weekend - 1) })} className="w-9 h-9 rounded-full border border-line hover:border-fg flex items-center justify-center"><Minus /></button><button aria-label="Increase" onClick={() => up({ weekend: Math.min(99, d.weekend + 1) })} className="w-9 h-9 rounded-full border border-line hover:border-fg flex items-center justify-center"><Plus /></button></div></div>
      <a href={`/search?where=${encodeURIComponent(d.city)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 border border-line rounded-full px-5 py-3 text-sm font-semibold hover:bg-hover">📍 Show similar listings</a></Wrap>
  );
}

function SafetyStep({ d, up }: { d: Draft; up: (p: Partial<Draft>) => void }) {
  const [modal, setModal] = useState(false);
  const tog = (k: string) => { const on = d.safety.includes(k); up({ safety: on ? d.safety.filter((x) => x !== k) : [...d.safety, k] }); if (k === 'camera' && !on) setModal(true); };
  return (
    <Wrap><H1>Share safety details</H1><h2 className="font-semibold text-lg mb-2">Does your place have any of these?</h2>
      <div className="divide-y divide-line2">{[['camera', 'Exterior security camera present'], ['noise', 'Noise decibel monitor present'], ['weapon', 'Weapon(s) on the property']].map(([k, l]) => { const on = d.safety.includes(k); return (<label key={k} className="flex items-center justify-between py-5 cursor-pointer"><span className="text-[17px]">{l}</span><span className={cn('w-7 h-7 rounded-md border-2 flex items-center justify-center', on ? 'bg-fg border-fg text-bg' : 'border-line')}>{on && <Check className="w-4 h-4" />}</span><input type="checkbox" className="sr-only" checked={on} onChange={() => tog(k)} /></label>); })}</div>
      <div className="mt-8 pt-8 border-t border-line2"><h3 className="font-semibold text-lg">Important things to know</h3><p className="text-sm text-muted mt-2">Security cameras that monitor indoor spaces are not allowed even if they’re turned off. All exterior security cameras must be disclosed. Be sure to comply with your local laws and review Airbnb’s anti-discrimination policy and guest and host fees.</p></div>
      <Modal open={modal} onClose={() => setModal(false)} title="Security camera disclosure" footer={<><span /><button onClick={() => setModal(false)} className="btn-dark px-6 py-3 text-sm">Continue</button></>}>
        <h2 className="text-2xl font-semibold">Tell guests about your exterior security cameras</h2><p className="text-sm text-muted mt-2 mb-4">Describe the area that each camera monitors, such as the back garden or pool.</p>
        <textarea maxLength={300} value={d.cameraNote} onChange={(e) => up({ cameraNote: e.target.value })} className="field min-h-[130px]" aria-label="Camera details" /><div className="text-sm text-muted mt-2">{300 - d.cameraNote.length} characters available</div>
      </Modal></Wrap>
  );
}
