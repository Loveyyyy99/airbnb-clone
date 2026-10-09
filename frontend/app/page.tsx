'use client';
import React from 'react';
import { Destinations } from '@/components/Destinations';
import { Inspiration } from '@/components/Inspiration';
import { CardSkeleton, ListingCard, Row } from '@/components/Cards';
import { Shell } from '@/components/Shell';
import { DESTINATIONS, HOME_ROWS } from '@/lib/data';
import { api } from '@/lib/api';
import { useFetch } from '@/components/hooks';
import type { Listing } from '@/lib/types';

export default function Landing() {
  const cities = HOME_ROWS.map((r) => r.city).join(',');
  const { data, error } = useFetch((signal) => api.get<Record<string, Listing[]>>('/listings/collections', { cities, limit: 7 }, signal), [cities]);
  return (
    <Shell active="all">
      <div className="container-page py-8 space-y-12">
        {error && <p className="text-sm text-[#C13515]">{error}</p>}
        {HOME_ROWS.map((r) => (
          <Row key={r.city} title={r.title} href={`/search?where=${encodeURIComponent(r.city)}`}>
            {data ? (data[r.city] || []).map((l) => (<ListingCard key={l.id} l={l} />)) : Array.from({ length: 7 }, (_, i) => <CardSkeleton key={i} />)}
          </Row>
        ))}
        <Destinations items={DESTINATIONS} />
        <Inspiration />
      </div>
    </Shell>
  );
}
