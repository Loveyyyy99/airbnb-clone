# Frontend

Next.js 14 (App Router) + TypeScript + Tailwind. See the [root README](../README.md) for setup, architecture and API docs.

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL → the FastAPI backend (default http://localhost:8000)
npm install
npm run dev                  # http://localhost:3000
npm run build                # production build + type-check
```

* `lib/api.ts` — typed fetch wrapper (bearer token), `lib/store.tsx` — session/wishlist/draft/theme state, `components/hooks.tsx` — `useFetch`.
* Dark theme by default; the sun/moon button in every header switches theme (remembered in `localStorage`).
