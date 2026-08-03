import { ApiClientError } from '@/api/client';

/**
 * Map any error from the auth flow to a human-readable message.
 *
 * The Portal only shows the user the friendly translation; the
 * original error stays in the console for the developer.
 *
 * Strategy:
 *   1. Network failure / fetch threw          → "Couldn't reach DEPARTIFY".
 *   2. ApiClientError with known HTTP code    → mapped copy.
 *   3. ApiClientError with unknown code       → generic fallback per mode.
 *   4. Anything else                          → generic fallback per mode.
 *
 * `mode` here is 'login' | 'signup' | 'google' so the same helper
 * can serve every entry point.
 */
type Mode = 'login' | 'signup' | 'google' | 'forgot';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

const I18N_KEYS = {
  network: 'login.error.network',
  rate: 'login.error.rate',
  invalid_credentials: 'login.error.invalid_credentials',
  invalid_email: 'login.error.invalid_email',
  weak_password: 'login.error.weak_password',
  email_taken: 'login.error.email_taken',
  oauth_unavailable: 'login.error.oauth_unavailable',
  generic_login: 'login.error.invalid',
  generic_signup: 'login.error.signup_generic',
  generic_google: 'login.error.google_generic',
  generic_forgot: 'login.error.forgot_generic',
} as const;

export function humanizeAuthError(
  err: unknown,
  mode: Mode,
  t: Translator,
): string {
  // 1) Network failure — fetch threw or DNS / CORS / offline.
  if (err instanceof TypeError) {
    return t(I18N_KEYS.network);
  }

  if (err instanceof ApiClientError) {
    const status = err.status;
    const code = err.code;

    // 2a) Rate limiting
    if (status === 429) {
      return t(I18N_KEYS.rate);
    }
    // 2b) Specific backend codes (the middleware surfaces these)
    if (code === 'INVALID_CREDENTIALS' || status === 401) {
      return t(I18N_KEYS.invalid_credentials);
    }
    if (code === 'EMAIL_TAKEN' || status === 409) {
      return t(I18N_KEYS.email_taken);
    }
    if (code === 'WEAK_PASSWORD' || code === 'PASSWORD_TOO_SHORT') {
      return t(I18N_KEYS.weak_password);
    }
    if (code === 'INVALID_EMAIL' || status === 422) {
      return t(I18N_KEYS.invalid_email);
    }
    if (code === 'OAUTH_NOT_CONFIGURED' || code === 'OAUTH_FAILED') {
      return t(I18N_KEYS.oauth_unavailable);
    }

    // 2c) 5xx — backend trouble
    if (status >= 500) {
      return t(I18N_KEYS.network);
    }

    // 2d) Known ApiClientError but no specific mapping
    return t(genericKeyFor(mode, t));
  }

  // 3) Anything else (unexpected throws)
  return t(genericKeyFor(mode, t));
}

function genericKeyFor(mode: Mode, _t: Translator): string {
  if (mode === 'signup') return I18N_KEYS.generic_signup;
  if (mode === 'google') return I18N_KEYS.generic_google;
  if (mode === 'forgot') return I18N_KEYS.generic_forgot;
  return I18N_KEYS.generic_login;
}
