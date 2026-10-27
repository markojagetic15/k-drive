---
name: add-server-route
description: Use when asked to add a new backend/API endpoint to K-Drive — follows this codebase's specific Express route file conventions (router-per-file, requireAuth, rate limiting, Croatian error messages).
---

# Add a Server Route

K-Drive's Express routes live one file per concern under `server/routes/`, each exporting a default `Router()`, mounted in `server/index.js` with `app.use('/api/<name>', ...)`.

Steps:

1. Create `server/routes/<name>.js`:
   ```js
   import { Router } from 'express'
   const router = Router()
   router.get('/', async (req, res) => { /* ... */ })
   export default router
   ```

2. Mount it in `server/index.js` alongside the existing `app.use('/api/...', ...)` lines.

3. **Auth**: if the route mutates data or is otherwise admin-only, import `requireAuth` from `server/routes/auth.js` and add it as middleware: `router.post('/', requireAuth, async (req, res) => {...})`. Look at `content.js`'s `PUT /` or `upload.js`'s `POST /` for the pattern.

4. **Rate limiting**: if the route is public-facing and could be abused (login, forms), create a limiter with `createRateLimiter({windowMs, max})` from `server/rateLimit.js` at module scope (not per-request) and check `isRateLimited(req.ip)` at the top of the handler, returning `429` with a Croatian error message. See `inquiry.js` or `auth.js` for the pattern.

5. **Error responses**: this codebase returns `res.status(code).json({ error: '<Croatian message>' })` on failure — not English, not a generic error envelope. Match the tone/language of sibling routes (informal, user-facing Croatian, e.g. `'Pogrešna lozinka.'`). Never leak internal error details (stack traces, DB errors) to the client — log with `console.error` and return a generic message instead (see `inquiry.js`'s catch block for the pattern).

6. **DB access**: go through `server/db.js` — add a new exported query function there rather than calling `pool.query` directly from the route file (there is no `pool` export; `db.js` is the only module that touches Postgres directly).

7. **Client wrapper**: add a corresponding typed function in `src/api.ts` using the existing `request<T>()` helper, so components never call `fetch` directly.
