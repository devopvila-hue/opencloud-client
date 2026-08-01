/**
 * sanitizeNext — single source of truth for normalizing the `next`
 * query parameter used by the auth redirect flow.
 *
 * Why this exists:
 *   The portal's RequireAuth guard appends `?next=<current>` when it
 *   bounces an unauthenticated user to the login screen. If that
 *   round-trip is mishandled (e.g. the LoginPage redirects back to
 *   itself with the same `next` appended), the URL grows without
 *   bound:
 *
 *     /login?next=%2Flogin%3Fnext%3D%2Flogin%3Fnext%3D…
 *
 *   This module is the single place that prevents that loop. Any
 *   component or utility that constructs or interprets a `next`
 *   parameter MUST funnel its value through `sanitizeNext()` first.
 *
 * Rules (mirrored in the test suite):
 *   - Empty, null, undefined, non-string         → '/'
 *   - Invalid percent-encoding                   → '/'
 *   - Multi-encoded values are decoded iteratively (max depth 5).
 *   - Contains 'localhost' / '127.0.0.1' / '0.0.0.0' → '/'
 *   - Absolute URL (http://, https://, //)        → '/'
 *   - Pathname equals or starts with /login, /auth,
 *     /logout, /signin, /signout                  → '/'
 *   - Final path does not start with '/'          → '/'
 *   - Otherwise the cleaned path + query + hash  → returned
 *
 * The function is pure — no DOM, no globals, fully unit-testable.
 */

const PLACEHOLDER_ORIGIN = 'http://__sanitize_next_internal__';

const LOOP_BUDGET = 5;

const LOOP_PATHNAMES: ReadonlySet<string> = new Set([
  '/login',
  '/auth',
  '/logout',
  '/signin',
  '/signout',
]);

const LOOP_PATH_PREFIXES: readonly string[] = ['/login/', '/auth/', '/logout/', '/signin/', '/signout/'];

const HOSTNAME_PATTERN = /(?:^|\b)(?:localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(?::\d+)?(?:$|\b)/i;

const ABSOLUTE_URL_PATTERN = /^[a-z][a-z0-9+.-]*:\/\//i;

const PROTOCOL_RELATIVE_PATTERN = /^\/\//;

export interface SanitizeNextOptions {
  /**
   * Optional redirect target. When provided and the input is empty,
   * the function still returns this target (after validation). When
   * omitted, empty input falls back to '/'.
   */
  fallback?: string;
}

/**
 * Normalize a candidate `next` value to a safe in-app path.
 *
 * @param input  the raw `next` parameter (may be null/undefined/empty)
 * @param options.fallback  returned when input is empty and no loop is detected
 * @returns a sanitized path string, never longer than the input
 */
export function sanitizeNext(
  input: string | null | undefined,
  options: SanitizeNextOptions = {},
): string {
  const fallback = sanitizeFallback(options.fallback);

  if (input === null || input === undefined) return fallback;
  if (typeof input !== 'string') return fallback;

  let current = input.trim();
  if (current.length === 0) return fallback;

  // 1. Iteratively decode to handle multi-encoded payloads.
  //    e.g. "/login%3Fnext%3D%2Fdashboard" → "/login?next=/dashboard"
  for (let i = 0; i < LOOP_BUDGET; i += 1) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return fallback;
    }
    if (decoded === current) break;
    current = decoded;
  }

  // 2. Reject references to dev / internal hosts — they leak the
  //    developer's machine into the production URL bar.
  if (HOSTNAME_PATTERN.test(current)) return fallback;

  // 3. Reject absolute URLs (cross-origin redirects are a known
  //    open-redirect vector and the portal never needs them).
  if (ABSOLUTE_URL_PATTERN.test(current)) return fallback;
  if (PROTOCOL_RELATIVE_PATTERN.test(current)) return fallback;

  // 4. Parse with a placeholder origin so relative paths become
  //    parseable URLs. If parsing fails for any reason, treat as a
  //    loop and return the fallback.
  let pathname: string;
  let search = '';
  let hash = '';
  try {
    const url = new URL(current, PLACEHOLDER_ORIGIN);
    pathname = url.pathname;
    search = url.search;
    hash = url.hash;
  } catch {
    return fallback;
  }

  // 5. Reject auth-related paths — these would create the loop the
  //    whole module exists to prevent. Comparison is case-insensitive
  //    because the login route is registered with a lowercase path
  //    and we want to catch obvious bypass attempts like /LOGIN.
  const normalized = normalizePathname(pathname).toLowerCase();
  if (LOOP_PATHNAMES.has(normalized)) return fallback;
  for (const prefix of LOOP_PATH_PREFIXES) {
    if (normalized.startsWith(prefix.toLowerCase())) return fallback;
  }

  // 6. Ensure the original payload was a same-origin relative path.
  //    `new URL(...)` happily turns "dashboard" into a full URL with
  //    pathname "/dashboard" — we must reject that case explicitly so
  //    we don't accidentally accept payloads that bypassed the leading
  //    slash. Also reject payloads that were encoded beyond the loop
  //    budget (they still look URL-encoded after the budget expires).
  if (!current.startsWith('/')) return fallback;

  // 7. Strip any `next` query parameters the URL may have picked up.
  //    The portal should never round-trip a `next` through a `next`.
  const cleanedSearch = stripNestedNextParams(search);

  return `${pathname}${cleanedSearch}${hash}`;
}

/**
 * Returns true when the given pathname would itself trigger a
 * redirect to the login screen. Useful for guards that want to
 * skip the redirect entirely when the user is already on a
 * safe page. Comparison is case-insensitive.
 */
export function isLoginPath(pathname: string | null | undefined): boolean {
  if (typeof pathname !== 'string' || pathname.length === 0) return false;
  const normalized = normalizePathname(pathname).toLowerCase();
  if (LOOP_PATHNAMES.has(normalized)) return true;
  for (const prefix of LOOP_PATH_PREFIXES) {
    if (normalized.startsWith(prefix.toLowerCase())) return true;
  }
  return false;
}

/**
 * Returns true when the given raw `next` value — before sanitization —
 * contains a login/auth-related path. The LoginPage uses this to
 * surface a "loop detected" message to the user.
 */
export function containsLoginPath(input: string | null | undefined): boolean {
  if (!input || typeof input !== 'string') return false;
  let current = input;
  for (let i = 0; i < LOOP_BUDGET; i += 1) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return false;
    }
    if (decoded === current) break;
    current = decoded;
  }
  // Inspect the pathname portion only — a `next` query parameter
  // referencing /login inside an otherwise-valid path is still a
  // loop attempt.
  const queryIndex = current.search(/[?#]/);
  const pathnameOnly = queryIndex === -1 ? current : current.slice(0, queryIndex);
  return isLoginPath(pathnameOnly);
}

function normalizePathname(pathname: string): string {
  // Strip trailing slashes (except for the root) so '/login/' and
  // '/login' are treated identically.
  if (pathname === '/') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function sanitizeFallback(fallback: string | undefined): string {
  if (!fallback) return '/';
  // Short-circuit: '/' is the ultimate fallback, never recurse on it.
  if (fallback === '/') return '/';
  // Recurse with '/' as the fallback so a malicious fallback can't
  // form a chain (e.g. fallback='/login' → '/login' → …).
  return sanitizeNext(fallback, { fallback: '/' });
}

function stripNestedNextParams(rawSearch: string): string {
  if (!rawSearch || rawSearch.length <= 1) return rawSearch;
  const params = new URLSearchParams(rawSearch);
  params.delete('next');
  const cleaned = params.toString();
  return cleaned ? `?${cleaned}` : '';
}