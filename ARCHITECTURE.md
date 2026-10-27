# ARCHITECTURE.md — K-Drive Autoservis

Deep reference for the k-drive codebase. Read `CLAUDE.md` first for orientation.

## Table of Contents

1. [Overview](#1-overview)
2. [Directory Structure](#2-directory-structure)
3. [Server Route Reference](#3-server-route-reference)
4. [The Content / CMS Model](#4-the-content--cms-model)
5. [Admin Auth Flow](#5-admin-auth-flow)
6. [Pricing & the Anchor-Price Law](#6-pricing--the-anchor-price-law)
7. [Tuning Calculator](#7-tuning-calculator)
8. [Image Upload Pipeline](#8-image-upload-pipeline)
9. [i18n Approach](#9-i18n-approach)
10. [Theming](#10-theming)
11. [Security Measures](#11-security-measures)
12. [Environment Variables](#12-environment-variables)
13. [Deployment](#13-deployment)
14. [Known Quirks](#14-known-quirks)

---

## 1. Overview

K-Drive is a single Node/Express process that serves both a REST API and a built React SPA from one port. There is no separate frontend/backend deployment (unlike the sibling `udomi-frontend`/`udomi-backend` pair) — one Docker container, one port, one Postgres database (`kdrive_db`).

The entire site is one `SiteContent` JSON document (contact info, hero copy, services, tuning models, reviews, etc.), editable through a password-protected `/admin` SPA route, stored as a single row in Postgres. There are no "pages" or "posts" — just one object edited in place.

## 2. Directory Structure

```
server/
├── index.js          # Express app: helmet CSP, cookie-parser, mounts all routers, serves dist/ in prod
├── auth.js            # scrypt password hash/verify (admin password only)
├── db.js              # Postgres pool, schema init, seed, backfill, migration, content/session queries
├── env.js              # minimal .env loader (no dotenv dependency) — only sets vars not already in process.env
├── mailer.js           # nodemailer wrapper for the inquiry form
├── paths.js            # seedAssetsDir + uploadsDir path helpers (uploadsDir auto-created on import)
├── pricing.js          # server-authoritative anchor-price / price-history logic
├── rateLimit.js         # in-memory per-IP rate limiter factory
├── routes/
│   ├── auth.js         # login/logout/me/password — admin session management
│   ├── content.js      # GET/PUT the single SiteContent document
│   ├── upload.js       # image upload -> local disk (server/uploads)
│   ├── inquiry.js      # public contact form -> email
│   ├── health.js       # uptime check, touches DB
│   └── priceFeed.js    # public CSV/XML price list, machine-readable
├── seed-assets/        # default images bundled with the repo, copied into uploads/ on first boot
└── uploads/            # admin-uploaded images + copied seed assets, served at /uploads (mount as a volume in prod)

src/
├── App.tsx              # the entire public single-page site
├── PrivacyPolicy.tsx     # /privatnost route
├── main.tsx              # router setup: "/", "/privatnost", "/admin/*", each with its own Provider tree
├── api.ts                # typed fetch wrappers for every server route
├── content/types.ts       # SiteContent and all nested content types — the CMS schema
├── context/
│   ├── ContentContext.tsx # fetches SiteContent once, exposes {content, loading, error, refresh}
│   ├── LanguageContext.tsx # hr/en toggle, localStorage-persisted, t(Localized) resolver
│   └── ThemeContext.tsx   # light/dark toggle, localStorage-persisted (storageKey is per-tree, see §10)
├── admin/
│   ├── Admin.tsx          # checks /api/auth/me, renders Login or Dashboard
│   ├── Login.tsx          # password form
│   ├── Dashboard.tsx      # tabbed editor over the whole SiteContent draft, Save button calls PUT /api/content
│   ├── LocalizedField.tsx  # HR/EN paired input/textarea for any Localized value
│   └── ImageUploader.tsx   # file picker -> POST /api/upload -> sets the resulting URL
├── components/
│   ├── TuningCalculator.tsx # model/stage picker + animated HP/Nm readout (display only, see §7)
│   ├── BeforeAfterSlider.tsx
│   ├── LiveStatus.tsx       # open/closed indicator from content.schedule — currently unused, see §14
│   ├── Icon.tsx             # inline SVG icon set, IconName union is the single source of truth
│   ├── Decor.tsx            # decorative SVG motifs
│   ├── Reveal.tsx           # scroll-in-view animation wrapper
│   └── PasswordField.tsx    # show/hide toggle input, used in Login + Dashboard password change
└── lib/formatPrice.ts    # Intl.NumberFormat('hr-HR', EUR)
```

No path aliases — all imports are relative.

## 3. Server Route Reference

All routes are mounted under `/api/*` in `server/index.js`. None of this is behind the global prefix issue the sibling backend has — nginx for k-drive proxies the whole domain root to this one process, so no prefix-stripping is involved.

### Auth (`server/routes/auth.js`, mounted at `/api/auth`)

| Method | Path | Auth | Rate limit | Description |
|---|---|---|---|---|
| POST | `/login` | - | 10/15min/IP | Verifies password against the single `admin` row, creates a session, sets `k_drive_session` cookie |
| POST | `/logout` | - | - | Deletes the session row, clears cookie |
| GET | `/me` | - | - | `{ authenticated: boolean }` — validates the session cookie |
| POST | `/password` | 🔒 | 10/15min/IP | Verifies current password, re-hashes with a new salt |

### Content (`server/routes/content.js`, mounted at `/api/content`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | - | Returns the full `SiteContent` JSON |
| PUT | `/` | 🔒 | Replaces the content row. If `body.services.items` is present, runs `applyPriceChanges()` (§6) against the existing stored items before saving — anchor price/history can't be set directly by the client |

### Upload (`server/routes/upload.js`, mounted at `/api/upload`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | 🔒 | `multipart/form-data`, field `image`. Multer memory storage (buffers in RAM), 10MB limit, mimetype whitelist (jpeg/png/webp/gif), then written to `server/uploads/<timestamp>-<random>.<ext>`. Returns `{ url: "/uploads/<filename>" }` |

### Inquiry (`server/routes/inquiry.js`, mounted at `/api/inquiry`)

| Method | Path | Auth | Rate limit | Description |
|---|---|---|---|---|
| POST | `/` | - | 5/10min/IP | Public contact form. Honeypot field `website` (hidden via CSS; if filled, responds `{ok:true}` without sending mail). Validates `name`/`phone`/`vehicle` required. Emails `content.contact.email` via `mailer.js` |

### Health (`server/routes/health.js`, mounted at `/api/health`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | - | Runs a real `getContent()` query so a DB outage shows as unhealthy, not just "process alive" |

### Price Feed (`server/routes/priceFeed.js`, mounted at `/api`)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/price-feed.csv` | - | Machine-readable price list (Croatian headers: `naziv,cijena,sidrena_cijena,napomena`), only items with a `price` set |
| GET | `/price-feed.xml` | - | Same data as `<cjenik><stavka>...` XML |

Both are linked from the public footer and the admin "Usluge" tab, for integrations/compliance (a public, auditable price list).

## 4. The Content / CMS Model

End-to-end flow:

1. **Schema**: `src/content/types.ts` defines `SiteContent` — one big object: `contact`, `nav`, `hero`, `brands`, `reviews`, `schedule`, `tuning`, `beforeAfter`, `about`, `highlights`, `services`, `process`, `cta`, `footer`. Most user-facing text fields are `Localized = { hr: string; en: string }`.
2. **Seed**: `content.seed.json` at repo root is the default/initial value. `server/db.js`'s `init()` inserts it into the `content` table (`id=1`) if the table is empty.
3. **Read**: `GET /api/content` → `getContent()` → `SELECT data FROM content WHERE id = 1` → `JSON.parse`.
4. **Write**: `PUT /api/content` (admin-only) → `setContent()` → `JSON.stringify` → `UPDATE content SET data = ...`. Before saving, if `services.items` changed, prices are re-derived server-side (§6).
5. **Client consumption**: `ContentProvider` (`src/context/ContentContext.tsx`) fetches once on mount, exposes `{content, loading, error, refresh}` via `useContent()`. `App.tsx` reads straight from `content` — no caching layer, no React Query.
6. **Admin editing**: `Dashboard.tsx` loads content into local `draft` state, mutates it tab-by-tab (plain `setDraft` with spread-updates — no form library), and calls `saveContent(draft)` on explicit "Spremi promjene" (Save) or immediately after any image upload (`persist()` — images are never left un-saved, to avoid losing an uploaded file if the admin navigates away before hitting Save).

**Backfill on deploy**: `backfillMissingContentFields()` runs on every boot and copies any top-level key present in `content.seed.json` but missing from the stored row (handles "I added a new content section after this site was already deployed"). It additionally special-cases `reviews.items` (a nested field added after `reviews` itself shipped). This is NOT a generic deep merge — a newly added *nested* field anywhere else needs its own explicit case added to this function, or deployed sites silently keep the old shape until manually re-saved. See `.claude/skills/add-content-field/`.

**Seed images on deploy**: `seedUploadsFromSeedAssets()` runs on every boot (idempotent — only copies a file if it's not already at the destination), copying each file in `seed-assets/` into `uploadsDir` so `content.seed.json`'s `/uploads/*.jpg` references resolve without any external storage account. (Fixed 2026-10-27: this replaced an earlier `migrateLocalUploadsToR2()` that uploaded these same files to Cloudflare R2 instead — image storage is local disk now, see §8.)

## 5. Admin Auth Flow

Not JWT — a classic opaque session token:

1. `POST /api/auth/login` verifies the submitted password against the single `admin` row (`scryptSync` hash + salt, `timingSafeEqual` compare — see `server/auth.js`).
2. On success, `createSession()` inserts a random 32-byte hex token into `sessions` (7-day TTL) and the response sets cookie `k_drive_session` (`httpOnly`, `sameSite: lax`, `secure: req.secure`). **Fixed 2026-10-27**: this used to be `secure: process.env.NODE_ENV === 'production'`, which set `Secure` on the cookie even while serving plain HTTP (current deployment, pending DNS — see CLAUDE.md) — browsers silently refuse to store a `Secure` cookie over HTTP, so login would return 200 but the session would never actually persist. `req.secure` (backed by `app.set('trust proxy', 1)` + nginx's `X-Forwarded-Proto` header) adapts automatically once TLS is added in front.
3. `requireAuth` middleware (`server/routes/auth.js`) is applied per-route (`content.js` PUT, `upload.js` POST, `auth.js` POST /password) — it reads the cookie and calls `validateSession()`, which also deletes the session row if expired.
4. Client-side, `Admin.tsx` calls `GET /api/auth/me` on mount to decide whether to render `Login` or `Dashboard` — this is just UX gating; the real enforcement is server-side `requireAuth` on the mutating routes. The static SPA bundle for `/admin/*` is served to anyone (Express's catch-all `sendFile(dist/index.html)`), same as every other client route — there's no server-side check on the HTML/JS itself, only on the API calls it makes.

Admin password change: `POST /api/auth/password` re-verifies the current password, then re-hashes with a fresh salt (`updateAdminPassword`). The user's existing session is not invalidated (intentional — see code comment "Nakon promjene ostajete prijavljeni").

## 6. Pricing & the Anchor-Price Law

`server/pricing.js` implements an "anchor price" (sidrena cijena) mechanism matching EU/HR rules requiring a discount's reference price to be the lowest price charged in the preceding 30 days (not simply "the previous price").

- Each `ServiceItem` optionally has `price`, `anchorPrice`, and `priceHistory: {price, effectiveFrom}[]`.
- `applyPriceChanges(oldItems, newItems, todayStr)` runs server-side on every `PUT /api/content` that touches `services.items`. It:
  - ignores any client-supplied `anchorPrice`/`priceHistory` — these fields are always server-derived, so an admin (or a buggy client) cannot reset or fake the anchor price;
  - if `price` is unset, strips `anchorPrice` but keeps `priceHistory` (so re-adding a price later still has history);
  - if `price` is unchanged, carries forward the existing `anchorPrice`/`priceHistory` untouched;
  - if `price` changed, computes the new anchor via `computeAnchorPrice()` (lowest price active at any point in the last 30 days, where each history entry's "active" window runs from its own `effectiveFrom` to the next entry's `effectiveFrom`, or now for the latest), then appends `{price, effectiveFrom: today}` to history.
- The public price feed (`/api/price-feed.csv`/`.xml`) and the public site both show `anchorPrice ?? price` as "Sidrena cijena" alongside the current price — this is what makes the discount legally defensible, not just a UI nicety.

## 7. Tuning Calculator

`TuningCalculator.tsx` is **display-only** — it does not compute horsepower/torque from any formula or external data. Each `TuningModel` in admin-entered content has fixed `baseHp`/`baseNm`/`stage1Hp`/`stage1Nm`/`stage2Hp`/`stage2Nm` values (entered manually per vehicle model in the Dashboard "Tuning i radovi" tab). The component just looks up the selected model + stage and animates the number transition (`useAnimatedNumber`, cubic ease-out over 500ms). "Calculator" refers to the interactive picker UI, not a computation engine — there's no `priceFeed`-style dynamic pricing here, despite `server/routes/priceFeed.js` living in the same server.

## 8. Image Upload Pipeline

**Local disk storage (switched from Cloudflare R2 2026-10-27)** — no external account needed.

1. Admin picks a file in `ImageUploader.tsx` → `uploadImage()` (`src/api.ts`) → `POST /api/upload` as `multipart/form-data`.
2. `multer` (memory storage, 10MB limit, mimetype whitelist) buffers the file in RAM.
3. `server/routes/upload.js` writes the buffer to `uploadsDir` (`server/paths.js`) under a random key (`${Date.now()}-${random hex}${ext}`) and returns `{ url: "/uploads/<key>" }`.
4. `server/index.js` serves `uploadsDir` statically at `/uploads` — same-origin, no CDN.
5. The returned URL is stored as a plain string directly inside the relevant `SiteContent` field (e.g. `hero.image`, `process.steps[i].image`, etc.) — there is no separate media/assets table, images are just URLs embedded in the content JSON.
6. Dashboard calls `persist()` immediately after any image change (separate from the main "Save" button) specifically so an uploaded image is never lost if the admin navigates away before saving the rest of the form.
7. CSP in `server/index.js` allows `img-src 'self' data: blob:` — no third-party image origin needed since everything is same-origin now.

**Operational note**: `server/uploads` is bind-mounted as a Docker volume in production (`docker-compose.yml`) specifically so uploaded images survive `docker compose up --build`. If you ever move this off a single VPS (multiple replicas, ephemeral filesystem host like Render/Railway free tier), this local-disk approach breaks — re-introduce an object store at that point.

## 9. i18n Approach

No i18n library (no i18next, no react-intl). Two parallel mechanisms:

- **User-editable content**: every translatable piece of copy in `SiteContent` is typed `Localized = {hr: string; en: string}`, edited as paired HR/EN inputs via `LocalizedField.tsx` in the admin, and resolved at render time with `t(value)` from `useLanguage()` (`LanguageContext.tsx`), which just does `value[lang]`.
- **Static UI chrome** (button labels, aria-labels, form field labels that aren't part of editable content): inline ternaries directly in components, e.g. `lang === 'hr' ? 'Zatvori izbornik' : 'Close menu'`. There is no central translation file for this category — if you need a new static string, add the ternary at the call site, matching the existing pattern.

`lang` is `'hr' | 'en'`, defaults to `'hr'`, persisted in `localStorage` key `k-drive-lang`, and also sets `<html lang="...">`.

## 10. Theming

`ThemeContext.tsx` is a simple `light`/`dark` toggle persisted to `localStorage` and reflected as `data-theme` on `<html>`. Notably **two independent instances** are mounted in `main.tsx` with different `storageKey`s: `k-drive-theme` for the public site (`/` and `/privatnost`) and `k-drive-admin-theme` for `/admin/*` — switching theme in the admin panel does not affect the public site's stored preference and vice versa.

## 11. Security Measures

- `helmet` CSP restricts `script-src`/`style-src`/`font-src`/`img-src`/`frame-src` to self + the specific third parties actually used (Google Fonts, a Google Maps iframe embed). Images are same-origin only (`/uploads`, local disk) since the move off R2. `crossOriginEmbedderPolicy` is explicitly disabled because the Maps iframe doesn't send CORP headers.
- `app.set('trust proxy', 1)` — required because this app always sits behind nginx; without it, rate limiting and the `secure` cookie flag would key off the proxy's IP/protocol instead of the real client's.
- Rate limiting (`rateLimit.js`) is in-memory, per-process, resets on restart. Fine for a single-instance deploy; would under-count if ever scaled to multiple instances without a shared store.
- Inquiry form has a honeypot field (`website`) hidden via CSS; bots that fill every field get a fake success response instead of a clear rejection, so they don't learn to avoid the field.
- Login and password-change are both rate-limited (10 attempts/15min/IP).

## 12. Environment Variables

See `CLAUDE.md` for the full table. Loaded via `server/env.js`, a hand-rolled `.env` parser (no `dotenv` package) that only sets a var if it isn't already present in `process.env` — so real environment variables (e.g. injected by Docker/docker-compose) always win over a local `.env` file.

## 13. Deployment

**Live as of 2026-10-27** on the Contabo VPS at `217.76.62.35`, reachable over plain HTTP. DNS for `kdrive-autoservis.com` does not point here yet (currently resolves to `162.0.215.32`) — repointing it at the registrar is the one remaining manual step; everything server-side is ready. See `/var/www/CLAUDE.md` for the full cross-service picture and the DNS/TLS follow-up plan.

- `Dockerfile`: `node:20-alpine` (fixed 2026-10-27 — was `node:18-alpine`, which fails to build: Vite 8's rolldown bundler imports `node:util`'s `styleText`, added in Node 20.12, so the build step crashed with a `SyntaxError` on Node 18). `npm install`, `npm run build --if-present`, `EXPOSE 3000`, `CMD npm start`. The build step compiles the client into `dist/`, which `server/index.js` then serves statically alongside the API — one image, one process, one port. A `.dockerignore` was also added (didn't exist before) so `COPY . .` doesn't copy the host's `node_modules`/`dist` into the image on top of the fresh install.
- Root `/var/www/docker-compose.yml` runs this as service `kdrive-app`, `PORT=3000`. `DATABASE_URL` points at the shared `postgres-db` container's `kdrive_db` database (separate database from `udomi_db`, same Postgres server) with `?sslmode=disable` — this is a local, non-TLS Postgres, and `db.js`'s SSL check looks for that literal string to skip the TLS handshake it otherwise assumes for a managed provider. `server/uploads` is bind-mounted as a volume (`./k-drive/server/uploads:/app/server/uploads`) so uploaded images survive rebuilds. `ADMIN_PASSWORD` is set directly in that file (generated, not a placeholder) — rotate it there if needed, it's only read on first boot (when the `admin` table is empty).
- Root nginx: **`/var/www/nginx/conf.d/kdrive.conf`** (split out from the old shared `apps.conf` on 2026-10-27 — see CLAUDE.md) proxies `kdrive-autoservis.com` (and, via `listen 80 default_server`, any request by raw IP) → `kdrive-app:3000` for all paths — no path-splitting like the sibling udomi stack. Everything — static assets, `/admin`, and `/api/*` — goes through this one proxy_pass. HTTP only for now; no TLS/certbot block yet (blocked on DNS — see CLAUDE.md).
- R2 is no longer used (local disk storage, §8). SMTP is not yet configured — the contact form (`/api/inquiry`) returns a clean 500 to the visitor and logs the real reason server-side; nothing crashes, it just doesn't send email until `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`/`MAIL_FROM` are added.

## 14. Known Quirks

- `src/components/LiveStatus.tsx` (the open/closed indicator driven by `content.schedule`) is implemented but currently commented out of `App.tsx` in three places, with a note that opening hours aren't reliably confirmed yet. The admin "Live status" schedule editor in Dashboard's Kontakt tab is still fully functional and saved — just not rendered on the public site right now. Re-enabling it is a matter of uncommenting the `<LiveStatus>` usages and the import.
- A "vehicle quick filter" on the hero section is fully coded but commented out (`App.tsx`, search "Vehicle quick filter") — performance wasn't satisfactory per the inline comment.
- `backfillMissingContentFields()` is special-case code, not a generic recursive merge — see §4.
