import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectBrowserLocale, readStoredLocale, writeStoredLocale, t, type Locale, catalog } from './i18n';

describe('i18n catalog', () => {
  it('contains the Spanish translation for every key', () => {
    // Walk the EN side (index 0) and ensure the ES side (index 1)
    // is a non-empty string for every key. This is the guard against
    // partial translations shipping to production.
    for (const [key, entry] of Object.entries(catalog)) {
      expect(entry[1], `ES translation missing for key "${key}"`).toBeTruthy();
      expect(entry[1].length).toBeGreaterThanOrEqual(1);
    }
  });

  it('contains the English translation for every key', () => {
    for (const [key, entry] of Object.entries(catalog)) {
      expect(entry[0], `EN translation missing for key "${key}"`).toBeTruthy();
    }
  });
});

describe('detectBrowserLocale', () => {
  const originalLanguage = navigator.language;

  afterEach(() => {
    Object.defineProperty(navigator, 'language', { value: originalLanguage, configurable: true });
  });

  it('returns "es" for language starting with "es"', () => {
    Object.defineProperty(navigator, 'language', { value: 'es-ES', configurable: true });
    expect(detectBrowserLocale()).toBe('es');
    Object.defineProperty(navigator, 'language', { value: 'es-MX', configurable: true });
    expect(detectBrowserLocale()).toBe('es');
  });

  it('returns "en" for English', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true });
    expect(detectBrowserLocale()).toBe('en');
  });

  it('returns "es" for any non-English locale (Spanish is the brand default)', () => {
    Object.defineProperty(navigator, 'language', { value: 'pt-BR', configurable: true });
    expect(detectBrowserLocale()).toBe('es');
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
    expect(detectBrowserLocale()).toBe('es');
  });
});

describe('readStoredLocale', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing is stored', () => {
    expect(readStoredLocale()).toBeNull();
  });

  it('returns the stored locale when valid', () => {
    writeStoredLocale('es');
    expect(readStoredLocale()).toBe('es');
  });

  it('returns null when the stored value is not a known locale', () => {
    writeStoredLocale('fr' as Locale);
    expect(readStoredLocale()).toBeNull();
  });
});

describe('writeStoredLocale + readStoredLocale round-trip', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('persists en -> es correctly', () => {
    writeStoredLocale('es');
    expect(readStoredLocale()).toBe('es');
    writeStoredLocale('en');
    expect(readStoredLocale()).toBe('en');
  });
});

describe('t (translation function)', () => {
  it('returns the English string for en locale', () => {
    expect(t('common.save', 'en')).toBe('Save');
    expect(t('login.mode.signin', 'en')).toBe('Sign in');
  });

  it('returns the Spanish string for es locale', () => {
    expect(t('common.save', 'es')).toBe('Guardar');
    expect(t('login.mode.signin', 'es')).toBe('Iniciar sesión');
  });

  it('interpolates variables', () => {
    expect(t('app.signed_in_as', 'en', { email: 'ada@example.com' })).toBe('Signed in as ada@example.com');
    expect(t('app.signed_in_as', 'es', { email: 'ada@example.com' })).toBe('Sesión iniciada como ada@example.com');
  });

  it('falls back to English when the locale entry is empty', () => {
    // Every entry has a valid ES string, so test with a deliberately
    // broken locale to hit the fallback branch.
    expect(t('common.save', 'es')).toBe('Guardar'); // ES is non-empty
    // Simulate a missing ES entry by using a locale that isn't 'es'.
    expect(t('common.save', 'fr' as Locale)).toBe('Save');
  });

  it('returns the key itself when the key is unknown', () => {
    expect(t('nonexistent.key', 'en')).toBe('nonexistent.key');
    expect(t('nonexistent.key', 'es')).toBe('nonexistent.key');
  });
});
