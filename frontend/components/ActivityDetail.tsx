'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { Shell } from '@/components/Shell';
import { Img, Stepper } from '@/components/ui';
import { api, errMsg } from '@/lib/api';
import { useFetch } from './hooks';
import { useApp } from '@/lib/store';
import type { Activity } from '@/lib/types';
import { fmtLong, inr } from '@/lib/utils';
import { Star } from './Icons';

export function ActivityDetail({ id }: { id: string }) {
  const { data: a, loading } = useFetch((signal) => api.get<Activity>(`/activities/${id}`, undefined, signal), [id]);
  const { user, toast } = useApp();
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState(1);
  if (loading) {
    return (<Shell active={id.startsWith('svc') ? 'services' : 'experiences'}><div className="container-page py-24 text-center text-muted">Loading…</div></Shell>);
  }
  if (!a) {
    return (
      <Shell active={id.startsWith('svc') ? 'services' : 'experiences'}>
        <div className="container-page py-24 text-center">
          <h1 className="text-2xl font-semibold">We couldn’t find that</h1>
          <Link href="/" className="inline-block mt-6 btn-dark px-6 py-3">Back to home</Link>
        </div>
      </Shell>
    );
  }
  const total = Math.max(a.unit === 'group' ? a.price : a.price * guests, a.minimum || 0);
  const reserve = async () => {
    if (a.comingSoon) return toast('This Original is coming soon');
    if (!user) { toast('Log in to reserve'); return router.push(`/login?next=/${a.kind === 'experience' ? 'experiences' : 'services'}/${a.id}`); }
    if (!date) return toast('Select a date first');
    setBusy(true);
    try {
      await api.post('/activity-bookings', { activityId: a.id, day: date, guests });
      toast('Reserved! Find it in Trips');
      router.push('/trips');
    } catch (e) { toast(errMsg(e)); setBusy(false); }
  };
  return (
    <Shell active={a.kind === 'experience' ? 'experiences' : 'services'} compact>
      <div className="max-w-[1120px] mx-auto px-6 py-8">
        <h1 className="text-[26px] font-semibold tracking-tight">{a.title}</h1>
        <p className="text-sm mt-1 flex items-center gap-1.5">
          {a.rating > 0 && (<><Star /> <span className="font-semibold">{a.rating}</span> ·</>)} <span className="underline">{a.location || a.city}</span>
        </p>
        <div className="mt-6 rounded-2xl overflow-hidden aspect-[16/8] bg-surface border border-line2">
          <Img src={a.image} alt={a.title} className="w-full h-full object-cover" />
        </div>
        <div className="mt-10 grid lg:grid-cols-[1fr_380px] gap-16">
          <div>
            <h2 className="text-[22px] font-semibold">{a.kind === 'experience' ? 'Experience' : 'Service'} hosted by {a.host}</h2>
            <p className="text-muted mt-1">{a.duration} · Up to 10 guests · Hosted in English and Hindi</p>
            <hr className="my-8 border-line2" />
            <p className="leading-relaxed text-[16px]">{a.description}</p>
            <hr className="my-8 border-line2" />
            <h3 className="text-[22px] font-semibold mb-4">Choose a date</h3>
            <Calendar start={date} end="" single months={2} onChange={(d) => setDate(d)} />
          </div>
          <aside className="lg:sticky lg:top-28 self-start border border-line rounded-2xl shadow-card p-6 bg-surface">
            <div className="flex items-baseline gap-1"><span className="text-[22px] font-semibold">{inr(a.price)}</span><span className="text-muted">/ {a.unit}</span></div>
            <div className="mt-4 border border-line rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold uppercase">Date</div>
              <div className="text-sm">{date ? fmtLong(date) : 'Select a date'}</div>
            </div>
            <div className="divide-y divide-line2"><Stepper label="Guests" value={guests} onChange={setGuests} min={1} max={10} /></div>
            {a.minimum && <p className="text-sm text-muted mb-2">Minimum {inr(a.minimum)} to book</p>}
            <button onClick={reserve} disabled={busy} className="w-full btn-brand py-3.5 text-base mt-2 disabled:opacity-60">{a.comingSoon ? 'Coming soon' : busy ? 'Reserving…' : 'Reserve'}</button>
            <p className="text-center text-sm text-muted mt-3">You won’t be charged yet</p>
            <div className="flex justify-between font-semibold mt-5 pt-5 border-t border-line2"><span>Total</span><span>{inr(total)}</span></div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
