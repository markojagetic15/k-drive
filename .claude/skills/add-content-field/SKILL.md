---
name: add-content-field
description: Use when asked to add a new editable text/image/list field to the K-Drive site (a new section, a new stat, a new tuning model field, etc.) — walks through all the places a SiteContent field must be touched so it actually shows up and survives a redeploy.
---

# Add a Content Field

K-Drive's entire site is one `SiteContent` object (`src/content/types.ts`), stored as a single JSON row in Postgres. A new field needs changes in **five** places, not just the type:

1. **Type** — add the field to the relevant interface in `src/content/types.ts`. Use `Localized` (`{hr: string; en: string}`) for anything user-facing and translatable; plain `string`/`number` for admin-only or non-translated values (e.g. image URLs, icon names).

2. **Seed default** — add a real value for the field in `content.seed.json` at the repo root, matching the exact shape of the type. This is what new/local databases get seeded with.

3. **Admin editor** — add an input in the matching tab of `src/admin/Dashboard.tsx`:
   - Plain string/number → a `<div className="field">` with a controlled `<input>`, following the existing pattern (`setDraft({...draft, section: {...draft.section, field: value}})`).
   - Translatable text → use `<LocalizedField label="..." value={draft.section.field} onChange={...} />` (pass `multiline` for textareas).
   - Image → use `<ImageUploader label="..." value={...} onChange={(url) => persist({...})} />` — note it calls `persist()` (immediate save), not `setDraft()`, so an uploaded image is never lost before the next full Save.
   - Array item (like `highlights`, `reviews.items`, `tuning.models`) → copy the add/update/remove function triplet pattern already used for that array (e.g. `addHighlight`/`updateHighlight`/`removeHighlight`) and add an "+ Dodaj ..." button.

4. **Public render** — read the field in `src/App.tsx` (or the relevant component it renders), using `t(content.section.field)` for `Localized` values.

5. **Backfill for existing deployments** — if this field is nested inside an object that might already exist in production (not a brand-new top-level key), `server/db.js`'s `backfillMissingContentFields()` will NOT pick it up automatically — it only backfills missing *top-level* keys plus one hardcoded special case (`reviews.items`). Add an explicit check for your new nested field there too, following the `reviews.items` example, or existing deployed content will be missing it until someone manually re-saves that section in the admin panel.

Skip step 5 only if the field is a new top-level key in `SiteContent` (those ARE picked up generically) or if there are no existing production deployments to worry about yet.
