/**
 * Auth redirect helpers — pure presentation layer.
 *
 * The Client Portal is a SPA. When the session cookie is missing,
 * RequireAuth redirects the user to the login screen. In development
 * the login screen lives on the same origin (this app) at /login. In
 * production it might live on a separate origin (apps/web) — configure
 * that via VITE_AUTH_URL.
 *
 * Resolution order:
 *   1. `import.meta.env.VITE_AUTH_URL` (if set, must be a full origin)
 *   2. `window.location.origin` (same-origin fallback — Netlify SPA)
 *
 * Never hardcode `http://localhost:5173` or any other dev URL here:
 * the production bundle would ship it and the user would be sent
 * back to the developer's machine.
 */

const LOGIN_PATH = '/login';

/**
 * Returns the full URL to the login screen for a given `next` path.
 * Safe to call during SSR/build (returns `''` when `window` is absent).
 */
export function buildLoginUrl(next?: string): string {
  if (typeof window === 'undefined') return '';

  const base = resolveAuthOrigin();
  const path = LOGIN_PATH;
  if (!next) return `${base}${path}`;
  return `${base}${path}?next=${encodeURIComponent(next)}`;
}

/**
 * Returns the origin (scheme + host + port) that hosts the login screen.
 * Reads `VITE_AUTH_URL` from build-time env, falls back to the current
 * origin when no env var is provided.
 */
export function resolveAuthOrigin(): string {
  // `import.meta.env` is replaced at build time by Vite. If the value
  // is missing the literal string 'undefined' is what we get back —
  // guard against that explicitly.
  const envValue = import.meta.env.VITE_AUTH_URL;
  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    return stripTrailingSlash(envValue);
  }
  if (typeof window !== 'undefined') {
    return stripTrailingSlash(window.location.origin);
  }
  return '';
}

/**
 * Performs a full-page navigation to the login screen, preserving the
 * intended destination in the `next` query string.
 */
export function redirectToLogin(next?: string): void {
  if (typeof window === 'undefined') return;
  const url = buildLoginUrl(next);
  if (url) window.location.assign(url);
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}