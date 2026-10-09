'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shell } from '@/components/Shell';

function Inner() {
  const t = useSearchParams().get('t') || 'This page';
  return (
    <Shell active="none">
      <div className="max-w-xl mx-auto px-6 py-28 text-center">
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-semibold tracking-tight">{t}</h1>
        <p className="text-muted mt-3">This section is a placeholder in the demo and is coming soon.</p>
        <Link href="/" className="inline-block mt-8 btn-dark px-6 py-3 text-sm">Back to explore</Link>
      </div>
    </Shell>
  );
}
export default function Page() { return (<Suspense><Inner /></Suspense>); }
