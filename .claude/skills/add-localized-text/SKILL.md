---
name: add-localized-text
description: Use when asked to add new hr/en bilingual text anywhere on the K-Drive site — decides whether it belongs in the admin-editable SiteContent model or as a static inline ternary, since this codebase has no i18n library and mixes both approaches deliberately.
---

# Add Localized (hr/en) Text

K-Drive has no i18n library (no i18next/react-intl). There are two legitimate patterns — pick based on whether the text should be admin-editable:

## 1. Content the business owner should be able to edit

(headlines, descriptions, button labels tied to site sections, service names, review text, etc.)

This goes through the `SiteContent` model — see the `.claude/skills/add-content-field/` skill for the full checklist. In short: type it as `Localized` in `src/content/types.ts`, give it a default in `content.seed.json`, edit it via `<LocalizedField>` in `Dashboard.tsx`, render it with `t(value)` from `useLanguage()`.

## 2. Static UI chrome that never changes

(aria-labels, "Open menu"/"Close menu", form field placeholders, status messages like "Sending...")

Use an inline ternary directly at the call site, matching existing code:

```tsx
const { lang } = useLanguage()
// ...
aria-label={lang === 'hr' ? 'Zatvori izbornik' : 'Close menu'}
```

There is no central strings file for this category by design — every existing static string in `App.tsx`/`admin/*.tsx` follows this inline pattern. Do not introduce a new translation-file mechanism for a single string; match what's already there.

## Deciding which one

Ask: "would the shop owner ever want to change this wording without a code deploy?" If yes → content model (§1). If it's pure UI mechanics/accessibility text → inline ternary (§2).
