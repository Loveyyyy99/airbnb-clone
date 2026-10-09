'use client';
import React, { useState } from 'react';
import { Avatar } from '@/components/ui';
import { useFetch } from '@/components/hooks';
import { api, errMsg } from '@/lib/api';
import { useApp } from '@/lib/store';
import type { Thread } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function Messages() {
  const { user, toast } = useApp();
  const { data, setData, loading } = useFetch((s) => api.get<Thread[]>('/host/conversations', undefined, s), [user?.id], !!user);
  const threads = data ?? [];
  const [sel, setSel] = useState('');
  const [text, setText] = useState('');
  const t = threads.find((x) => x.id === sel) || null;
  const send = async () => {
    if (!t || !text.trim()) return;
    const body = text.trim();
    setText('');
    try {
      const upd = await api.post<Thread>(`/conversations/${t.id}/messages`, { text: body });
      setData((x) => (x ? x.map((o) => (o.id === upd.id ? upd : o)) : x));
    } catch (e) { toast(errMsg(e)); setText(body); }
  };
  return (
    <div className="grid md:grid-cols-[380px_1fr] h-[calc(100vh-5rem)]">
      <aside className="border-r border-line2 flex flex-col">
        <div className="p-6 flex items-center justify-between"><h1 className="text-[28px] font-semibold">Messages</h1></div>
        {loading ? (<div className="flex-1 flex items-center justify-center text-muted">Loading…</div>) : threads.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8"><div className="text-6xl mb-4">💬</div><h2 className="text-xl font-semibold">Your inbox is empty</h2><p className="text-muted text-sm mt-1">Come back soon for conversations with your guests.</p></div>
        ) : (
          <div className="flex-1 overflow-y-auto">{threads.map((x) => (<button key={x.id} onClick={() => setSel(x.id)} className={cn('w-full text-left px-6 py-4 flex gap-3 border-b border-line2 hover:bg-hover', sel === x.id && 'bg-hover')}><Avatar name={x.guest} color="#6366F1" /><div className="min-w-0"><div className="font-semibold">{x.guest}</div><div className="text-sm text-muted truncate">{x.messages[x.messages.length - 1].text}</div><div className="text-xs text-muted truncate">{x.listingTitle}</div></div></button>))}</div>
        )}
        <button onClick={() => (window.location.href = '/coming-soon?t=Past conversations')} className="px-6 py-5 border-t border-line2 text-left font-semibold flex justify-between hover:bg-hover">Past conversations <span>›</span></button>
      </aside>
      <section className="hidden md:flex flex-col">
        {t ? (
          <>
            <div className="p-5 border-b border-line2 font-semibold">{t.guest} <span className="text-muted font-normal text-sm">· {t.listingTitle}</span></div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3">{t.messages.map((m) => (<div key={m.id} className={cn('max-w-[70%] rounded-2xl px-4 py-2.5 text-sm', m.from === 'host' ? 'ml-auto bg-fg text-bg' : 'bg-surface2 border border-line2')}>{m.text}</div>))}</div>
            <div className="p-4 border-t border-line2 flex gap-3"><input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Write a message" className="field" /><button onClick={send} className="btn-dark px-6 text-sm">Send</button></div>
          </>
        ) : (<div className="flex-1 flex items-center justify-center text-muted">Select a conversation</div>)}
      </section>
    </div>
  );
}
