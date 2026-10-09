import React from 'react';

type P = { className?: string };
const base = (c?: string) => ({ className: c, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24' });

export const LogoMark = ({ className = 'h-8 w-8' }: P) => (
  <svg aria-hidden className={`${className} fill-current`} viewBox="0 0 32 32">
    <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.011.315c0 4.656-3.57 7.806-8.5 7.806-3.136 0-5.385-1.306-6.5-3.321-1.115 2.015-3.364 3.321-6.5 3.321-4.93 0-8.5-3.15-8.5-7.806 0-1.282.355-2.613 1.096-4.045l.169-.32c1.077-2.025 5.215-10.74 7.126-14.545l.542-1.044C9.537 1.963 10.992 1 13 1h3zm0 2.5a2.1 2.1 0 0 0-1.782.973L13.68 5.5c-1.928 3.837-6.082 12.593-7.07 14.475C5.973 21.2 5.5 22.502 5.5 24.194c0 3.375 2.46 5.306 6 5.306 3.125 0 5-1.952 5-4.887 0-.46-.057-.91-.168-1.343l-.066-.231a5.61 5.61 0 0 1-.266-.994c-.655-3.606 1.458-6.045 4-6.045 2.541 0 4.655 2.439 4 6.045a5.578 5.578 0 0 1-.332 1.225l-.066.231c-.111.433-.168.883-.168 1.343 0 2.935 1.875 4.887 5 4.887 3.54 0 6-1.931 6-5.306 0-1.692-.473-2.994-1.11-4.219-.988-1.882-5.142-10.638-7.07-14.475l-.538-1.027A2.1 2.1 0 0 0 16 3.5z" />
  </svg>
);
export const Search = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)} strokeWidth={3}><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
export const Menu = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)} strokeWidth={2.5}><path d="M4 6h16M4 12h16M4 18h16" /></svg>);
export const UserIcon = ({ className = 'h-5 w-5' }: P) => (<svg aria-hidden className={`${className} fill-current`} viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>);
export const Globe = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>);
export const Heart = ({ className = 'h-6 w-6', filled = false }: P & { filled?: boolean }) => (
  <svg className={className} viewBox="0 0 32 32" aria-hidden style={{ fill: filled ? '#FF385C' : 'rgba(0,0,0,0.5)', stroke: '#fff', strokeWidth: 2 }}>
    <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 7.1l-2.05-2.05A6.98 6.98 0 0 0 9 3a6.98 6.98 0 0 0-7 7c0 7 7 12.27 14 17z" />
  </svg>
);
export const Star = ({ className = 'h-3 w-3' }: P) => (<svg className={`${className} fill-current`} viewBox="0 0 24 24"><path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6L12 2z" /></svg>);
export const ChevL = ({ className = 'h-3.5 w-3.5' }: P) => (<svg {...base(className)} strokeWidth={2.5}><path d="M15 19l-7-7 7-7" /></svg>);
export const ChevR = ({ className = 'h-3.5 w-3.5' }: P) => (<svg {...base(className)} strokeWidth={2.5}><path d="M9 5l7 7-7 7" /></svg>);
export const ChevD = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)} strokeWidth={2.5}><path d="M19 9l-7 7-7-7" /></svg>);
export const Plus = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M12 5v14M5 12h14" /></svg>);
export const Minus = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M5 12h14" /></svg>);
export const Close = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)} strokeWidth={2.5}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const Check = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)} strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>);
export const Sun = ({ className = 'h-5 w-5' }: P) => (<svg {...base(className)} strokeWidth={2}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const Moon = ({ className = 'h-5 w-5' }: P) => (<svg {...base(className)}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>);
export const Share = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>);
export const Pin = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>);
export const Home = ({ className = 'h-5 w-5' }: P) => (<svg aria-hidden className={`${className} fill-current`} viewBox="0 0 24 24"><path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3l9-8z" /></svg>);
export const ArrowL = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)} strokeWidth={2.5}><path d="M19 12H5m6-7l-7 7 7 7" /></svg>);
export const Sliders = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>);
export const Bell = ({ className = 'h-5 w-5' }: P) => (<svg {...base(className)}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>);
export const Trash = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M3 6h18M8 6V4h8v2m-9 0l1 14h8l1-14" /></svg>);
export const Edit = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" /></svg>);
export const Grid = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
export const Map = ({ className = 'h-4 w-4' }: P) => (<svg {...base(className)}><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14m6-12v14" /></svg>);
