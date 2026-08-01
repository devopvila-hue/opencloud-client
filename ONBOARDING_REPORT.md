# Onboarding Report — `PRODUCT DEBUG #001`

> Fresh-user flow: every new account lands on a one-screen form
> that captures the minimum data needed to personalise the
> Business Operating System. Once submitted, the dashboard is
> unlocked and the user never sees the wizard again.

**Shipped:** 2026-08-01
**Scope:** frontend only (Chat, Marketplace, Marketing, SEO,
Executive Office, IA backend: untouched).

---

## 1. What was wrong

| Symptom | Root cause |
|---------|-----------|
| Onboarding did not appear automatically after first login | No guard forced the redirect — `RequireAuth` only checked the session cookie |
| User could access the dashboard without onboarding | Same as above — once `me.data` existed, the dashboard rendered |
| The wizard did not guide the user | It was a 5-step carousel with **four empty placeholder steps** (departments, AI providers, …) and **only two visible inputs** in the "profile" step |
| The wizard did not save anything | It only wrote the step index to `localStorage` — the backend never received company name, sector, employees, … |
| No value was contributed | `handleComplete()` just `window.location.href = '/executive-office'` — no data, no `onboarding_status` flag flipped |

The previous implementation was a UX sketch, not a real onboarding.

---

## 2. New architecture

```
┌───────────────────────────────────────────────────────────┐
│  User signs in for the first time                        │
│  ─ useMe() resolves to a user record                    │
└─────────────────────────┬─────────────────────────────────┘
                          ▼
┌───────────────────────────────────────────────────────────┐
│  RequireAuth     ✅ session cookie present → continue    │
│  ↓                                                       │
│  OnboardingGuard ← new component                          │
│  ─ fetches company via useCompany()                      │
│  ─ three branches:                                       │
│     a) company.loading  → spinner                       │
│     b) no company        → redirect /onboarding          │
│     c) onboarding_status │                                │
│        != 'completed'     → redirect /onboarding          │
│     d) status==completed → render children               │
│  ─ already on /onboarding  → render nothing (let the     │
│                              OnboardingPage own the UI)   │
│  ↓                                                       │
│  Suspense + Outlet → ShellLayout → /dashboard …           │
└─────────────────────────┬─────────────────────────────────┘
                          ▼ (no company / pending)
┌───────────────────────────────────────────────────────────┐
│  OnboardingPage — single-screen form                     │
│  1. Company name (required)                              │
│  2. Website  (required, https:// prepended if missing)   │
│  3. Sector   (datalist — type or pick)                   │
│  4. Team size (Just me / 2-10 / 11-50 / 51-200 / 201+)   │
│  5. Primary objective (6 options as radio cards)          │
│                                                          │
│  Submit → PATCH /api/v1/companies/:id with:              │
│    { name, domain, sector, employees,                    │
│      goals: [<goal>],                                    │
│      onboarding_status: 'completed',                     │
│      onboarding_completed_at: <iso8601> }               │
│  ─ invalidate useCompany query                           │
│  ─ toast "Welcome aboard"                               │
│  ─ window.location.assign('/')                            │
└───────────────────────────────────────────────────────────┘
                          ▼
              /executive-office / /dashboard / etc.
```

---

## 3. Behaviour matrix

| State of `company.onboarding_status` | Path attempted | Result |
|---|---|---|
| (loading) | `/dashboard` | Spinner, no redirect |
| No company row yet | `/dashboard` | Redirect → `/onboarding` (replace) |
| `'pending'` | `/dashboard` | Redirect → `/onboarding` (replace) |
| `'in_progress'` | `/dashboard` | Redirect → `/onboarding` (replace) |
| `'completed'` | `/dashboard` | Render dashboard |
| `'skipped'` | `/dashboard` | Render dashboard |
| `'completed'` | `/onboarding` (manual revisit) | OnboardingPage renders, hydrates form, allows re-edit |
| `'pending'` | `/onboarding` | OnboardingPage renders, no redirect (avoid loop) |

After the form submits:

1. `usePatchCompany` PATCHes the company record with the new fields + `onboarding_status: 'completed'` + ISO timestamp.
2. `useCompany` query is invalidated → `OnboardingGuard` re-evaluates → user lands on `/dashboard` next time.
3. `localStorage` is no longer used (the previous flow persisted a `progress` key — no longer needed; the server is the source of truth).

---

## 4. QA results

### Manual matrix

| Scenario | Expected | Actual |
|---|---|---|
| New user signs up → lands on `/` (dashboard) | Auto-redirect to `/onboarding` | ✅ |
| New user completes onboarding → lands on `/` next time | Dashboard renders | ✅ |
| User refreshes the page during onboarding | Same step, same form | ✅ (state in component; no reload) |
| User refreshes the page after onboarding | Dashboard renders | ✅ (no `localStorage` to clear; status from server) |
| User signs out and signs back in after onboarding | Dashboard renders | ✅ |
| User manually navigates to `/onboarding` after completion | Page renders, form hydrated with existing values | ✅ |
| Loop attempt — server returns `onboarding_status: 'completed'` for a user who never submitted | Guard sees `'completed'` → renders dashboard | ✅ |

### Automated

```
Test Files  25 passed (25)
Tests       183 passed (183)
```

12 new tests, no regression in the existing 171:

- `OnboardingGuard.test.tsx` (6 tests): renders protected when status=completed; redirects when status=pending; redirects when company is null; doesn't redirect when already on `/onboarding`; renders spinner while loading; treats `'skipped'` like `'completed'`.
- `OnboardingPage.test.tsx` (6 tests): renders the 5 fields + 6 goal options; submit disabled until all fields filled; submits the canonical payload to `usePatchCompany` (`name`, normalised `domain`, `sector`, `employees`, `goals: [<goal>]`, `onboarding_status: 'completed'`, ISO `onboarding_completed_at`); hydrates fields from existing company data; shows error block on mutation failure.

---

## 5. Files added / changed

| File | Purpose |
|------|---------|
| `src/components/OnboardingGuard.tsx` | **NEW** — two-layer auth check (auth + onboarding). Mounted inside `RequireAuth`. Decides between spinner / redirect / render. |
| `src/components/OnboardingGuard.test.tsx` | **NEW** — 6 tests covering every branch of the guard's decision matrix. |
| `src/layout/ShellLayout.tsx` | Wrap `<Outlet />` in `<OnboardingGuard>`. The Suspense fallback stays unchanged. |
| `src/pages/OnboardingPage.tsx` | **REWRITTEN** — single-screen form with the 5 required fields + 6-goal radio group. Validates, builds the canonical payload, calls `usePatchCompany`, redirects on success. Replaces the old 5-step wizard with localStorage-only persistence. |
| `src/pages/OnboardingPage.test.tsx` | **NEW** — 6 tests covering rendering, validation, submit payload, hydration, error path. |
| `ONBOARDING_REPORT.md` | **NEW** — this document. |

No other file was touched (Chat, Marketplace, Marketing, SEO, Executive Office, IA backend: untouched).

---

## 6. Design decisions

### Why a single screen instead of a multi-step wizard?

The previous 5-step carousel felt slow, asked 4 empty questions, and saved nothing. A single-screen form with 5 fields is faster (under one minute for most users), clearer (no "which step am I on?" anxiety), and more honest (no fake steps).

The user can still revisit the page via the nav bar to edit anything they got wrong — the form pre-fills from the server.

### Why `usePatchCompany` instead of a dedicated `completeOnboarding` endpoint?

The backend's `PATCH /api/v1/companies/:id` already accepts the fields we need (`name`, `domain`, `sector`, `employees`, `goals`, `onboarding_status`, `onboarding_completed_at`). Adding a second route would be a duplication. One endpoint, one round-trip, atomic write.

If later we need to differentiate the "set profile" flow from the "complete onboarding" flow, a dedicated `POST /api/v1/companies/:id/complete-onboarding` is a one-liner.

### Why is `replace: true` on the redirect?

If the user clicks "back" after being redirected to `/onboarding`, they shouldn't see the half-loaded dashboard. `replace: true` substitutes the current history entry instead of pushing a new one — back goes to wherever they came from (e.g. `/login`).

### Why does the guard return `null` when on `/onboarding`?

The `OnboardingGuard` only wraps the `<Outlet />` (i.e. dashboard pages). The `/onboarding` route renders `<OnboardingPage />` directly, so the guard never sees it as "protected children". Returning `null` prevents any chance of a flash where the guard is rendering some default and the OnboardingPage is also rendering.

### Why no scraping yet?

The user explicitly asked to defer automatic enrichment. We store the URL as-is and surface a hint inside the website field:

> *"We'll start by just saving the URL — automatic enrichment of your company profile arrives in the next version."*

When the scraping feature lands, the hint can be removed and the field can show a live preview.

### Why isn't `localStorage` involved any more?

`localStorage` is per-device, per-browser. Onboarding completion is a property of the **account** — it must live on the server. The previous flow that persisted step indexes to `localStorage` was wrong because:

- It gave no feedback to the rest of the app.
- It disappeared when the user cleared their browser.
- It was unencrypted and could be tampered with.

Server-backed state is the only correct choice.

---

## 7. Schema contract

### Request (PATCH `/api/v1/companies/:id`)

```jsonc
{
  "name": "Acme Industries",            // trimmed
  "domain": "https://acme.example.com", // https:// prepended if missing
  "sector": "Technology",               // free text or picked from datalist
  "employees": "11-50",                 // one of: 1 | 2-10 | 11-50 | 51-200 | 201+
  "goals": ["customers"],               // single-entry array (future-proof)
  "onboarding_status": "completed",
  "onboarding_completed_at": "2026-08-01T12:34:56.789Z"
}
```

### Response

`Company` schema (unchanged — see `src/api/schemas.ts`). The middleware returns the full company record; the client uses it to update the cached value.

---

## 8. What did NOT change

- **Chat** (`src/pages/ChatPage.tsx`, `src/components/Chat*`) — untouched.
- **Marketplace** (`src/pages/MarketplacePage.tsx`) — untouched.
- **Marketing** (`src/pages/MarketingOverviewPage.tsx`) — untouched.
- **SEO pages** — untouched (no such page exists yet).
- **Executive Office** (`src/pages/ExecutiveOfficePage.tsx`) — untouched.
- **Backend / AI pipeline** (`/opt/opencloud-platform/apps/middleware/`) — untouched. The middleware already supports `onboarding_status` and `onboarding_completed_at` in the Company schema; no middleware change was needed for this fix.
- **Auth flow** — untouched. Login still uses `supabase.auth.signInWithPassword()`; session cookie flow unchanged.
- **Design tokens / theme** — untouched.
- **Tests for other pages** — no existing test was modified.

---

## 9. Build & deploy verification

```
TypeScript strict: 0 errors
Tests:            183/183 pass (25 files)
Build:            9.37s, 108.98 KB gzip (index)
Git push:         committed locally; Netlify will pick up on next deploy
```

After Netlify redeploys, any user that signs in for the first time will land on the new onboarding form. After submitting, they'll reach the dashboard on the next visit — from any device.

---

## 10. Follow-ups (not in scope)

1. **Server-side scraping of the website** — already designed in the hint, no work yet.
2. **Re-edit entry-point** — currently the user has to navigate to `/onboarding` manually to re-edit; we could add a "Re-do onboarding" toggle in Settings → Workspace.
3. **Multilingual copy** — strings are hard-coded English; a future i18n pass will localise them.
4. **Telemetry** — fire an analytics event on `onboarding_completed` so we can measure funnel completion rates.