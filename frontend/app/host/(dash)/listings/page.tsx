'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Grid, Plus, Trash, Edit } from '@/components/Icons';
import { Img, Modal } from '@/components/ui';
import { ASSETS } from '@/lib/data';
import { useFetch } from '@/components/hooks';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { Listing } from '@/lib/types';
import { cn, inr } from '@/lib/utils';

export default function Listings() {
  const { draft, draftListingId, startDraft, discardDraft, toast, user } = useApp();
  const router = useRouter();
  const { data, setData, loading, error } = useFetch((s) => api.get<Listing[]>('/host/listings', undefined, s), [user?.id], !!user);
  const myListings = data ?? [];
  const [list, setList] = useState(false);
  const [del, setDel] = useState<Listing | null>(null);
  const [delDraft, setDelDraft] = useState(false);
  const [busy, setBusy] = useState(false);
  const add = async () => { await startDraft(); router.push('/host/setup/1'); };
  const edit = async (l: Listing) => {
    try { await startDraft(l); router.push('/host/setup/1'); } catch (e) { toast(errMsg(e)); }
  };
  const remove = async () => {
    if (!del) return;
    setBusy(true);
    try {
      await api.del(`/host/listings/${del.id}`);
      setData((x) => (x ? x.filter((o) => o.id !== del.id) : x));
      toast('Listing deleted');
      setDel(null);
    } catch (e) { toast(errMsg(e)); }
    setBusy(false);
  };
  return (
    <div className="container-page py-10 max-w-[1280px]">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[32px] font-semibold tracking-tight">Your listing{myListings.length + (draft ? 1 : 0) > 1 ? 's' : ''}</h1>
        <div className="flex items-center gap-2">
          <button aria-label="Toggle view" onClick={() => setList(!list)} className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:bg-hover"><Grid /></button>
          <button aria-label="Add new listing" onClick={add} className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:bg-hover"><Plus /></button>
        </div>
      </div>
      {loading ? (<p className="text-muted py-10">Loading your listings…</p>) : error ? (<p className="text-[#C13515] py-10">{error}</p>) : !draft && myListings.length === 0 ? (
        <div className="py-20 text-center"><div className="text-6xl mb-4">🏡</div><h2 className="text-xl font-semibold">You don’t have any listings yet</h2><p className="text-muted mt-1">Create your first listing to start hosting.</p><button onClick={add} className="mt-6 btn-dark px-6 py-3 text-sm">Create listing</button></div>
      ) : (
        <div className={cn(list ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8')}>
          {draft && (
            <div className={cn('group', list && 'flex gap-5 items-center border border-line rounded-2xl p-3 bg-surface')}>
              <button onClick={() => router.push(`/host/setup/${draft.step}`)} className={cn('relative block text-left', list ? 'w-48 shrink-0' : 'w-full')}>
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface2 border border-line2"><Img src={draft.photos[0] || ASSETS.hostList} alt="Draft listing" className="w-full h-full object-cover" /></div>
                <span className="absolute top-3 left-3 bg-bg text-fg text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#E07912]" />Action required</span>
              </button>
              <div className={cn('flex-1', !list && 'mt-3')}>
                <h2 className="font-semibold">{draft.title || (draftListingId ? 'Listing changes in progress' : 'Your draft listing')}</h2>
                <p className="text-sm text-muted">{draft.kind === 'House' ? 'Home' : draft.kind} in {draft.city}, India</p>
                <div className="flex gap-3 mt-2 text-sm"><button onClick={() => router.push(`/host/setup/${draft.step}`)} className="font-semibold underline">Continue</button><button onClick={() => setDelDraft(true)} className="text-muted underline">Discard</button></div>
              </div>
            </div>
          )}
          {myListings.map((l) => {
            const n = l.bookingCount ?? 0;
            return (
              <div key={l.id} className={cn(list && 'flex gap-5 items-center border border-line rounded-2xl p-3 bg-surface')}>
                <Link href={`/rooms/${l.id}`} className={cn('relative block', list ? 'w-48 shrink-0' : 'w-full')}>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface2 border border-line2"><Img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" /></div>
                  <span className="absolute top-3 left-3 bg-bg text-fg text-xs font-semibold px-3 py-1.5 rounded-full shadow flex items-center gap-1.5"><span className={cn('w-2 h-2 rounded-full', l.status === 'published' ? 'bg-[#008A05]' : 'bg-muted')} />{l.status === 'published' ? 'Listed' : 'Unlisted'}</span>
                </Link>
                <div className={cn('flex-1', !list && 'mt-3')}>
                  <h2 className="font-semibold">{l.title}</h2>
                  <p className="text-sm text-muted">{l.kind === 'Home' ? 'Home' : l.kind} in {l.city}, India · {inr(l.price)} / night · {n} booking{n === 1 ? '' : 's'}</p>
                  <div className="flex gap-4 mt-2 text-sm"><button onClick={() => edit(l)} className="font-semibold underline flex items-center gap-1"><Edit className="h-3.5 w-3.5" />Edit</button><button onClick={() => setDel(l)} className="text-muted underline flex items-center gap-1"><Trash className="h-3.5 w-3.5" />Delete</button></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Modal open={!!del} onClose={() => setDel(null)} title="Delete listing" footer={<><button onClick={() => setDel(null)} className="underline font-semibold">Cancel</button><button disabled={busy} onClick={remove} className="bg-[#C13515] text-white font-semibold rounded-lg px-6 py-3 text-sm disabled:opacity-60">Delete</button></>}>
        <p>Delete <b>{del?.title}</b>? Its reservations will also be removed. This can’t be undone.</p>
      </Modal>
      <Modal open={delDraft} onClose={() => setDelDraft(false)} title="Discard draft" footer={<><button onClick={() => setDelDraft(false)} className="underline font-semibold">Keep</button><button onClick={async () => { await discardDraft(); setDelDraft(false); toast('Draft discarded'); }} className="btn-dark px-6 py-3 text-sm">Discard</button></>}>
        <p>Discard this unfinished listing?</p>
      </Modal>
    </div>
  );
}
