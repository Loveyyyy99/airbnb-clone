'use client';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CardSkeleton, ListingCard } from '@/components/Cards';
import { FiltersModal } from '@/components/FiltersModal';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { parseFilters, useSyncSearch } from '@/components/hooks';
import { Grid, Map as MapIcon, Sliders } from '@/components/Icons';
import { MapPanel, MapPoint } from '@/components/MapPanel';
import { CATEGORIES } from '@/lib/data';
import { api } from '@/lib/api';
import { defaultFilters, Filters, fullQuery, toApiParams } from '@/lib/search';
import type { Listing } from '@/lib/types';
import { cn, fmtRange, guestLabel, nightsBetween } from '@/lib/utils';

const PAGE = 12;
interface Page { items: Listing[]; total: number; page: number; hasMore: boolean }

function Inner() {
  const sp = useSyncSearch();
  const router = useRouter();
  const f = useMemo(() => parseFilters(sp), [sp]);
  const key = sp.toString();
  const [open, setOpen] = useState(false);
  const [map, setMap] = useState(false);
  const [items, setItems] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [points, setPoints] = useState<MapPoint[]>([]);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const nights = f.checkIn && f.checkOut ? Math.max(1, nightsBetween(f.checkIn, f.checkOut)) : 1;
  const apply = (next: Filters) => router.replace(`/search?${fullQuery(next)}`);

  // first page whenever the query string changes
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true); setError(''); setPage(1);
    api.get<Page>('/listings', { ...toApiParams(f), page: 1, pageSize: PAGE }, ac.signal)
      .then((r) => { setItems(r.items); setTotal(r.total); setHasMore(r.hasMore); setLoading(false); })
      .catch((e) => { if (e?.name !== 'AbortError') { setError(e.message); setLoading(false); } });
    return () => ac.abort();
  }, [key]); // eslint-disable-line

  useEffect(() => {
    if (!map) return;
    const ac = new AbortController();
    api.get<MapPoint[]>('/listings/map', toApiParams(f), ac.signal).then(setPoints).catch(() => {});
    return () => ac.abort();
  }, [map, key]); // eslint-disable-line

  const loadMore = async () => {
    if (busy.current || !hasMore) return;
    busy.current = true; setMore(true);
    try {
      const r = await api.get<Page>('/listings', { ...toApiParams(f), page: page + 1, pageSize: PAGE });
      setItems((x) => [...x, ...r.items.filter((n) => !x.some((o) => o.id === n.id))]);
      setPage(r.page); setHasMore(r.hasMore); setTotal(r.total);
    } catch (e) { setError((e as Error).message); }
    busy.current = false; setMore(false);
  };
  const loadRef = useRef(loadMore);
  loadRef.current = loadMore;
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((e) => e[0].isIntersecting && loadRef.current(), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, [items.length, hasMore, map]);

  const activeCount = [f.place !== 'any', f.minPrice > 0, f.maxPrice < defaultFilters.maxPrice, f.bedrooms, f.beds, f.baths, f.kinds.length, f.amenities.length, f.instantBook, f.selfCheckIn, f.freeCancel, f.favourite].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header active="homes" />
      <div className="border-b border-line2 bg-bg">
        <div className="container-page flex items-center gap-4 py-3">
          <div className="flex-1 flex items-center gap-8 overflow-x-auto no-scrollbar">
            {CATEGORIES.map((c) => (
              <button key={c.id} onClick={() => apply({ ...f, category: c.id })} className={cn('flex flex-col items-center gap-1.5 pt-2 pb-2 border-b-2 min-w-[56px] transition-colors', f.category === c.id ? 'border-fg text-fg' : 'border-transparent text-muted hover:text-fg hover:border-line')}>
                <span className="text-2xl">{c.icon}</span>
                <span className="text-xs font-semibold whitespace-nowrap">{c.label}</span>
              </button>
            ))}
          </div>
          <button onClick={() => setOpen(true)} className="flex items-center gap-2 border border-line rounded-xl px-4 py-3 text-sm font-semibold hover:border-fg hover:bg-hover transition-colors shrink-0">
            <Sliders /> Filters{activeCount > 0 && <span className="bg-fg text-bg rounded-full w-5 h-5 text-xs flex items-center justify-center">{activeCount}</span>}
          </button>
          <select aria-label="Sort" value={f.sort} onChange={(e) => apply({ ...f, sort: e.target.value as Filters['sort'] })} className="hidden md:block bg-bg border border-line rounded-xl px-3 py-3 text-sm font-semibold outline-none hover:border-fg shrink-0">
            <option value="recommended">Recommended</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>
      <main className="flex-1 container-page py-6">
        <div className="flex items-end justify-between mb-6 w-full">
          <div className="w-full">
            <h1 className="text-lg font-semibold">{loading ? 'Searching…' : `${total} stay${total === 1 ? '' : 's'}`}{!loading && (f.where ? ` in ${f.where}` : ' to explore')}</h1>
            <p className="text-sm text-muted">
              {[f.checkIn ? fmtRange(f.checkIn, f.checkOut) : 'Any dates', f.guests.adults + f.guests.children ? guestLabel(f.guests) : 'Any guests'].join(' · ')}
            </p>
          </div>
          <button onClick={() => setMap(!map)} className="flex items-center gap-2 bg-fg text-bg rounded-full px-5 py-3 text-sm font-semibold hover:opacity-90">
            {map ? <><Grid /> Show list</> : <><MapIcon /> Show map</>}
          </button>
        </div>
        {error && <p className="text-[#C13515] mb-4">{error}</p>}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-10">{Array.from({ length: 10 }, (_, i) => <CardSkeleton key={i} />)}</div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-semibold">No exact matches</h2>
            <p className="text-muted mt-2">Try changing or removing some of your filters or adjusting your search area.</p>
            <div className="flex gap-3 justify-center mt-8">
              <button onClick={() => apply({ ...defaultFilters, where: f.where })} className="btn-dark px-6 py-3 text-sm">Remove filters</button>
              <Link href="/search" className="btn-outline px-6 py-3 text-sm">Clear search</Link>
            </div>
          </div>
        ) : (
          <div className={cn(map ? 'grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6' : '')}>
            <div className={cn('grid gap-x-6 gap-y-10', map ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 content-start' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5')}>
              {items.map((l) => (<ListingCard key={l.id} l={l} nights={nights} carousel />))}
            </div>
            {map && <div className="hidden lg:block sticky top-28 h-[calc(100vh-8rem)]"><MapPanel items={points} /></div>}
          </div>
        )}
        {!loading && hasMore && (
          <div ref={sentinel} className="py-12 text-center">
            <button onClick={loadMore} disabled={more} className="btn-dark px-6 py-3 text-sm disabled:opacity-60">{more ? 'Loading…' : 'Show more'}</button>
            <p className="text-sm text-muted mt-3">Continue exploring · {items.length} of {total}</p>
          </div>
        )}
      </main>
      <FiltersModal open={open} onClose={() => setOpen(false)} filters={f} onApply={apply} />
      <Footer />
    </div>
  );
}

export default function Page() {
  return (<Suspense><Inner /></Suspense>);
}
