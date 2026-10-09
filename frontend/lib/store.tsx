'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, ApiError, errMsg, getToken, setToken } from './api';
import type { Draft, GuestCount, Listing, Profile, SearchState, User } from './types';

type Theme = 'dark' | 'light';

export const emptyProfile: Profile = {
  school: '', work: '', dream: '', pets: '', decade: '', fun: '', song: '', skill: '', time: '', languages: '',
  intro: '', interests: [], stamps: true,
};

export const newDraft = (): Draft => ({
  id: 'draft', step: 1, kind: 'House', place: 'entire', address: 'Maharaja Agarsen Marg, New Delhi, Delhi 110019, India',
  city: 'New Delhi', state: 'Delhi', area: 'Maharaja Agarsen Marg', pin: '110019', precise: false, guests: 4, bedrooms: 1, beds: 1, baths: 1,
  amenities: [], photos: [], title: '', highlights: [], description: '', instantBook: false, price: 2782, weekend: 4,
  discounts: ['new', 'weekly', 'monthly'], safety: [], cameraNote: '', business: null, street: '', flat: '', landmark: '', locality: '',
});

export const emptyGuests: GuestCount = { adults: 0, children: 0, infants: 0, pets: 0 };

interface AuthPayload { token: string; user: User }
export interface SignupInput { firstName: string; lastName: string; email: string; password: string; dob?: string }

interface Ctx {
  ready: boolean;
  theme: Theme;
  toggleTheme: () => void;
  user: User | null;
  checkEmail: (email: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<User>;
  signup: (u: SignupInput) => Promise<User>;
  demoLogin: (provider: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  becomeHost: () => Promise<void>;
  hosting: boolean;
  setHosting: (b: boolean) => void;
  wishlist: string[];
  toggleWish: (id: string) => void;
  draft: Draft | null;
  draftListingId: string | null;
  startDraft: (fromListing?: Listing) => Promise<Draft | null>;
  patchDraft: (p: Partial<Draft>) => void;
  discardDraft: () => Promise<void>;
  publishDraft: () => Promise<Listing | null>;
  flushDraft: () => Promise<void>;
  profile: Profile;
  patchProfile: (p: Partial<Profile>) => void;
  updateUser: (p: { firstName?: string; lastName?: string; avatarUrl?: string }) => Promise<void>;
  search: SearchState;
  setSearch: (p: Partial<SearchState>) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
}

const C = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(C);
  if (!c) throw new Error('AppProvider missing');
  return c;
};

const activityType = (id: string) => (id.startsWith('svc-') ? 'service' : id.startsWith('exp-') ? 'experience' : 'listing');

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<User | null>(null);
  const [hosting, setHostingState] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftListingId, setDraftListingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [search, setSearchState] = useState<SearchState>({ where: '', checkIn: '', checkOut: '', guests: emptyGuests });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const draftTimer = useRef<ReturnType<typeof setTimeout>>();
  const draftRef = useRef<Draft | null>(null);
  const draftListingRef = useRef<string | null>(null);
  const profTimer = useRef<ReturnType<typeof setTimeout>>();

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const loadSession = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [me, wl, dr] = await Promise.all([
        api.get<User>('/auth/me'),
        api.get<{ ids: string[] }>('/wishlist'),
        api.get<{ step: number; listingId: string | null; data: Partial<Draft> } | null>('/host/draft').catch(() => null),
      ]);
      setUser(me);
      setWishlist(wl.ids);
      if (dr && dr.data && Object.keys(dr.data).length) {
        const d = { ...newDraft(), ...dr.data, step: dr.step } as Draft;
        draftRef.current = d; draftListingRef.current = dr.listingId;
        setDraft(d); setDraftListingId(dr.listingId);
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setToken(null);
    }
  }, []);

  useEffect(() => {
    try {
      const t = localStorage.getItem('airbnb-theme') as Theme | null;
      setTheme(t === 'light' ? 'light' : 'dark');
      setHostingState(sessionStorage.getItem('airbnb-hosting') === '1');
    } catch {}
    loadSession().finally(() => setReady(true));
  }, [loadSession]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    try { localStorage.setItem('airbnb-theme', theme); } catch {}
  }, [theme]);

  const setHosting = (b: boolean) => {
    setHostingState(b);
    try { sessionStorage.setItem('airbnb-hosting', b ? '1' : '0'); } catch {}
  };

  const applyAuth = async (r: AuthPayload) => {
    setToken(r.token);
    setUser(r.user);
    try {
      const wl = await api.get<{ ids: string[] }>('/wishlist');
      setWishlist(wl.ids);
    } catch {}
    try {
      const dr = await api.get<{ step: number; listingId: string | null; data: Partial<Draft> } | null>('/host/draft');
      if (dr && dr.data && Object.keys(dr.data).length) {
        const d = { ...newDraft(), ...dr.data, step: dr.step } as Draft;
        draftRef.current = d; draftListingRef.current = dr.listingId; setDraft(d); setDraftListingId(dr.listingId);
      }
    } catch {}
    return r.user;
  };

  const checkEmail = async (email: string) => (await api.post<{ exists: boolean }>('/auth/check', { email })).exists;
  const login = async (email: string, password: string) => applyAuth(await api.post<AuthPayload>('/auth/login', { email, password }));
  const signup = async (u: SignupInput) => applyAuth(await api.post<AuthPayload>('/auth/signup', u));
  const demoLogin = async (provider: string) => applyAuth(await api.post<AuthPayload>('/auth/demo', { provider: provider.toLowerCase() }));
  const logout = () => {
    setToken(null);
    setUser(null); setWishlist([]); setDraft(null); setDraftListingId(null); draftRef.current = null; draftListingRef.current = null;
    setHosting(false);
  };
  const refreshUser = async () => { try { setUser(await api.get<User>('/auth/me')); } catch {} };
  const becomeHost = async () => { setUser(await api.post<User>('/auth/me/become-host')); };

  const toggleWish = (id: string) => {
    if (!user) {
      toast('Log in to save places to your wishlist');
      if (typeof window !== 'undefined') window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      return;
    }
    const has = wishlist.includes(id);
    setWishlist((w) => (has ? w.filter((x) => x !== id) : [...w, id]));
    const call = has
      ? api.del(`/wishlist/${activityType(id)}/${id}`)
      : api.put('/wishlist', { itemType: activityType(id), itemId: id });
    call.then(() => toast(has ? 'Removed from wishlist' : 'Saved to wishlist')).catch((e) => {
      setWishlist((w) => (has ? [...w, id] : w.filter((x) => x !== id)));
      toast(errMsg(e));
    });
  };

  // ── host wizard draft: kept in state, autosaved (debounced) to the server
  const saveDraftNow = useCallback(async () => {
    clearTimeout(draftTimer.current);
    const d = draftRef.current;
    if (!d) return;
    try {
      await api.put('/host/draft', { step: d.step, listingId: draftListingRef.current, data: d });
    } catch (e) {
      toast(errMsg(e));
    }
  }, [toast]);

  const startDraft = async (from?: Listing) => {
    if (!user) return null;
    const d = newDraft();
    let lid: string | null = null;
    if (from) {
      const full = await api.get<Listing & { discounts?: string[]; safety?: string[]; cameraNote?: string | null; businessHost?: boolean | null; preciseLocation?: boolean; address?: string | null }>(`/host/listings/${from.id}`);
      lid = full.id;
      const street = (full.address || '').split(',')[0] || '';
      Object.assign(d, {
        kind: full.kind === 'Home' ? 'House' : full.kind === 'Flat' ? 'Flat/apartment' : full.kind, place: full.place,
        city: full.city, state: full.state, area: full.area, address: full.address || `${full.area}, ${full.city}, ${full.state}, India`,
        street, pin: full.pin || '', precise: !!full.preciseLocation, guests: full.maxGuests, bedrooms: full.bedrooms, beds: full.beds,
        baths: full.baths, amenities: full.amenities, photos: full.images, title: full.title, description: full.description,
        instantBook: full.instantBook, price: full.price, weekend: full.weekend ?? 0, discounts: full.discounts ?? [], safety: full.safety ?? [],
        cameraNote: full.cameraNote || '', business: full.businessHost ?? false, step: 1,
      });
    }
    draftRef.current = d; draftListingRef.current = lid;
    setDraft(d); setDraftListingId(lid);
    await saveDraftNow();
    return d;
  };

  const patchDraft = (p: Partial<Draft>) => {
    const cur = draftRef.current;
    if (!cur) return;
    const next = { ...cur, ...p };
    draftRef.current = next;
    setDraft(next);
    clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(saveDraftNow, 600);
  };

  const discardDraft = async () => {
    clearTimeout(draftTimer.current);
    draftRef.current = null; draftListingRef.current = null;
    setDraft(null); setDraftListingId(null);
    try { await api.del('/host/draft'); } catch {}
  };

  const publishDraft = async () => {
    if (!draftRef.current) return null;
    await saveDraftNow();
    const l = await api.post<Listing>('/host/draft/publish');
    draftRef.current = null; draftListingRef.current = null;
    setDraft(null); setDraftListingId(null);
    await refreshUser();
    return l;
  };

  const patchProfile = (p: Partial<Profile>) => {
    setUser((u) => (u ? { ...u, profile: { ...u.profile, ...p } } : u));
    clearTimeout(profTimer.current);
    profTimer.current = setTimeout(() => {
      setUser((u) => {
        if (u) api.patch('/auth/me', { profile: u.profile }).catch((e) => toast(errMsg(e)));
        return u;
      });
    }, 500);
  };

  const updateUser: Ctx['updateUser'] = async (p) => { setUser(await api.patch<User>('/auth/me', p)); };

  const value: Ctx = {
    ready, theme, toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), user, checkEmail, login, signup, demoLogin, logout,
    refreshUser, becomeHost, hosting, setHosting, wishlist, toggleWish, draft, draftListingId, startDraft, patchDraft, discardDraft,
    publishDraft, flushDraft: saveDraftNow, profile: user?.profile ?? emptyProfile, patchProfile, updateUser,
    search, setSearch: (p) => setSearchState((x) => ({ ...x, ...p })), toast, toastMsg,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
