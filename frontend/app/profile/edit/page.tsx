'use client';
import { EditProfile } from '@/components/ProfileViews';
import { Shell } from '@/components/Shell';
import { useAuthGuard } from '@/components/ui';
export default function Page() { const { ready, user } = useAuthGuard(); if (!ready || !user) return null; return <Shell active="none" compact footer={false}><EditProfile base="/profile" /></Shell>; }
