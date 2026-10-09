export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

export const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const today = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const nightsBetween = (a: string, b: string) =>
  Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON = MONTHS.map((m) => m.slice(0, 3));

export const fmtShort = (s: string) => {
  const d = fromISO(s);
  return `${d.getDate()} ${MON[d.getMonth()]}`;
};

export const fmtLong = (s: string) => {
  const d = fromISO(s);
  return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtRange = (a: string, b: string) => {
  if (!a) return '';
  if (!b) return fmtShort(a);
  const x = fromISO(a);
  const y = fromISO(b);
  if (x.getMonth() === y.getMonth()) return `${x.getDate()}–${y.getDate()} ${MON[x.getMonth()]}`;
  return `${fmtShort(a)} – ${fmtShort(b)}`;
};

export const rangesOverlap = (a1: string, a2: string, b1: string, b2: string) => a1 < b2 && b1 < a2;

export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);

export const code = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

export const rng = (seed: number) => {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const guestTotal = (g: { adults: number; children: number }) => g.adults + g.children;

export const guestLabel = (g: { adults: number; children: number; infants: number; pets: number }) => {
  const n = g.adults + g.children;
  if (n === 0) return 'Add guests';
  let s = `${n} guest${n > 1 ? 's' : ''}`;
  if (g.infants) s += `, ${g.infants} infant${g.infants > 1 ? 's' : ''}`;
  if (g.pets) s += `, ${g.pets} pet${g.pets > 1 ? 's' : ''}`;
  return s;
};

export const fees = (nightly: number, nights: number, discountPct = 0) => {
  const base = nightly * nights;
  const discount = Math.round((base * discountPct) / 100);
  const cleaning = Math.round(nightly * 0.18 / 10) * 10 + 250;
  const service = Math.round((base - discount + cleaning) * 0.14);
  return { base, discount, cleaning, service, total: base - discount + cleaning + service };
};
