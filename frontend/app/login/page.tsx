'use client';
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthBackdrop } from '@/components/AuthBackdrop';
import { LogoMark } from '@/components/Icons';
import { useApp } from '@/lib/store';
import { errMsg } from '@/lib/api';

function Inner() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/';
  const { login, toast, checkEmail, demoLogin } = useApp();
  const [v, setV] = useState('');
  const [pw, setPw] = useState('');
  const [step, setStep] = useState<'id' | 'pw'>('id');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const isEmail = /^\S+@\S+\.\S+$/.test(v);
  const isPhone = /^\+?[\d\s-]{10,14}$/.test(v);
  const emailOf = () => (isEmail ? v.trim().toLowerCase() : `${v.replace(/\D/g, '')}@phone.local`);
  const cont = async () => {
    if (!isEmail && !isPhone) return setErr('Enter a valid phone number or email');
    setErr('');
    setBusy(true);
    try {
      if (await checkEmail(emailOf())) setStep('pw');
      else router.push(`/signup?email=${encodeURIComponent(emailOf())}&next=${encodeURIComponent(next)}`);
    } catch (e) { setErr(errMsg(e)); }
    setBusy(false);
  };
  const doLogin = async () => {
    if (!pw) return setErr('Enter your password');
    setErr('');
    setBusy(true);
    try {
      const u = await login(emailOf(), pw);
      toast(`Welcome back, ${u.firstName}!`);
      router.push(next);
    } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };
  const social = async (p: string) => {
    setBusy(true);
    try { await demoLogin(p); toast(`Signed in with ${p}`); router.push(next); } catch (e) { setErr(errMsg(e)); setBusy(false); }
  };
  return (
    <div className="w-full max-w-[568px] bg-surface border border-line2 rounded-3xl shadow-card">
      <div className="h-16 border-b border-line2 flex items-center justify-center text-brand"><LogoMark className="h-8 w-8" /></div>
      <div className="p-6">
        <h1 className="text-[22px] font-semibold mb-6">Log in or sign up</h1>
        {step === 'id' ? (
          <>
            <label className="block">
              <span className="sr-only">Phone number or email</span>
              <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && cont()} placeholder="Phone number or email" className="field py-4" autoFocus />
            </label>
            {err && <p className="text-sm text-[#C13515] mt-2">{err}</p>}
            <button onClick={cont} disabled={busy} className="btn-brand w-full py-3.5 text-base mt-4 disabled:opacity-60">{busy ? 'Please wait…' : 'Continue'}</button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted mb-3">Welcome back. Enter the password for <b className="text-fg">{v}</b> · <button className="underline" onClick={() => { setStep('id'); setPw(''); setErr(''); }}>Change</button></p>
            <label className="block">
              <span className="sr-only">Password</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doLogin()} placeholder="Password" className="field py-4" autoFocus />
            </label>
            {err && <p className="text-sm text-[#C13515] mt-2">{err}</p>}
            <button onClick={doLogin} disabled={busy} className="btn-brand w-full py-3.5 text-base mt-4 disabled:opacity-60">{busy ? 'Please wait…' : 'Log in'}</button>
          </>
        )}
        <div className="flex items-center gap-4 my-6 text-xs text-muted"><div className="flex-1 h-px bg-line" />or<div className="flex-1 h-px bg-line" /></div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => social('Google')} className="border border-fg/70 rounded-lg py-3 font-semibold hover:bg-hover flex items-center justify-center gap-2"><span className="font-bold text-[#4285F4]">G</span> Google</button>
          <button onClick={() => social('Apple')} className="border border-fg/70 rounded-lg py-3 font-semibold hover:bg-hover flex items-center justify-center gap-2"><span></span> Apple</button>
        </div>
        <p className="text-xs text-muted mt-5 text-center">Demo account: <button className="underline" onClick={() => { setV('guest@demo.com'); setStep('id'); }}>guest@demo.com</button> · password123</p>
      </div>
    </div>
  );
}
export default function Page() { return (<Suspense><AuthBackdrop><Inner /></AuthBackdrop></Suspense>); }
