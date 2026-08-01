import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('authRedirect', () => {
  const originalLocation = window.location;
  const originalEnv = import.meta.env.VITE_AUTH_URL;

  beforeEach(() => {
    // Reset module cache so import.meta.env mutations take effect.
    vi.resetModules();
  });

  afterEach(() => {
    // Restore window.location after each test.
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    if (originalEnv === undefined) {
      delete (import.meta.env as Record<string, unknown>).VITE_AUTH_URL;
    } else {
      (import.meta.env as Record<string, unknown>).VITE_AUTH_URL = originalEnv;
    }
  });

  describe('resolveAuthOrigin', () => {
    it('returns window.location.origin when VITE_AUTH_URL is not set', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://portal.example.com' },
      });
      delete (import.meta.env as Record<string, unknown>).VITE_AUTH_URL;

      const { resolveAuthOrigin } = await import('@/utils/authRedirect');
      expect(resolveAuthOrigin()).toBe('https://portal.example.com');
    });

    it('returns VITE_AUTH_URL when it is set (separate-origin login)', async () => {
      (import.meta.env as Record<string, unknown>).VITE_AUTH_URL = 'https://app.example.com';

      const { resolveAuthOrigin } = await import('@/utils/authRedirect');
      expect(resolveAuthOrigin()).toBe('https://app.example.com');
    });

    it('strips trailing slash from VITE_AUTH_URL', async () => {
      (import.meta.env as Record<string, unknown>).VITE_AUTH_URL = 'https://app.example.com/';

      const { resolveAuthOrigin } = await import('@/utils/authRedirect');
      expect(resolveAuthOrigin()).toBe('https://app.example.com');
    });

    it('strips trailing slash from window.location.origin', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://portal.example.com/' },
      });
      delete (import.meta.env as Record<string, unknown>).VITE_AUTH_URL;

      const { resolveAuthOrigin } = await import('@/utils/authRedirect');
      expect(resolveAuthOrigin()).toBe('https://portal.example.com');
    });

    it('ignores empty VITE_AUTH_URL values', async () => {
      (import.meta.env as Record<string, unknown>).VITE_AUTH_URL = '';
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://portal.example.com' },
      });

      const { resolveAuthOrigin } = await import('@/utils/authRedirect');
      expect(resolveAuthOrigin()).toBe('https://portal.example.com');
    });
  });

  describe('buildLoginUrl', () => {
    it('builds /login when no next param is provided', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://portal.example.com' },
      });
      delete (import.meta.env as Record<string, unknown>).VITE_AUTH_URL;

      const { buildLoginUrl } = await import('@/utils/authRedirect');
      expect(buildLoginUrl()).toBe('https://portal.example.com/login');
    });

    it('appends encoded next param', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://portal.example.com' },
      });
      delete (import.meta.env as Record<string, unknown>).VITE_AUTH_URL;

      const { buildLoginUrl } = await import('@/utils/authRedirect');
      const url = buildLoginUrl('/chat/new?department=executive-office');
      expect(url).toBe(
        'https://portal.example.com/login?next=%2Fchat%2Fnew%3Fdepartment%3Dexecutive-office',
      );
    });

    it('uses VITE_AUTH_URL when configured', async () => {
      (import.meta.env as Record<string, unknown>).VITE_AUTH_URL = 'https://app.example.com';

      const { buildLoginUrl } = await import('@/utils/authRedirect');
      expect(buildLoginUrl('/dashboard')).toBe('https://app.example.com/login?next=%2Fdashboard');
    });
  });

  describe('redirectToLogin', () => {
    it('calls window.location.assign with the resolved URL', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: {
          ...originalLocation,
          origin: 'https://portal.example.com',
          assign: vi.fn(),
        },
      });
      delete (import.meta.env as Record<string, unknown>).VITE_AUTH_URL;

      const { redirectToLogin } = await import('@/utils/authRedirect');
      redirectToLogin('/departments');
      expect(window.location.assign).toHaveBeenCalledWith(
        'https://portal.example.com/login?next=%2Fdepartments',
      );
    });

    it('uses VITE_AUTH_URL when configured', async () => {
      (import.meta.env as Record<string, unknown>).VITE_AUTH_URL = 'https://app.example.com';
      const assign = vi.fn();
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://portal.example.com', assign },
      });

      const { redirectToLogin } = await import('@/utils/authRedirect');
      redirectToLogin();
      expect(assign).toHaveBeenCalledWith('https://app.example.com/login');
    });

    it('does not throw when window is undefined', async () => {
      // SSR safety — calling redirectToLogin with no window should be a no-op.
      const originalWindow = globalThis.window;
      Reflect.deleteProperty(globalThis as object, 'window');
      try {
        const { redirectToLogin } = await import('@/utils/authRedirect');
        expect(() => redirectToLogin('/dashboard')).not.toThrow();
      } finally {
        (globalThis as { window?: unknown }).window = originalWindow;
      }
    });
  });

  describe('production safety', () => {
    it('never returns localhost:5173 by default (no env var)', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'https://portal.example.com' },
      });
      delete (import.meta.env as Record<string, unknown>).VITE_AUTH_URL;

      const { buildLoginUrl } = await import('@/utils/authRedirect');
      const url = buildLoginUrl('/dashboard');
      expect(url).not.toContain('localhost');
      expect(url).not.toContain('127.0.0.1');
      expect(url).not.toContain(':5173');
    });

    it('respects explicit VITE_AUTH_URL even when window.location is localhost', async () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: { ...originalLocation, origin: 'http://localhost:5173' },
      });
      (import.meta.env as Record<string, unknown>).VITE_AUTH_URL = 'https://app.example.com';

      const { buildLoginUrl } = await import('@/utils/authRedirect');
      const url = buildLoginUrl('/dashboard');
      expect(url).toBe('https://app.example.com/login?next=%2Fdashboard');
    });
  });
});