import { describe, expect, it } from 'vitest';
import { sanitizeNext, isLoginPath } from '@/utils/sanitizeNext';

describe('sanitizeNext', () => {
  describe('basic inputs', () => {
    it('returns "/" for null', () => {
      expect(sanitizeNext(null)).toBe('/');
    });

    it('returns "/" for undefined', () => {
      expect(sanitizeNext(undefined)).toBe('/');
    });

    it('returns "/" for empty string', () => {
      expect(sanitizeNext('')).toBe('/');
    });

    it('returns "/" for whitespace-only string', () => {
      expect(sanitizeNext('   ')).toBe('/');
    });

    it('returns "/" for non-string input', () => {
      // @ts-expect-error — testing runtime guard
      expect(sanitizeNext(123)).toBe('/');
    });

    it('returns "/" when fallback is missing and input is empty', () => {
      expect(sanitizeNext('', {})).toBe('/');
    });

    it('returns the fallback when input is empty and fallback is provided', () => {
      expect(sanitizeNext('', { fallback: '/dashboard' })).toBe('/dashboard');
    });
  });

  describe('happy path', () => {
    it('returns "/" for plain "/"', () => {
      expect(sanitizeNext('/')).toBe('/');
    });

    it('returns "/dashboard" for "/dashboard"', () => {
      expect(sanitizeNext('/dashboard')).toBe('/dashboard');
    });

    it('preserves query string on a normal path', () => {
      expect(sanitizeNext('/dashboard?tab=overview')).toBe('/dashboard?tab=overview');
    });

    it('preserves hash on a normal path', () => {
      expect(sanitizeNext('/dashboard#section')).toBe('/dashboard#section');
    });

    it('preserves both query and hash', () => {
      expect(sanitizeNext('/dashboard?tab=overview#section')).toBe(
        '/dashboard?tab=overview#section',
      );
    });

    it('trims surrounding whitespace', () => {
      expect(sanitizeNext('  /dashboard  ')).toBe('/dashboard');
    });

    it('handles nested routes', () => {
      expect(sanitizeNext('/departments/marketing')).toBe('/departments/marketing');
    });
  });

  describe('loop detection — /login in any form', () => {
    it('rejects next="/login" → returns "/"', () => {
      expect(sanitizeNext('/login')).toBe('/');
    });

    it('rejects next="/login/" → returns "/"', () => {
      expect(sanitizeNext('/login/')).toBe('/');
    });

    it('rejects next="//login" → returns "/"', () => {
      expect(sanitizeNext('//login')).toBe('/');
    });

    it('rejects next="/login?next=/dashboard" → returns "/"', () => {
      expect(sanitizeNext('/login?next=/dashboard')).toBe('/');
    });

    it('rejects next="/login?next=/login" → returns "/"', () => {
      expect(sanitizeNext('/login?next=/login')).toBe('/');
    });

    it('rejects next="/login?next=/login?next=..." → returns "/"', () => {
      const value = '/login?next=' + encodeURIComponent('/login?next=' + encodeURIComponent('/dashboard'));
      expect(sanitizeNext(value)).toBe('/');
    });

    it('rejects deeply nested /login references', () => {
      const deep = encodeURIComponent(
        encodeURIComponent(
          encodeURIComponent('/login?next=' + encodeURIComponent('/login')),
        ),
      );
      expect(sanitizeNext(deep)).toBe('/');
    });

    it('rejects /auth and /logout paths', () => {
      expect(sanitizeNext('/auth')).toBe('/');
      expect(sanitizeNext('/logout')).toBe('/');
      expect(sanitizeNext('/signin')).toBe('/');
      expect(sanitizeNext('/signout')).toBe('/');
    });

    it('rejects /login with subpath', () => {
      expect(sanitizeNext('/login/callback')).toBe('/');
      expect(sanitizeNext('/auth/oauth')).toBe('/');
    });
  });

  describe('localhost and internal hosts', () => {
    it('rejects "http://localhost:5173"', () => {
      expect(sanitizeNext('http://localhost:5173')).toBe('/');
    });

    it('rejects "http://localhost:5173/dashboard"', () => {
      expect(sanitizeNext('http://localhost:5173/dashboard')).toBe('/');
    });

    it('rejects "http://127.0.0.1/dashboard"', () => {
      expect(sanitizeNext('http://127.0.0.1/dashboard')).toBe('/');
    });

    it('rejects "http://0.0.0.0/dashboard"', () => {
      expect(sanitizeNext('http://0.0.0.0/dashboard')).toBe('/');
    });

    it('rejects any string containing "localhost" anywhere', () => {
      expect(sanitizeNext('/path?redirect=localhost:8080')).toBe('/');
    });
  });

  describe('absolute URLs', () => {
    it('rejects https://example.com', () => {
      expect(sanitizeNext('https://example.com')).toBe('/');
    });

    it('rejects https://example.com/dashboard', () => {
      expect(sanitizeNext('https://example.com/dashboard')).toBe('/');
    });

    it('rejects protocol-relative //example.com/dashboard', () => {
      expect(sanitizeNext('//example.com/dashboard')).toBe('/');
    });

    it('rejects non-http schemes (javascript:)', () => {
      expect(sanitizeNext('javascript:alert(1)')).toBe('/');
    });
  });

  describe('invalid inputs', () => {
    it('rejects invalid percent-encoding', () => {
      // % is not a complete escape sequence → decoding throws
      expect(sanitizeNext('/dashboard%')).toBe('/');
    });

    it('rejects a path that does not start with /', () => {
      expect(sanitizeNext('dashboard')).toBe('/');
      expect(sanitizeNext('?tab=overview')).toBe('/');
    });
  });

  describe('next parameter nesting', () => {
    it('strips nested "next" query parameter', () => {
      // The original URL had a `next` inside the `next` itself —
      // sanitizeNext must remove the inner one so the redirect
      // doesn't bounce through another login.
      const result = sanitizeNext('/dashboard?next=/login&tab=1');
      expect(result).toBe('/dashboard?tab=1');
    });

    it('strips nested next even when it points to /login', () => {
      const result = sanitizeNext('/dashboard?next=/login');
      expect(result).toBe('/dashboard');
    });
  });

  describe('multi-encoded payloads', () => {
    it('decodes once when encoded once', () => {
      const encoded = encodeURIComponent('/dashboard');
      expect(sanitizeNext(encoded)).toBe('/dashboard');
    });

    it('decodes twice when encoded twice', () => {
      const once = encodeURIComponent('/dashboard');
      const twice = encodeURIComponent(once);
      expect(sanitizeNext(twice)).toBe('/dashboard');
    });

    it('decodes five times (at the loop budget limit)', () => {
      let value = '/dashboard';
      for (let i = 0; i < 5; i += 1) {
        value = encodeURIComponent(value);
      }
      expect(sanitizeNext(value)).toBe('/dashboard');
    });

    it('returns "/" when decoding exceeds the loop budget', () => {
      // Encode six times — beyond the loop budget the function
      // returns the decoded value as-is and the URL parser rejects it.
      let value = '/login';
      for (let i = 0; i < 6; i += 1) {
        value = encodeURIComponent(value);
      }
      // The result is the URL-encoded string, which is not a path —
      // it does not start with / once decoded (the first char is '%'),
      // so the function returns the fallback.
      expect(sanitizeNext(value)).toBe('/');
    });
  });

  describe('case sensitivity', () => {
    it('rejects /LOGIN (uppercase)', () => {
      // Pathnames are case-sensitive, but we lower-case during
      // normalization to catch the obvious bypass.
      expect(sanitizeNext('/LOGIN')).toBe('/');
      expect(sanitizeNext('/Login')).toBe('/');
    });
  });

  describe('trailing slash normalization', () => {
    it('treats /login/ the same as /login', () => {
      expect(sanitizeNext('/login/')).toBe('/');
      expect(sanitizeNext('/login//')).toBe('/');
    });
  });
});

describe('isLoginPath', () => {
  it('returns true for /login', () => {
    expect(isLoginPath('/login')).toBe(true);
  });

  it('returns true for /login/callback', () => {
    expect(isLoginPath('/login/callback')).toBe(true);
  });

  it('returns true for /auth and /signout', () => {
    expect(isLoginPath('/auth')).toBe(true);
    expect(isLoginPath('/signout')).toBe(true);
  });

  it('returns false for /dashboard', () => {
    expect(isLoginPath('/dashboard')).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isLoginPath(null)).toBe(false);
    expect(isLoginPath(undefined)).toBe(false);
  });

  it('handles case variations', () => {
    expect(isLoginPath('/LOGIN')).toBe(true);
    expect(isLoginPath('/Login/Callback')).toBe(true);
  });
});

describe('integration — loop never grows the URL', () => {
  it('feeding the sanitized output back never grows past a single /', () => {
    // Start from a payload that would have caused the loop in the
    // original bug report. After one pass through sanitizeNext the
    // value collapses; subsequent passes are no-ops.
    const inputs = [
      '/login',
      '/login?next=/login',
      '/login?next=/login?next=/login',
      '/login?next=' + encodeURIComponent('/login?next=/dashboard'),
    ];
    for (const input of inputs) {
      let value = input;
      for (let i = 0; i < 5; i += 1) {
        value = sanitizeNext(value);
      }
      expect(value).toBe('/');
    }
  });

  it('preserves a normal destination through repeated passes', () => {
    const value = sanitizeNext('/dashboard');
    expect(sanitizeNext(value)).toBe('/dashboard');
    expect(sanitizeNext(sanitizeNext(value))).toBe('/dashboard');
  });
});