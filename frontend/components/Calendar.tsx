'use client';
import React, { useMemo, useState } from 'react';
import { addDays, cn, fromISO, MONTHS, toISO, today } from '@/lib/utils';
import { ChevL, ChevR } from './Icons';

interface Props {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
  blocked?: [string, string][];
  months?: number;
  single?: boolean;
  initialMonth?: string;
}

export function Calendar({ start, end, onChange, blocked = [], months = 2, single = false, initialMonth }: Props) {
  const t = today();
  const first = initialMonth ? fromISO(initialMonth) : start ? fromISO(start) : t;
  const [view, setView] = useState(new Date(first.getFullYear(), first.getMonth(), 1));
  const [hover, setHover] = useState('');
  const minISO = toISO(t);

  const nightBlocked = (d: string) => blocked.some(([a, b]) => a <= d && d < b);
  const rangeBlocked = (a: string, b: string) => blocked.some(([x, y]) => a < y && x < b);

  const pick = (d: string) => {
    if (single) return onChange(d, '');
    if (!start || end) return onChange(d, '');
    if (d <= start) return onChange(d, '');
    if (rangeBlocked(start, d)) return onChange(d, '');
    onChange(start, d);
  };

  const disabled = (d: string) => {
    if (d < minISO) return true;
    if (single) return false;
    if (start && !end && d > start) return rangeBlocked(start, d);
    return nightBlocked(d);
  };

  const shown = useMemo(() => Array.from({ length: months }, (_, i) => new Date(view.getFullYear(), view.getMonth() + i, 1)), [view, months]);
  const canPrev = view > new Date(t.getFullYear(), t.getMonth(), 1);

  return (
    <div className="select-none">
      <div className="flex gap-10 relative">
        <button type="button" aria-label="Previous month" disabled={!canPrev} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="absolute -left-1 top-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-hover disabled:opacity-25 disabled:hover:bg-transparent">
          <ChevL />
        </button>
        <button type="button" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="absolute -right-1 top-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-hover">
          <ChevR />
        </button>
        {shown.map((m, mi) => {
          const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
          const lead = m.getDay();
          return (
            <div key={mi} className={cn('flex-1 min-w-[250px]', mi > 0 && 'hidden md:block')}>
              <div className="text-center font-semibold text-[15px] h-8 flex items-center justify-center">
                {MONTHS[m.getMonth()]} {m.getFullYear()}
              </div>
              <div className="grid grid-cols-7 text-center text-xs text-muted mt-3 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (<div key={i} className="h-8 flex items-center justify-center">{d}</div>))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: lead }).map((_, i) => (<div key={'e' + i} />))}
                {Array.from({ length: days }).map((_, i) => {
                  const d = toISO(new Date(m.getFullYear(), m.getMonth(), i + 1));
                  const dis = disabled(d);
                  const isStart = d === start;
                  const isEnd = d === end;
                  const edge = isStart || isEnd;
                  const preview = !end && start && hover && d > start && d <= hover;
                  const inRange = (start && end && d > start && d < end) || preview;
                  const isToday = d === minISO;
                  const blockedDay = !single && d >= minISO && nightBlocked(d);
                  return (
                    <div key={d} className={cn('h-10 flex items-center justify-center', inRange && 'bg-hover', isStart && end && 'bg-gradient-to-r from-transparent to-hover', isEnd && 'bg-gradient-to-l from-transparent to-hover')}>
                      <button
                        type="button"
                        disabled={dis}
                        aria-label={d}
                        onMouseEnter={() => setHover(d)}
                        onClick={() => pick(d)}
                        className={cn(
                          'w-10 h-10 rounded-full text-sm font-medium flex items-center justify-center transition-colors',
                          edge ? 'bg-fg text-bg' : 'hover:border hover:border-fg',
                          dis && !edge && 'text-muted/40 cursor-not-allowed hover:border-transparent',
                          blockedDay && 'line-through',
                          isToday && !edge && 'underline underline-offset-4',
                        )}
                      >
                        {i + 1}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const weekendOf = () => {
  const t = today();
  const dow = t.getDay();
  const fri = addDays(t, dow <= 5 ? 5 - dow : 6);
  return [toISO(fri), toISO(addDays(fri, 2))] as const;
};
