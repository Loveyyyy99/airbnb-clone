'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, Modal, Switch } from './ui';

function Side({ base, tab }: { base: string; tab: 'about' | 'conn' }) {
  const { user } = useApp();
  const t = (on: boolean) => cn('flex items-center gap-4 px-4 py-3 rounded-xl font-semibold transition-colors', on ? 'bg-hover' : 'hover:bg-hover');
  return (
    <aside className="md:w-[340px] shrink-0 md:border-r border-line2 md:pr-8">
      <h1 className="text-[32px] font-semibold tracking-tight mb-6">Profile</h1>
      <nav className="space-y-2">
        <Link href={base} className={t(tab === 'about')}><Avatar name={user?.firstName || 'U'} src={user?.avatarUrl || undefined} size={40} color="#222" />About me</Link>
        <Link href={`${base}/connections`} className={t(tab === 'conn')}><span className="w-10 h-10 rounded-full bg-surface2 border border-line2 flex items-center justify-center text-xl">👥</span>Connections</Link>
      </nav>
    </aside>
  );
}

export function AboutMe({ base }: { base: string }) {
  const { user, profile } = useApp();
  const router = useRouter();
  if (!user) return null;
  const facts = [['🎓', profile.school], ['💼', profile.work], ['🌍', profile.dream], ['🐾', profile.pets], ['🗣️', profile.languages]].filter((x) => x[1]);
  return (
    <div className="container-page max-w-[1100px] py-10 flex flex-col md:flex-row gap-10">
      <Side base={base} tab="about" />
      <section className="flex-1">
        <div className="flex items-center justify-between mb-8"><h2 className="text-[32px] font-semibold tracking-tight">About me</h2><button onClick={() => router.push(`${base}/edit`)} className="px-5 py-2.5 rounded-lg bg-surface2 border border-line font-semibold text-sm hover:bg-hover">Edit</button></div>
        <div className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
          <div className="border border-line rounded-3xl shadow-card p-8 text-center bg-surface">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="Profile" className="w-28 h-28 rounded-full object-cover mx-auto" /> : <div className="mx-auto"><Avatar name={user.firstName} size={112} color="#222" /></div>}
            <div className="text-[26px] font-bold mt-4">{user.firstName}</div>
            <div className="text-sm text-muted">{base.includes('host') ? 'Host' : 'Guest'}</div>
          </div>
          <div>
            {profile.intro && <p className="mb-6 text-[16px] leading-relaxed">{profile.intro}</p>}
            {facts.length > 0 && <div className="space-y-3 mb-6">{facts.map(([i, t]) => (<div key={t} className="flex gap-3"><span>{i}</span><span>{t}</span></div>))}</div>}
            {profile.interests.length > 0 && <div className="flex flex-wrap gap-2 mb-6">{profile.interests.map((i) => (<span key={i} className="px-3 py-1.5 rounded-full border border-line text-sm">{i}</span>))}</div>}
            <h3 className="text-[22px] font-semibold">Complete your profile</h3>
            <p className="text-muted mt-2 max-w-md">Your Airbnb profile is an important part of every reservation. Create yours to help other hosts and guests get to know you.</p>
            <button onClick={() => router.push(`${base}/edit`)} className="mt-5 btn-dark px-6 py-3 text-sm">Get started</button>
          </div>
        </div>
        <hr className="my-10 border-line2" />
        <Link href="/coming-soon?t=Your reviews" className="flex items-center gap-3 font-semibold underline">💬 Show reviews I’ve written</Link>
      </section>
    </div>
  );
}

export function Connections({ base }: { base: string }) {
  return (
    <div className="container-page max-w-[1100px] py-10 flex flex-col md:flex-row gap-10">
      <Side base={base} tab="conn" />
      <section className="flex-1">
        <h2 className="text-[32px] font-semibold tracking-tight mb-10">Connections</h2>
        <div className="text-center max-w-md mx-auto py-8"><div className="text-7xl mb-6">🧑‍🤝‍🧑</div><p className="text-muted">When you join an experience or invite someone on a trip, you’ll find the profiles of other guests here. <Link href="/coming-soon?t=Connections" className="underline font-semibold text-fg">Learn more</Link></p><Link href="/search" className="inline-block mt-6 btn-dark px-6 py-3 text-sm">Book a trip</Link></div>
      </section>
    </div>
  );
}

const PROMPTS: [keyof Profile, string, string][] = [
  ['school', 'Where I went to school', '🎓'], ['work', 'My work', '💼'], ['dream', 'Where I’ve always wanted to go', '🌍'], ['pets', 'Pets', '🐾'],
  ['decade', 'Decade I was born', '📅'], ['fun', 'My fun fact', '🎉'], ['song', 'My favourite song in secondary school', '🎵'], ['skill', 'My most useless skill', '🤹'],
  ['time', 'I spend too much time', '⏳'], ['languages', 'Languages I speak', '🗣️'],
];
const INTERESTS = ['Travel', 'Food', 'Hiking', 'Photography', 'Music', 'Reading', 'Cricket', 'Coding', 'Movies', 'Yoga'];

export function EditProfile({ base }: { base: string }) {
  const { user, profile, patchProfile, updateUser, toast } = useApp();
  const router = useRouter();
  const [edit, setEdit] = useState<keyof Profile | null>(null);
  const [val, setVal] = useState('');
  const [intro, setIntro] = useState(false);
  const [ints, setInts] = useState(false);
  if (!user) return null;
  const open = (k: keyof Profile) => { setVal(String(profile[k] || '')); setEdit(k); };
  const photo = async (f?: File) => {
    if (!f) return;
    try {
      const { url } = await api.upload(f);
      await updateUser({ avatarUrl: url });
      toast('Profile photo updated');
    } catch (e) { toast(errMsg(e)); }
  };
  return (
    <div className="max-w-[1100px] mx-auto px-6 py-10 pb-32 grid md:grid-cols-[300px_1fr] gap-12">
      <div className="text-center">
        <div className="relative w-40 h-40 mx-auto">{user.avatarUrl ? <img src={user.avatarUrl} className="w-40 h-40 rounded-full object-cover" alt="Profile" /> : <Avatar name={user.firstName} size={160} color="#222" />}
          <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface border border-line rounded-full px-4 py-2 text-sm font-semibold shadow cursor-pointer hover:bg-hover">📷 Add<input type="file" accept="image/*" className="sr-only" onChange={(e) => photo(e.target.files?.[0])} /></label></div>
      </div>
      <div>
        <h1 className="text-[32px] font-semibold tracking-tight">My profile</h1>
        <p className="text-muted mt-2 max-w-xl">Hosts and guests can see your profile and it may appear across Airbnb to help us build trust in our community.</p>
        <div className="grid sm:grid-cols-2 gap-x-10 mt-8">
          {PROMPTS.map(([k, label, icon]) => (
            <button key={k} onClick={() => open(k)} className="flex items-center gap-4 py-5 border-b border-line2 text-left hover:bg-hover px-1">
              <span className="text-2xl w-8">{icon}</span><span className="flex-1"><span className="block text-[15px]">{label}</span>{profile[k] ? <span className="block text-sm text-muted">{String(profile[k])}</span> : null}</span>
            </button>
          ))}
        </div>
        <h2 className="text-[22px] font-semibold mt-10 mb-3">About me</h2>
        <button onClick={() => setIntro(true)} className="w-full border-2 border-dashed border-line rounded-2xl p-6 text-left hover:border-fg">{profile.intro ? profile.intro : (<><div className="text-muted">Write something fun and punchy.</div><div className="font-semibold underline mt-2">Add intro</div></>)}</button>
        <h2 className="text-[22px] font-semibold mt-10">Where I’ve been</h2>
        <div className="flex items-center justify-between mt-2"><p className="text-muted text-sm">Pick the stamps you want other people to see on your profile.</p><Switch on={profile.stamps} onChange={(b) => patchProfile({ stamps: b })} label="Show stamps" /></div>
        {profile.stamps && <div className="flex gap-4 mt-5 overflow-x-auto no-scrollbar">{['🌐', '☀️', '✈️', '🧳'].map((s, i) => (<div key={i} className={cn('w-28 h-28 border-2 border-dashed border-line flex flex-col items-center justify-center text-muted shrink-0', ['rounded-2xl', 'rounded-full', 'rounded-3xl', 'rounded-lg'][i])}><span className="text-3xl">{s}</span><span className="text-xs mt-1">Next destination</span></div>))}</div>}
        <button onClick={() => toast('Travel stamps are filled in automatically after your trips')} className="mt-5 px-5 py-2.5 rounded-lg border border-fg font-semibold text-sm hover:bg-hover">Edit travel stamps</button>
        <h2 className="text-[22px] font-semibold mt-10">My interests</h2>
        <p className="text-muted text-sm mt-1">Find common ground with other guests and hosts by adding interests to your profile.</p>
        <div className="flex flex-wrap gap-2 mt-4">{profile.interests.map((i) => (<span key={i} className="px-4 py-2 rounded-full border border-line text-sm">{i}</span>))}</div>
        <button onClick={() => setInts(true)} className="mt-4 px-5 py-2.5 rounded-lg border border-fg font-semibold text-sm hover:bg-hover">Add interests</button>
      </div>
      <div className="fixed bottom-0 inset-x-0 bg-bg border-t border-line2 p-4 flex justify-end z-40"><button onClick={() => { toast('Profile saved'); router.push(base); }} className="btn-dark px-8 py-3 text-sm">Done</button></div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={PROMPTS.find((p) => p[0] === edit)?.[1]} footer={<><button onClick={() => { patchProfile({ [edit!]: '' } as Partial<Profile>); setEdit(null); }} className="underline font-semibold">Clear</button><button onClick={() => { patchProfile({ [edit!]: val.trim() } as Partial<Profile>); setEdit(null); }} className="btn-dark px-6 py-3 text-sm">Save</button></>}>
        <input autoFocus className="field" value={val} maxLength={60} onChange={(e) => setVal(e.target.value)} />
      </Modal>
      <Modal open={intro} onClose={() => setIntro(false)} title="About me" footer={<><span /><button onClick={() => { setIntro(false); toast('Intro saved'); }} className="btn-dark px-6 py-3 text-sm">Save</button></>}>
        <textarea className="field min-h-[160px]" maxLength={450} value={profile.intro} onChange={(e) => patchProfile({ intro: e.target.value })} placeholder="Write something fun and punchy." />
      </Modal>
      <Modal open={ints} onClose={() => setInts(false)} title="What are you into?" footer={<><span /><button onClick={() => setInts(false)} className="btn-dark px-6 py-3 text-sm">Save</button></>}>
        <div className="flex flex-wrap gap-3">{INTERESTS.map((i) => { const on = profile.interests.includes(i); return (<button key={i} onClick={() => patchProfile({ interests: on ? profile.interests.filter((x) => x !== i) : [...profile.interests, i] })} className={cn('px-4 py-2.5 rounded-full border text-sm', on ? 'bg-fg text-bg border-fg' : 'border-line hover:border-fg')}>{i}</button>); })}</div>
      </Modal>
    </div>
  );
}
