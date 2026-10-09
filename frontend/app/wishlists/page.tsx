'use client';
import React from 'react';
import Link from 'next/link';
import { ActivityCard, ListingCard } from '@/components/Cards';
import { Shell } from '@/components/Shell';
import { api } from '@/lib/api';
import { useFetch } from '@/components/hooks';
import { useAuthGuard } from '@/components/ui';
import { useApp } from '@/lib/store';
import type { Activity, Listing } from '@/lib/types';

export default function Page() {
  const { ready, user } = useAuthGuard();
  const { wishlist } = useApp();
  const { data, loading } = useFetch((signal) => api.get<{ listings: Listing[]; activities: Activity[] }>('/wishlist', undefined, signal), [user?.id], !!user);
  // `wishlist` (ids) updates instantly when a heart is toggled, so filter the loaded items by it
  const ls = (data?.listings ?? []).filter((l) => wishlist.includes(l.id));
  const as = (data?.activities ?? []).filter((a) => wishlist.includes(a.id));
  if (!ready || !user) return null;
  return (
    <Shell active="none" compact>
      <div className="container-page py-10">
        <h1 className="text-[32px] font-semibold tracking-tight mb-8">Wishlists</h1>
        {loading ? (<p className="text-muted">Loading…</p>) : ls.length + as.length === 0 ? (
          <div className="py-16"><div className="text-5xl mb-4">🤍</div><h2 className="text-xl font-semibold">Create your first wishlist</h2><p className="text-muted mt-1">As you search, tap the heart icon to save your favourite places and Experiences to a wishlist.</p><Link href="/search" className="inline-block mt-6 btn-dark px-6 py-3 text-sm">Start exploring</Link></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
            {ls.map((l) => (<ListingCard key={l.id} l={l} />))}
            {as.map((a) => (<ActivityCard key={a.id} a={a} />))}
          </div>
        )}
      </div>
    </Shell>
  );
}
