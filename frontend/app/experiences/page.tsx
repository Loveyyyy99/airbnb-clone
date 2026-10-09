'use client';
import React, { Suspense } from 'react';
import { ActivityCard, CardSkeleton, Row } from '@/components/Cards';
import { useSyncSearch, parseFilters } from '@/components/hooks';
import { Inspiration } from '@/components/Inspiration';
import { Shell } from '@/components/Shell';
import { api } from '@/lib/api';
import type { Activity } from '@/lib/types';
import { useFetch } from '@/components/hooks';
import Link from 'next/link';

function Inner() {
  const sp = useSyncSearch();
  const f = parseFilters(sp);
  const searching = !!(f.where || f.checkIn || f.guests.adults);
  const { data, loading, error } = useFetch((signal) => api.get<{ items: Activity[] }>('/activities', { kind: 'experience', where: searching ? f.where : '' }, signal), [searching ? f.where : '']);
  const all = data?.items ?? [];
  const by = (s: string) => all.filter((e) => e.section === s);
  const results = all;
  const sk = Array.from({ length: 7 }, (_, i) => <CardSkeleton key={i} />);
  const cards = (xs: Activity[]) => (loading ? sk : xs.map((a) => (<ActivityCard key={a.id} a={a} />)));
  return (
    <Shell active="experiences">
      <div className="container-page py-8 space-y-12">
        {error && <p className="text-sm text-[#C13515]">{error}</p>}
        {searching ? (
          <section>
            <h2 className="text-[22px] font-semibold mb-1">{loading ? 'Searching…' : `${results.length} experience${results.length === 1 ? '' : 's'}`}{f.where ? ` in ${f.where}` : ''}</h2>
            <p className="text-sm text-muted mb-6">{f.checkIn ? 'Available on your selected date' : 'Any date'}{f.guests.adults + f.guests.children ? ` · ${f.guests.adults + f.guests.children} guests` : ''}</p>
            {loading ? (<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">{sk}</div>) : results.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
                {results.map((a) => (<ActivityCard key={a.id} a={a} />))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <h3 className="text-xl font-semibold">No experiences found</h3>
                <p className="text-muted mt-2">Try a different destination such as Chandigarh, Shimla or New Delhi.</p>
                <Link href="/experiences" className="inline-block mt-6 btn-dark px-6 py-3">Clear search</Link>
              </div>
            )}
          </section>
        ) : (
          <>
            <Row title="Experiences this weekend" cols={7}>{cards(by('weekend'))}</Row>
            <Row title="Airbnb Originals" sub="Hosted by the world’s most interesting people" cols={7}>{cards(by('original'))}</Row>
            <Row title="All experiences in Patiala" href="/experiences?where=Chandigarh">{cards(by('patiala'))}</Row>
            <section className="space-y-8">
              <h2 className="text-[22px] font-semibold tracking-tight">Popular with travellers from your area</h2>
              <Row title="Experiences in Gurgaon District" href="/experiences?where=Delhi">{cards(by('popular').slice(0, 7))}</Row>
              <Row title="Experiences in Rishikesh" href="/experiences?where=Rishikesh">{cards(by('popular').slice(7))}</Row>
            </section>
          </>
        )}
        <Inspiration />
      </div>
    </Shell>
  );
}

export default function Page() {
  return (<Suspense><Inner /></Suspense>);
}
