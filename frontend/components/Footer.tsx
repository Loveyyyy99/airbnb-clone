'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Globe } from './Icons';
import { LocaleModal } from './Header';

const cs = (t: string) => `/coming-soon?t=${encodeURIComponent(t)}`;
const COLS: [string, [string, string][]][] = [
  ['Support', ['Help Centre', 'Get help with a safety issue', 'AirCover', 'Anti-discrimination', 'Disability support', 'Cancellation options', 'Report neighbourhood concern'].map((x) => [x, cs(x)] as [string, string])],
  ['Hosting', [['Airbnb your home', '/hosting'], ['Airbnb your experience', cs('Airbnb your experience')], ['Airbnb your service', cs('Airbnb your service')], ...['AirCover for Hosts', 'Hosting resources', 'Community forum', 'Hosting responsibly', 'Join a free hosting class', 'Find a co-host', 'Refer a host'].map((x) => [x, cs(x)] as [string, string])]],
  ['Airbnb', ['2026 Summer Release', 'Newsroom', 'Careers', 'Investors', 'Airbnb.org emergency stays'].map((x) => [x, cs(x)] as [string, string])],
];

export function Footer() {
  const [locale, setLocale] = useState(false);
  return (
    <footer className="bg-bg border-t border-line2 mt-16 pt-12 pb-8 text-muted text-sm">
      <div className="container-page">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-line2">
          {COLS.map(([h, links]) => (
            <div key={h} className="space-y-3">
              <h3 className="font-semibold text-fg">{h}</h3>
              <ul className="space-y-3">
                {links.map(([l, href]) => (
                  <li key={l}><Link href={href} className="hover:underline hover:text-fg transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>© 2026 Airbnb, Inc.</span>·<Link href={cs('Privacy')} className="hover:underline">Privacy</Link>·<Link href={cs('Terms')} className="hover:underline">Terms</Link>·<Link href={cs('Company details')} className="hover:underline">Company details</Link>
          </div>
          <div className="flex items-center gap-6 text-fg font-medium">
            <button onClick={() => setLocale(true)} className="flex items-center gap-2 hover:underline"><Globe />English (IN)</button>
            <button onClick={() => setLocale(true)} className="hover:underline">₹ INR</button>
            <div className="flex items-center gap-4 text-muted">
              <Link aria-label="Facebook" href={cs('Facebook')} className="hover:text-fg"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.7V4.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.3H7.7V14h2.7v8h3.1z" /></svg></Link>
              <Link aria-label="X" href={cs('X')} className="hover:text-fg"><svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.8 3h3.1l-6.7 7.7L22 21h-6.2l-4.8-6.3L5.4 21H2.3l7.2-8.2L2 3h6.3l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" /></svg></Link>
              <Link aria-label="Instagram" href={cs('Instagram')} className="hover:text-fg"><svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg></Link>
            </div>
          </div>
        </div>
      </div>
      <LocaleModal open={locale} onClose={() => setLocale(false)} />
    </footer>
  );
}
