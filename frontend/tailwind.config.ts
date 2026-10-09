import type { Config } from 'tailwindcss';

const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        surface2: v('surface2'),
        hover: v('hover'),
        line: v('line'),
        line2: v('line2'),
        fg: v('fg'),
        muted: v('muted'),
        brand: '#FF385C',
        'brand-dark': '#E00B41',
      },
      fontFamily: {
        sans: ['Circular', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        pill: '0 3px 12px rgba(0,0,0,0.12)',
        pop: '0 6px 24px rgba(0,0,0,0.22)',
        card: '0 12px 32px rgba(0,0,0,0.14), 0 2px 6px rgba(0,0,0,0.06)',
      },
      maxWidth: { page: '1760px' },
    },
  },
  plugins: [],
};
export default config;
