'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { Minus, Plus } from '@/components/Icons';
import { Img, Logo, Modal, Stepper, ThemeToggle } from '@/components/ui';
import { UserMenu } from '@/components/Header';
import { ASSETS, FAQ } from '@/lib/data';
import { useApp } from '@/lib/store';
import { cn, inr } from '@/lib/utils';

const RATES: Record<string, number> = { Patiala: 3000, Chandigarh: 3600, 'New Delhi': 4200, Mumbai: 6000, Manali: 3400, 'North Goa': 4500 };
const PINS = [[18, 22, 3180], [72, 18, 2406], [30, 70, 3760], [80, 62, 4451], [58, 40, 4339], [12, 48, 5584], [45, 82, 2680], [88, 36, 5000], [64, 78, 6638], [38, 20, 3421]];

export default function Hosting() {
  const { user, startDraft, draft, toast } = useApp();
  const router = useRouter();
  const [nights, setNights] = useState(7);
  const [city, setCity] = useState('Patiala');
  const [entire, setEntire] = useState(true);
  const [beds, setBeds] = useState(2);
  const [modal, setModal] = useState(false);
  const [faq, setFaq] = useState(0);
  const rate = Math.round((RATES[city] || 3000) * (entire ? 1 : 0.5) * (0.75 + beds * 0.125) / 10) * 10;
  const earn = Math.round(nights * rate * 0.97 / 10) * 10 - 1;
  const start = async () => {
    if (!user) return router.push('/login?next=/hosting');
    if (!draft) await startDraft();
    router.push(`/host/setup/${draft?.step || 1}`);
  };
  const link = 'text-sm font-semibold px-3 py-2 rounded-full hover:bg-hover';
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur border-b border-line2">
        <div className="container-page h-20 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex gap-2">{[['Overview', '#overview'], ['Earnings', '#overview'], ['AirCover', '#aircover'], ['Community', '#faq']].map(([a, h]) => (<a key={a} href={h} className={link}>{a}</a>))}</nav>
          <div className="flex items-center gap-1"><Link href="/coming-soon?t=Host support" className={cn(link, 'hidden sm:block')}>Support</Link><ThemeToggle /><button onClick={start} className="btn-dark px-5 py-2.5 text-sm mr-1">Get started</button><UserMenu /></div>
        </div>
      </header>
      <main className="flex-1">
        <section id="overview" className="container-page py-14 grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-md mx-auto w-full text-center lg:text-left">
            <div className="text-xl text-muted">Airbnb it.</div>
            <h1 className="text-[28px] font-semibold mt-6">Your home could make</h1>
            <div className="text-[84px] leading-none font-bold tracking-tight tabular-nums mt-2">{inr(earn)}</div>
            <div className="mt-3 text-lg"><span className="underline">{nights} nights</span> · {inr(rate)}/night</div>
            <button onClick={() => toast('Estimates are based on similar listings nearby')} className="text-sm underline text-muted mt-2">Learn how we estimate earnings</button>
            <div className="mt-8 border border-line rounded-2xl p-5 bg-surface">
              <div className="text-sm font-semibold mb-3">Select nights to host</div>
              <input aria-label="Nights" type="range" min={1} max={30} value={nights} onChange={(e) => setNights(Number(e.target.value))} className="w-full accent-brand" />
              <div className="flex justify-between text-xs text-muted mt-1"><span>1 night</span><span>15 nights</span><span>30 nights</span></div>
            </div>
            <button onClick={() => setModal(true)} className="mt-4 w-full flex items-center justify-between border border-line rounded-full px-5 py-3 text-left hover:shadow-pill bg-surface">
              <span><span className="block text-sm font-semibold">{city} · {entire ? 'Entire place' : 'A room'} · {beds} bedroom{beds > 1 ? 's' : ''}</span><span className="block text-xs text-muted">Tap to configure your space</span></span><span className="text-sm font-semibold underline">Change</span>
            </button>
          </div>
          <div className="relative h-[480px] rounded-3xl border border-line2 overflow-hidden bg-surface2" style={{ backgroundImage: 'linear-gradient(rgb(var(--line2)/.8) 1px,transparent 1px),linear-gradient(90deg,rgb(var(--line2)/.8) 1px,transparent 1px)', backgroundSize: '56px 56px' }}>
            <div className="absolute left-4 top-4 bg-surface border border-line rounded-full px-4 py-2 text-sm font-semibold shadow">📍 Explore rates near you</div>
            {PINS.map(([x, y, p]) => (<span key={p} style={{ left: `${x}%`, top: `${y}%` }} className="absolute bg-bg border border-line rounded-full px-3 py-1 text-sm font-semibold shadow-pill">{inr(Math.round(p * rate / 3000))}</span>))}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"><div className="mx-auto w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center text-xl shadow-lg">🏠</div><div className="mt-2 bg-fg text-bg rounded-full px-3 py-1 text-sm font-semibold">{inr(rate)} / night</div></div>
          </div>
        </section>

        <section className="container-page"><div className="border border-line rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-5 bg-surface"><div className="flex -space-x-3">{ASSETS.hostHome.slice(0, 3).map((s, i) => (<div key={i} className="w-12 h-12 rounded-full overflow-hidden border-2 border-bg bg-surface2"><Img src={s} alt="Specialist" className="w-full h-full object-cover" /></div>))}</div><div className="flex-1 text-center sm:text-left"><h2 className="text-xl font-semibold">Curious about hosting?</h2><p className="text-muted text-sm">Get helpful tips from Airbnb specialists.</p></div><button onClick={() => toast('A specialist will reach out soon')} className="btn-outline px-6 py-3 text-sm">Let’s talk</button></div></section>

        <section className="container-page py-20"><h2 className="text-[34px] font-semibold tracking-tight text-center">Join millions of hosts on Airbnb</h2><p className="text-muted text-center mt-2">Everything you need to turn your extra space into remarkable income.</p>
          <div className="grid md:grid-cols-3 gap-6 mt-10">{[['🧩', 'It’s easy', 'Create a listing in just a few steps, and get 1:1 support from experienced hosts at any time.'], ['💸', 'It’s worth it', 'Getting started is free. You set your price, and we only collect a fee after you’ve got paid.'], ['🛡️', 'You’re protected', 'Peace of mind for your home and belongings every time you host on Airbnb.']].map(([i, t, d]) => (<div key={t} className="border border-line rounded-3xl p-8 bg-surface"><div className="text-4xl mb-6">{i}</div><h3 className="text-xl font-semibold">{t}</h3><p className="text-muted mt-2">{d}</p></div>))}</div></section>

        <section id="aircover" className="container-page pb-20"><div className="border border-line rounded-3xl p-10 bg-surface grid md:grid-cols-2 gap-10"><div><div className="text-3xl font-bold text-brand">air<span className="text-fg">cover</span> <span className="text-base text-muted font-semibold">for Hosts</span></div><h2 className="text-[30px] font-semibold mt-6">When you host, you’re protected</h2><p className="text-muted mt-2">Top-to-bottom protection, included every time you host.</p><ul className="mt-6 space-y-3">{['Up to $3m USD damage protection', 'Up to $1m USD liability insurance', '24-hour safety line'].map((x) => (<li key={x} className="flex gap-3 font-medium"><span className="text-[#008A05]">✔</span>{x}</li>))}</ul><p className="text-xs text-muted mt-6">Host Damage Protection reimburses for certain guest damages during Airbnb stays. It’s not insurance and may apply if guests don’t pay.</p><Link href="/coming-soon?t=AirCover for Hosts" className="inline-block mt-5 btn-outline px-6 py-3 text-sm">Learn about AirCover</Link></div><div className="space-y-4"><h3 className="font-semibold">Plus additional safeguards and features</h3>{[['🪪', 'Guest identity verification', 'Airbnb’s processes help ensure booking guests are genuine.'], ['⭐', 'Profiles & reviews', 'View info, ratings and past trips for every guest that books.']].map(([i, t, d]) => (<div key={t} className="border border-line2 rounded-2xl p-5 flex gap-4 bg-surface2"><span className="text-2xl">{i}</span><div><div className="font-semibold">{t}</div><div className="text-sm text-muted">{d}</div></div></div>))}</div></div></section>

        <section className="container-page pb-20 text-center"><h2 className="text-[34px] font-semibold tracking-tight">Your place looks great on Airbnb</h2><p className="text-muted mt-2">From listing polish to broad global discovery, we design every pixel to highlight your home.</p>
          <div className="grid md:grid-cols-2 gap-8 mt-10 max-w-3xl mx-auto">{[['Detail Experience', 'Beautiful listings made easy', 'Art Deco Gem in Condesa', '₹7,200 / night'], ['Marketplace Feed', 'Show up where guests book', 'Himalayan Retreat', '₹5,400 night']].map(([a, b, c, d], i) => (<div key={a} className="border-[6px] border-line rounded-[40px] p-4 bg-surface text-left"><div className="text-xs text-muted">{a}</div><div className="font-semibold mb-3">{b}</div><div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface2"><Img src={ASSETS.hostHome[3 + i]} alt={c} className="w-full h-full object-cover" /></div><div className="mt-3 font-semibold">{c}</div><div className="text-sm text-muted">★ 4.9{i} · {d}</div></div>))}</div></section>

        <section id="faq" className="container-page pb-20 max-w-[900px]"><h2 className="text-[34px] font-semibold tracking-tight mb-8">Your questions, answered</h2>
          <div className="grid sm:grid-cols-3 gap-4 mb-12">{['Is my place right for Airbnb?', 'How does hosting work?', 'How do I get started?'].map((q, i) => (<button key={q} onClick={() => setFaq(Math.min(i, 2))} className="text-left border border-line rounded-2xl overflow-hidden bg-surface hover:shadow-pill"><div className="h-32 bg-surface2"><Img src={ASSETS.hostHome[4 + i]} alt={q} className="w-full h-full object-cover" /></div><div className="p-4"><div className="text-xs text-muted">Question 0{i + 1}</div><div className="font-semibold">{q}</div></div></button>))}</div>
          <h3 className="text-xl font-semibold mb-2">Hosting basics</h3>
          {FAQ.map(([q, a], i) => (<div key={q} className="border-b border-line2"><button onClick={() => setFaq(faq === i ? -1 : i)} className="w-full flex items-center justify-between py-5 text-left font-semibold">{q}{faq === i ? <Minus /> : <Plus />}</button>{faq === i && <p className="pb-5 text-muted">{a}</p>}</div>))}
          <div className="mt-12 rounded-3xl bg-surface2 border border-line2 p-8 text-center"><h3 className="text-xl font-semibold">Still have questions?</h3><p className="text-muted mt-1">Visit our community forum or talk to a specialist.</p><button onClick={start} className="mt-5 btn-brand px-8 py-3.5">Get started</button></div></section>
      </main>
      <Footer />
      <Modal open={modal} onClose={() => setModal(false)} title="Configure your space" footer={<><span /><button onClick={() => setModal(false)} className="btn-dark px-6 py-3 text-sm">Done</button></>}>
        <div className="mb-4"><div className="font-semibold mb-2">Location</div><div className="flex flex-wrap gap-2">{Object.keys(RATES).map((c) => (<button key={c} onClick={() => setCity(c)} className={cn('px-4 py-2 rounded-full border text-sm', city === c ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg')}>{c}</button>))}</div></div>
        <div className="mb-2"><div className="font-semibold mb-2">Space</div><div className="grid grid-cols-2 gap-3">{[[true, 'Entire place'], [false, 'A room']].map(([v, l]) => (<button key={String(l)} onClick={() => setEntire(v as boolean)} className={cn('border rounded-xl py-3 text-sm font-medium', entire === v ? 'border-fg bg-hover' : 'border-line')}>{l as string}</button>))}</div></div>
        <Stepper label="Bedrooms" value={beds} min={1} max={8} onChange={setBeds} />
      </Modal>
    </div>
  );
}
