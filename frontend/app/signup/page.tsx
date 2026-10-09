'use client';
import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowL } from '@/components/Icons';
import { useApp } from '@/lib/store';
import { errMsg } from '@/lib/api';
import { AuthBackdrop } from '@/components/AuthBackdrop';

function Inner() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || '/';
  const { signup, toast } = useApp();
  const [f, setF] = useState({ first: '', last: '', dob: '', password: '', email: (sp.get('email') || '').endsWith('@phone.local') ? '' : sp.get('email') || '', optOut: false });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const e: Record<string, string> = {};
    if (!f.first.trim()) e.first = 'First name is required';
    if (!f.last.trim()) e.last = 'Last name is required';
    if (!f.dob) e.dob = 'Select your date of birth';
    else if ((Date.now() - new Date(f.dob).getTime()) / 31557600000 < 18) e.dob = 'You must be at least 18 to sign up';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
    if (f.password.length < 8) e.password = 'Password must be at least 8 characters';
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      await signup({ firstName: f.first.trim(), lastName: f.last.trim(), email: f.email.trim(), password: f.password, dob: f.dob });
      toast(`Welcome to Airbnb, ${f.first.trim()}!`);
      router.push(next);
    } catch (x) {
      const m = errMsg(x);
      setErr({ form: m, ...(/email/i.test(m) ? { email: m } : {}) });
      setBusy(false);
    }
  };
  const E = ({ k }: { k: string }) => (err[k] ? <p className="text-xs text-[#C13515] mt-1">{err[k]}</p> : null);
  return (
    <div className="w-full max-w-[568px] bg-surface border border-line2 rounded-3xl shadow-card max-h-[80vh] flex flex-col">
      <div className="h-16 border-b border-line2 flex items-center px-4 shrink-0">
        <button onClick={() => router.back()} aria-label="Back" className="p-2 rounded-full hover:bg-hover"><ArrowL /></button>
        <h1 className="flex-1 text-center font-semibold">Let’s create your account</h1><span className="w-9" />
      </div>
      <div className="p-6 overflow-y-auto">
        <p className="text-sm text-muted mb-5">This information is required to book or host.</p>
        <div className="font-semibold text-sm mb-2">Legal name</div>
        <div className="border border-line rounded-lg overflow-hidden divide-y divide-line">
          <input className="w-full bg-transparent px-4 py-4 outline-none" placeholder="First name" value={f.first} onChange={(e) => setF({ ...f, first: e.target.value })} />
          <input className="w-full bg-transparent px-4 py-4 outline-none" placeholder="Last name" value={f.last} onChange={(e) => setF({ ...f, last: e.target.value })} />
        </div>
        <E k="first" /><E k="last" />
        <p className="text-xs text-muted mt-2">Make sure it matches the name on your government ID.</p>
        <div className="font-semibold text-sm mt-6 mb-2">Date of birth</div>
        <input type="date" className="field" value={f.dob} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setF({ ...f, dob: e.target.value })} /><E k="dob" />
        <div className="font-semibold text-sm mt-6 mb-2">Email</div>
        <input type="email" className="field" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /><E k="email" />
        <p className="text-xs text-muted mt-2">We’ll email you trip confirmations and receipts.</p>
        <div className="font-semibold text-sm mt-6 mb-2">Password</div>
        <input type="password" className="field" placeholder="Password (min. 8 characters)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><E k="password" />
        <div className="border border-line rounded-xl p-4 mt-6 text-sm">
          <p className="text-muted">Airbnb will send you promotions such as deals and marketing notifications. You can opt out at any time via account settings or within marketing emails.</p>
          <label className="flex items-center gap-3 mt-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-brand" checked={f.optOut} onChange={(e) => setF({ ...f, optOut: e.target.checked })} />I don’t want to receive Airbnb promotions.</label>
        </div>
        <p className="text-xs text-muted mt-5">By selecting <b>Agree and continue</b>, I agree to Airbnb’s Terms of Service, Payments Terms of Service and Nondiscrimination Policy, and acknowledge the Privacy Policy.</p>
        <E k="form" />
        <button onClick={submit} disabled={busy} className="btn-brand w-full py-3.5 text-base mt-5 disabled:opacity-60">{busy ? 'Creating account…' : 'Agree and continue'}</button>
      </div>
    </div>
  );
}
export default function Page() { return (<Suspense><AuthBackdrop><Inner /></AuthBackdrop></Suspense>); }
