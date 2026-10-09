'use client';
import React from 'react';
import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { useAuthGuard } from '@/components/ui';
import { useApp } from '@/lib/store';

export default function Page() {
  const { ready, user } = useAuthGuard();
  const { logout, toast } = useApp();
  if (!ready || !user) return null;
  const cards: [string, string, string][] = [['👤', 'Personal info', '/profile/edit'], ['🔒', 'Login & security', '/coming-soon?t=Login %26 security'], ['💳', 'Payments & payouts', '/coming-soon?t=Payments'], ['🔔', 'Notifications', '/coming-soon?t=Notifications'], ['🧳', 'Trips', '/trips'], ['🤍', 'Wishlists', '/wishlists']];
  return (
    <Shell active="none" compact>
      <div className="max-w-[1000px] mx-auto px-6 py-10">
        <h1 className="text-[32px] font-semibold tracking-tight">Account</h1>
        <p className="mt-1"><b>{user.firstName} {user.lastName}</b>, {user.email} · <Link href="/profile" className="underline font-semibold">Go to profile</Link></p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">{cards.map(([i, t, h]) => (<Link key={t} href={h} className="border border-line rounded-2xl p-6 bg-surface hover:shadow-card transition-shadow"><div className="text-3xl mb-8">{i}</div><div className="font-semibold">{t}</div></Link>))}</div>
        <button onClick={() => { logout(); toast('Logged out'); window.location.href = '/'; }} className="mt-10 underline font-semibold">Log out</button>
      </div>
    </Shell>
  );
}
