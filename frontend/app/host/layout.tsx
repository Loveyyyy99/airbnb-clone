'use client';
import React from 'react';
import { useAuthGuard } from '@/components/ui';

export default function HostLayout({ children }: { children: React.ReactNode }) {
  const { ready, user } = useAuthGuard();
  if (!ready || !user) return <div className="min-h-screen" />;
  return <>{children}</>;
}
