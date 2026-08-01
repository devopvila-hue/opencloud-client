import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { useMe } from '@/api/queries';
import { sanitizeNext, isLoginPath, containsLoginPath } from '@/utils/sanitizeNext';
import { resolveAuthOrigin } from '@/utils/authRedirect';
import { cn } from '@/design-system/cn';

/**
 * LoginPage — mounted OUTSIDE the RequireAuth guard.
 *
 * The portal expects authentication to happen on a separate app
 * (`apps/web`) in production; when the user lands here without a
 * valid session cookie we show a one-click bridge to that screen.
 * After the auth callback sets the cookie the user is bounced back
 * to the sanitized `next` target.
 *
 * Sanitization is mandatory: the `next` query parameter is the
 * exact payload that has caused loops in the past. We funnel it
 * through `sanitizeNext()` and also short-circuit if the resolved
 * target is itself a login path.
 */
export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const me = useMe();

  // Sanitize the next parameter once. If sanitizeNext returns '/'
  // we treat that as "go home" and remove the query param entirely.
  const rawNext = params.get('next');
  const next = useMemo(() => sanitizeNext(rawNext ?? '/'), [rawNext]);
  const targetIsLogin = useMemo(() => isLoginPath(next), [next]);
  // Loop detected when the original `next` payload pointed at a login
  // route (or contained one). sanitizeNext collapses those to '/' but
  // the user deserves to know we noticed the attempt.
  const loopDetected = useMemo(() => containsLoginPath(rawNext), [rawNext]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authOrigin = useMemo(() => resolveAuthOrigin(), []);
  const isSameOrigin = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return authOrigin === '' || authOrigin === window.location.origin;
  }, [authOrigin]);

  // If the user lands here WITH a valid session, redirect immediately
  // to the sanitized target. This handles the post-login return trip:
  // apps/web sets the cookie and links the browser back to /login?next=…
  // at which point useMe() resolves to a user and we bounce them on.
  useEffect(() => {
    if (me.data) {
      navigate(targetIsLogin ? '/' : next, { replace: true });
    }
  }, [me.data, next, targetIsLogin, navigate]);

  function goToExternalLogin() {
    setBusy(true);
    setError(null);
    try {
      // We are intentionally building a same-origin login URL — when
      // VITE_AUTH_URL is unset the auth app is the portal itself, so
      // we just navigate to /login (which renders this same page on
      // a real auth backend). When it is set, we hand off to apps/web
      // and let it handle the credential flow.
      const target = isSameOrigin
        ? `/login${next === '/' ? '' : `?next=${encodeURIComponent(next)}`}`
        : `${authOrigin}/login${next === '/' ? '' : `?next=${encodeURIComponent(next)}`}`;
      window.location.assign(target);
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : 'Could not start login');
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[color:var(--background)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-md"
      >
        <Card variant="elevated" padding="lg">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-[1.125rem] tracking-[-0.01em] text-[color:var(--foreground)]">
                Sign in to OPENCloud
              </h1>
              <p className="mt-0.5 text-xs text-[color:var(--muted-foreground)]">
                Continue to your Business Operating System
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4">
              <ErrorState
                title="Sign-in failed"
                description={error}
                retry={goToExternalLogin}
              />
            </div>
          )}

          <p className="text-sm text-[color:var(--muted-foreground)] text-pretty">
            {isSameOrigin
              ? 'Click below to sign in. Your session cookie will be set on success and you will be redirected to your destination.'
              : 'You will be redirected to the secure sign-in screen. After authenticating you will be brought back here automatically.'}
          </p>

          <Button
            variant="primary"
            className="mt-5 w-full"
            iconLeft={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            onClick={goToExternalLogin}
            disabled={busy}
            loading={busy}
          >
            {busy ? 'Redirecting…' : 'Continue to sign in'}
          </Button>

          <div className="mt-5 flex items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/40 p-3 text-xs text-[color:var(--muted-foreground)]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
            <div>
              <p className="font-medium text-[color:var(--foreground)]">Secure session</p>
              <p className="mt-0.5 text-pretty">
                The session cookie is HttpOnly and HMAC-signed by the middleware. We never store your
                credentials in this app.
              </p>
            </div>
          </div>

          <div
            className={cn(
              'mt-5 rounded-[var(--radius-md)] border p-3 text-xs',
              loopDetected || targetIsLogin
                ? 'border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 text-[color:var(--warning)]'
                : 'border-[color:var(--border)] bg-transparent text-[color:var(--muted-foreground)]',
            )}
          >
            {loopDetected || targetIsLogin ? (
              <p>
                <strong>Loop detected.</strong> The destination resolved to the login screen — you will be
                sent to the home page after authentication instead.
              </p>
            ) : (
              <p>
                Destination after sign-in:&nbsp;
                <code className="rounded bg-[color:var(--surface-soft)] px-1 py-0.5 font-mono text-[11px]">
                  {next}
                </code>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-[color:var(--muted-foreground)]">
            <Link to="/" className="underline-offset-2 hover:text-[color:var(--foreground)] hover:underline">
              Return home
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}