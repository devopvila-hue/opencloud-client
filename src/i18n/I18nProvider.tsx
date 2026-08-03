import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  catalog,
  DEFAULT_LOCALE,
  detectBrowserLocale,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  t as translate,
  writeStoredLocale,
  type Locale,
} from './i18n';

/**
 * I18n context — exposes the active locale, a setter that persists,
 * and a `t(key, vars)` convenience bound to the current locale.
 *
 * Resolution order on first mount:
 *   1. localStorage (`opencloud.locale`) — the user's explicit choice.
 *   2. Browser detection (en* → en, else es) — only on the client.
 *   3. DEFAULT_LOCALE (es) — fallback for SSR / sandboxed browsers.
 *
 * Spanish (Spain) is the brand default. English only kicks in when
 * the browser explicitly asks for it (`en*`). Any other browser
 * locale falls back to Spanish so first-time visitors from outside
 * Spain still land in Spanish.
 *
 * Setter:
 *   - Writes to localStorage so the choice survives reloads and
 *     subsequent logins.
 *   - Updates `<html lang>` so screen readers and the browser's
 *     built-in translation prompts use the right language.
 *
 * Never throws. If the storage layer is locked down the choice
 * still works for the current session.
 */

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /**
   * `t(key)` returns the translation or the key.
   * `t(key, fallback)` returns the translation or `fallback` if missing.
   * `t(key, vars)` interpolates `{name}` placeholders.
   */
  t: (
    key: string,
    second?: string | Record<string, string | number>,
  ) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: ReactNode;
}

function pickInitialLocale(): Locale {
  // localStorage first — the user's explicit preference wins.
  const stored = readStoredLocale();
  if (stored) return stored;
  // Then browser detection (only on the client; SSR doesn't have
  // navigator and shouldn't pretend to know the user's language).
  if (typeof window !== 'undefined') {
    return detectBrowserLocale();
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(pickInitialLocale);

  // Persist + sync the <html lang> attribute whenever the locale changes.
  useEffect(() => {
    writeStoredLocale(locale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  // Bind `t` to the current locale. Recreating on each render is
  // fine because `t` is pure and the cost is negligible — memoising
  // it would only complicate consumers.
  const t = useCallback(
    (key: string, second?: string | Record<string, string | number>) => {
      if (typeof second === 'string') {
        return translate(key, locale, undefined, second);
      }
      return translate(key, locale, second);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Fall back to a no-op so tests and one-off utilities can call
    // useI18n() without wrapping in a provider. The first render
    // will use the default English catalog.
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => undefined,
      t: (key: string, second?: string | Record<string, string | number>) => {
        if (typeof second === 'string') {
          return translate(key, DEFAULT_LOCALE, undefined, second);
        }
        return translate(key, DEFAULT_LOCALE, second);
      },
    };
  }
  return ctx;
}

/**
 * Stand-alone helper for non-React code (e.g. tests, utility modules).
 * Looks up the active locale from localStorage and returns a bound
 * `t`. Falls back to English when localStorage is empty / SSR.
 */
export function makeT(): I18nContextValue['t'] {
  const stored = readStoredLocale();
  const locale: Locale = stored ?? (typeof window !== 'undefined' ? detectBrowserLocale() : DEFAULT_LOCALE);
  return (key, second) => {
    if (typeof second === 'string') {
      return translate(key, locale, undefined, second);
    }
    return translate(key, locale, second);
  };
}

/** Re-export the catalog for tests that need to assert presence of keys. */
export { catalog };