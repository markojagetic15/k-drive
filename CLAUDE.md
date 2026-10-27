# CLAUDE.md — K-Drive Autoservis

Marketing site + lightweight CMS for a car workshop/tuning business (Dugo Selo, Croatia), deployed at kdrive-autoservis.com. Unrelated to the sibling `udomi-backend`/`udomi-frontend` repos in this VPS — separate business, separate database. Full reference: see `ARCHITECTURE.md` before non-trivial changes.

**Status (2026-10-27): live** on the Contabo VPS, reachable over plain HTTP at `http://217.76.62.35/` (DNS for `kdrive-autoservis.com` doesn't point here yet — see root `/var/www/CLAUDE.md`). Running via `docker compose up -d postgres-db kdrive-app nginx` from `/var/www`.

## Tech Stack

- **Client**: Vite 8 + React 19 + TypeScript + react-router-dom 7. No CSS framework (hand-written `App.css`/`admin.css`), no i18n library. **Needs Node ≥20.12** (Vite 8's rolldown bundler uses `node:util`'s `styleText`) — `package.json` now declares `engines.node`.
- **Server**: Express 5 + helmet + cookie-parser + multer, in the *same repo* under `server/`.
- **DB**: Postgres (`pg`), single table `content` holding the entire site as one JSON blob (row `id=1`), plus `admin` (one row) and `sessions`.
- **Images**: local disk (`server/uploads`, served at `/uploads`). Switched off Cloudflare R2 on 2026-10-27 — no external storage account needed; mount `server/uploads` as a volume in production so uploads survive rebuilds.
- **Email**: `nodemailer` via SMTP (Resend recommended) for the contact/inquiry form — **not yet configured** in this deployment (see below).

## Dev Commands

```bash
npm run dev          # client (Vite, :5173) + server (node --watch, :4000) concurrently
npm run dev:client    # Vite only
npm run dev:server    # Express only (node --watch server/index.js)
npm run build         # tsc -b && vite build -> dist/
npm start             # node server/index.js — serves dist/ AND the API from one process
npm run lint
npm run preview
```

In dev, Vite proxies `/api` (and legacy `/uploads`) to `http://localhost:4000` (see `vite.config.ts`). In prod, Express itself serves the built `dist/` as static files and falls back to `index.html` for client-side routing (`server/index.js`) — one process, one port.

## Required Env Vars

Copy `.env.example` to `.env` for local dev. In production these are set directly in `/var/www/docker-compose.yml`'s `kdrive-app` service:

| Var | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Seeds the single admin row on first boot if not already created. If unset, a random password is generated and printed to the server log once. Set in docker-compose (generated 2026-10-27) — only re-read if the `admin` table is empty, so changing it later requires also clearing that row. |
| `PORT` | Defaults to 4000 locally; docker-compose sets `3000`. |
| `DATABASE_URL` | Postgres connection string. Append `?sslmode=disable` for a local/non-TLS Postgres (what production uses — the shared `postgres-db` container); omit it for a managed provider (TLS required, connects with `rejectUnauthorized: false`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Required for the contact form (`/api/inquiry`) to actually send mail. **Not set in production yet** — inquiries still get validated/rate-limited but the email send fails with a clean, logged 500; nothing crashes. Add these to docker-compose when you have SMTP credentials (see `.env.example` for the Resend walkthrough). |

Image uploads need no env vars — local disk storage, see Tech Stack above.

## The Single-Content-Row Model

There is exactly **one** site's worth of content, stored as one JSON document in Postgres (`content.seed.json` → DB on first boot). There is no multi-page or multi-tenant structure — admin edits the whole `SiteContent` object (`src/content/types.ts`) through tabs in `src/admin/Dashboard.tsx`, and the public site (`src/App.tsx`) renders straight from it via `ContentContext`.

**Gotcha**: adding a new field to `SiteContent` requires updating `content.seed.json` too, or existing deployed rows won't have it. `server/db.js`'s `backfillMissingContentFields()` only special-cases top-level keys plus `reviews.items` — it is not a generic deep merge. See `.claude/skills/add-content-field/SKILL.md`.

## Auth Is Not JWT

Admin auth is a simple session token: `scrypt`-hashed password in the `admin` table, random token in `sessions` table, `httpOnly` cookie `k_drive_session` (see `server/auth.js`, `server/routes/auth.js`). Nothing to do with the sibling udomi-backend's JWT scheme — don't assume shared patterns.

Full reference: **ARCHITECTURE.md**.
