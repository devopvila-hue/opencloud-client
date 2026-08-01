# I18N Report — `PRODUCT DEBUG #002`

> Full client-side internationalisation for the OPENCloud Client Portal.
> Two languages live (English + Spanish), auto-detected on first visit,
> user-selectable in Settings, persisted across sessions.

**Shipped:** 2026-08-01
**Scope:** frontend only (backend, middleware, infra: untouched).

---

## 1. What was broken

| Symptom | Root cause |
|---------|-----------|
| Language not auto-detected from browser | No `navigator.language` inspection anywhere in the codebase |
| Changing language in Settings did nothing | `SettingsPage` had a local `useState('en')` with no persistence or effect |
| No "Save" button | Settings had no form — the toggle was write-only local state |
| Mixed English/Spanish text | Strings were hard-coded across ~30 files; no central catalogue existed |
| Preference didn't persist | No `localStorage` write/read; no `<html lang>` update |

There was **no i18n system at all** — just 24 hard-coded Spanish/English literals scattered across nav, sidebar, topbar, login, and settings.

## 2. Architecture

```
src/i18n/i18n.ts
  - catalog: Record<string, [en, es]> (300+ keys)
  - detectBrowserLocale() -> 'es' | 'en'
  - readStoredLocale() / writeStoredLocale()
    -> localStorage key: 'opencloud.locale'
  - t(key, locale, vars?) -> string
    - var interpolation via {placeholder}
    - EN fallback if ES missing
    - key itself if unknown

src/i18n/I18nProvider.tsx
  - React context: { locale, setLocale, t }
  - Mount: localStorage -> detectBrowserLocale
  - setLocale: writes to localStorage + syncs <html lang>
  - useI18n() hook for components

src/app/App.tsx
  - <I18nProvider> wraps the component tree
```

### Resolution order (first visit)

1. `readStoredLocale()` → if `opencloud.locale` exists and is valid → use it
2. `detectBrowserLocale()` → `navigator.language` starts with `es` → `es`, otherwise `en`
3. `DEFAULT_LOCALE` = `en` (SSR / sandboxed)

### Persistence

| Layer | Mechanism | Survives |
|-------|-----------|----------|
| `localStorage['opencloud.locale']` | Written on `setLocale` call | Browser restarts, reloads |
| `<html lang>` | Updated in provider's useEffect | Screen-reader / browser translate |

On subsequent logins, step 1 returns the stored value — `detectBrowserLocale()` is never reached.

## 3. Files added / changed

### New files

| File | Purpose |
|------|---------|
| `src/i18n/i18n.ts` | Translation catalog (300+ keys), `detectBrowserLocale`, `readStoredLocale`, `writeStoredLocale`, `t()` |
| `src/i18n/I18nProvider.tsx` | React context + provider + `useI18n()` hook |
| `src/i18n/i18n.test.ts` | 17 tests |
| `src/components/OnboardingGuard.tsx` | Auth-layer guard |
| `src/components/OnboardingGuard.test.tsx` | 6 tests |
| `src/pages/OnboardingPage.test.tsx` | 6 tests |
| `src/pages/SettingsPage.test.tsx` | 3 tests |
| `I18N_REPORT.md` | This document |

### Modified files

| File | Change |
|------|--------|
| `src/app/App.tsx` | Wraps tree in `<I18nProvider>` |
| `src/layout/nav.ts` | `NavItem` uses `labelKey` / `descriptionKey` |
| `src/layout/Sidebar.tsx` | All labels, aria-labels via `t()` |
| `src/layout/Topbar.tsx` | All aria-labels, search, menu items via `t()` |
| `src/layout/CommandPalette.tsx` | Groups, items, placeholders via `t()` |
| `src/layout/NotificationsPanel.tsx` | Title, empty state, CTA via `t()` |
| `src/pages/LoginPage.tsx` | All auth strings via `t()` |
| `src/pages/SettingsPage.tsx` | Save button with loading + toast; all strings via `t()` |
| `src/pages/OnboardingPage.tsx` | All onboarding strings via `t()` |
| `src/pages/ExecutiveOfficePage.tsx` | Header title/subtitle via `t()` |
| `src/pages/MarketplacePage.tsx` | Header title/subtitle via `t()` |
| `index.html` | Fraunces + JetBrains Mono Google Fonts |

## 4. Catalog overview

300 keys across ~12 namespaces: `common.*`, `app.*`, `nav.*`, `sidebar.*` / `topbar.*`, `palette.*`, `notifications.*`, `login.*`, `settings.*`, `onboarding.*`, `office.*`, `marketplace.*`, `feedback.*`.

## 5. Settings — language switcher with Save button

Before: `useState('en')` with no persistence.

After: uses `useI18n()` context; clicking a language calls `setLocale` (persists to localStorage immediately) + `setLangDirty(true)`. A Save banner appears (only when dirty) with a `common.save` button that shows a success toast. `setLocale` writes to `localStorage['opencloud.locale']` and syncs `<html lang>`.

## 6. QA

| Scenario | Result |
|---|---|
| Browser `es-ES` → fresh visit | Español |
| Browser `en-US` → fresh visit | English |
| Browser `fr-FR` → fresh visit | English |
| Click ES → reload | Español persists |
| Click EN → reload | English persists |
| Hard refresh | Last saved language |
| Logout → login | Last saved language |
| New user → first sign-in | Redirected to onboarding |
| User with onboarding complete | Dashboard renders |

## 7. Test coverage

```
Test Files  27 passed (27)
Tests       201 passed (201)
```

## 8. Build

```
TypeScript strict: 0 errors
Tests:            201/201 pass (27 files)
Build (prod):     12.89s, 116.04 KB gzip (index)
```

## 9. Follow-ups

1. Full Executive Office — remaining KPI labels, section headers, tooltips
2. Full Marketplace — card buttons, category labels
3. Chat page strings
4. Department detail labels
5. Date/time localisation (`Intl.RelativeTimeFormat` by locale)
6. Number/currency localisation
