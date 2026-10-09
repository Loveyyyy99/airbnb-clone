'use client';
import { useEffect, useState } from 'react';
import { errMsg } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/store';
import { defaultFilters, Filters } from '@/lib/search';

export function parseFilters(p: URLSearchParams): Filters {
  const n = (k: string) => Number(p.get(k) || 0) || 0;
  return {
    ...defaultFilters,
    where: p.get('where') || '',
    checkIn: p.get('in') || '',
    checkOut: p.get('out') || '',
    guests: { adults: n('adults'), children: n('children'), infants: n('infants'), pets: n('pets') },
    category: p.get('cat') || 'all',
    minPrice: p.get('min') ? n('min') : 0,
    maxPrice: p.get('max') ? n('max') : defaultFilters.maxPrice,
    place: (p.get('place') as Filters['place']) || 'any',
    bedrooms: n('bedrooms'), beds: n('beds'), baths: n('baths'),
    kinds: p.get('kinds') ? p.get('kinds')!.split(',') : [],
    amenities: p.get('am') ? p.get('am')!.split(',') : [],
    instantBook: p.get('instant') === '1', selfCheckIn: p.get('self') === '1', freeCancel: p.get('cancel') === '1', favourite: p.get('fav') === '1',
    sort: (p.get('sort') as Filters['sort']) || 'recommended',
  };
}

export function useSyncSearch() {
  const sp = useSearchParams();
  const { setSearch } = useApp();
  const key = sp.toString();
  useEffect(() => {
    const f = parseFilters(new URLSearchParams(key));
    setSearch({ where: f.where, checkIn: f.checkIn, checkOut: f.checkOut, guests: f.guests });
  }, [key]); // eslint-disable-line
  return sp;
}

export function useFetch<T>(fn: (signal: AbortSignal) => Promise<T>, deps: unknown[], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    const ac = new AbortController();
    setLoading(true);
    setError('');
    fn(ac.signal)
      .then((d) => { if (!ac.signal.aborted) { setData(d); setLoading(false); } })
      .catch((e) => { if (!ac.signal.aborted && e?.name !== 'AbortError') { setError(errMsg(e)); setLoading(false); } });
    return () => ac.abort();
  }, [...deps, tick, enabled]); // eslint-disable-line
  return { data, setData, loading, error, reload: () => setTick((t) => t + 1) };
}
