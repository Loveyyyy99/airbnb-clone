import type { Activity } from './types';

const ALIAS: Record<string, string[]> = {
  gurugram: ['delhi', 'agra'],
  'gurgaon district': ['delhi', 'agra'],
  'north goa': ['goa'],
};

export const matchActivity = (a: Activity, where: string) => {
  const s = where.trim().toLowerCase();
  if (!s) return true;
  const head = s.split(',')[0].trim();
  const hay = `${a.city} ${a.title} ${a.location || ''}`.toLowerCase();
  if (hay.includes(head)) return true;
  return (ALIAS[head] || []).some((x) => hay.includes(x));
};
