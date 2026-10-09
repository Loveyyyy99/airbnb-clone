'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { ActivityCard, CardSkeleton, Row } from '@/components/Cards';
import { useSyncSearch, parseFilters } from '@/components/hooks';
import { Shell } from '@/components/Shell';
import { api } from '@/lib/api';
import type { Activity } from '@/lib/types';
import { useFetch } from '@/components/hooks';

function Inner() {
  const sp = useSyncSearch();
  const f = parseFilters(sp);
  const type = sp.get('type') || '';
  const searching = !!(f.where || type || f.checkIn);
  const { data, loading, error } = useFetch((signal) => api.get<{ items: Activity[] }>('/activities', { kind: 'service', where: searching ? f.where : '', type }, signal), [searching ? f.where : '', type]);
  const results = data?.items ?? [];
  const sk = Array.from({ length: 7 }, (_, i) => <CardSkeleton key={i} />);
  const rows = ['Gurgaon District', 'New Delhi'];
  return (
    <Shell active="services" variant="services">
      <div className="container-page py-8 space-y-12">
        {error && <p className="text-sm text-[#C13515]">{error}</p>}
        {searching ? (
          <section>
            <h2 className="text-[22px] font-semibold mb-6">{loading ? 'Searching…' : `${results.length} service${results.length === 1 ? '' : 's'}`}{type ? ` · ${type}` : ''}{f.where ? ` in ${f.where}` : ''}</h2>
            {loading ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">{sk}</div>) : results.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
                {results.map((a) => (<ActivityCard key={a.id} a={a} />))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <h3 className="text-xl font-semibold">No services found</h3>
                <p className="text-muted mt-2">Try another type of service or destination.</p>
                <Link href="/services" className="inline-block mt-6 btn-dark px-6 py-3">Clear search</Link>
              </div>
            )}
          </section>
        ) : (
          rows.map((r) => (
            <Row key={r} title={`Services in ${r}`} href={`/services?where=${encodeURIComponent(r)}`}>
              {loading ? sk : results.filter((s) => s.section === r).map((a) => (<ActivityCard key={a.id} a={a} />))}
            </Row>
          ))
        )}
        <section className="border-t border-line2 pt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">Offer a service on Airbnb</h3>
            <p className="text-muted text-sm mt-1">Photographers, chefs, trainers and more can earn by hosting services.</p>
          </div>
          <Link href="/coming-soon?t=Airbnb your service" className="btn-dark px-6 py-3 text-sm">Airbnb your service</Link>
        </section>
      </div>
    </Shell>
  );
}

export default function Page() {
  return (<Suspense><Inner /></Suspense>);
}
