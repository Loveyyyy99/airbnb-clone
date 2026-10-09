# Deploy on Vercel (free) — with persistent data

You need: a GitHub account, a Vercel account, and a free Neon account (neon.tech) for the database.
Why Neon? Vercel functions have no persistent disk, so the SQLite file used for local development would reset. The backend switches to PostgreSQL automatically when `DATABASE_URL` is set; nothing else changes.

## 1. Database (2 minutes)
1. Create a project on **neon.tech** (or in Vercel → Storage → Postgres/Neon).
2. Copy the **connection string** (looks like `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`).

## 2. Push to GitHub
Push the whole folder (it contains `frontend/` and `backend/`) to a **public** repository.

## 3. Backend project
1. Vercel → **Add New → Project** → import the repo.
2. **Root Directory:** `backend`. Framework preset: *Other* (Vercel detects Python/FastAPI from `api/index.py` + `vercel.json`).
3. Environment variables:
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string |
   | `JWT_SECRET` | any long random string (32+ chars) |
   | `CORS_ORIGINS` | your frontend URL, e.g. `https://my-airbnb.vercel.app` (any `*.vercel.app` origin is also allowed) |
4. Deploy. Open `https://<backend>.vercel.app/api/health` → `{"status":"ok"}`.
   The first request creates the tables and seeds the demo data (88 stays, hosts, bookings, reviews) — it can take 10–30 s once; after that the data lives in Neon.

## 4. Frontend project
1. **Add New → Project** → same repo, **Root Directory:** `frontend`.
2. Environment variable `NEXT_PUBLIC_API_URL` = the backend URL from step 3 (no trailing slash).
3. Deploy, then open the site. Log in with `guest@demo.com` / `password123`.

If you change `NEXT_PUBLIC_API_URL`, redeploy the frontend (it is baked in at build time).

## Optional: seed from your own machine
```bash
cd backend && pip install -r requirements.txt
DATABASE_URL="postgresql://…" python -m app.seed          # add --reset to wipe and re-seed
```

## Troubleshooting
* *CORS error in the browser console* → add the exact frontend URL to `CORS_ORIGINS` and redeploy the backend.
* *Images upload fails with 413* → files must be under 4 MB (the UI shrinks large photos automatically).
* *Seed photos don't show* → they are hot-linked from the original design assets, so they need internet access.
