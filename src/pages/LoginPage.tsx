import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogIn,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Logo } from '@/components/Logo';
import { useToast } from '@/components/Toaster';
import { useGoogleStart, useLogin, useMe, useSignup } from '@/api/queries';
import { useI18n } from '@/i18n/I18nProvider';
import { sanitizeNext, isLoginPath, containsLoginPath } from '@/utils/sanitizeNext';
import { humanizeAuthError } from '@/utils/humanizeAuthError';
import { cn } from '@/design-system/cn';

/**
 * LoginPage — DEPARTIFY Client Portal authentication.
 *
 * Modes:
 *   - login  → existing user, email + password.
 *   - signup → new account, email + password + name.
 *
 * Alternate path:
 *   - Google OAuth  → /api/v1/auth/google/start (backend driven).
 *                     The user is bounced to Google's consent screen
 *                     and the middleware completes the handshake.
 *   - Forgot password → /forgot-password.
 *
 * Errors are normalised through `humanizeAuthError` so the user
 * never sees raw network or backend strings. The technical message
 * stays in the console for debugging.
 */
type Mode = 'login' | 'signup';

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const login = useLogin();
  const signup = useSignup();
  const googleStart = useGoogleStart();
  const { t } = useI18n();

  // ----- next sanitisation ------------------------------------
  const rawNext = params.get('next');
  const next = useMemo(() => sanitizeNext(rawNext ?? '/'), [rawNext]);
  const targetIsLogin = useMemo(() => isLoginPath(next), [next]);
  const loopDetected = useMemo(() => containsLoginPath(rawNext), [rawNext]);

  // ----- form state --------------------------------------------
  const initialMode: Mode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const mutation = mode === 'login' ? login : signup;
  const busy = mutation.isPending || googleStart.isPending;
  const [error, setError] = useState<string | null>(null);

  // ----- bounce out if already signed in -----------------------
  useEffect(() => {
    if (me.data) {
      const target = targetIsLogin ? '/' : next;
      navigate(target, { replace: true });
    }
  }, [me.data, next, targetIsLogin, navigate]);

  // ----- submit ------------------------------------------------
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      if (mode === 'login') {
        await login.mutateAsync({ email: email.trim(), password });
      } else {
        await signup.mutateAsync({
          email: email.trim(),
          password,
          ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
        });
      }
      // The cookie is now set. useMe is invalidated by the hook.
      // We don't navigate here — the `useEffect` above will fire
      // once useMe resolves and bounce to `next`.
      toast.push({
        tone: 'success',
        title: mode === 'login' ? t('login.success.signin') : t('login.success.signup'),
        description: t('login.success.signin_desc'),
      });
    } catch (err) {
      setError(humanizeAuthError(err, mode, t));
    }
  }

  // ----- google ------------------------------------------------
  async function onGoogle() {
    setError(null);
    try {
      const { url } = await googleStart.mutateAsync({ next });
      // Hard navigation — the backend (Supabase) completes the
      // OAuth handshake and returns the user to `next` with a
      // valid `opc_session` cookie.
      window.location.href = url;
    } catch (err) {
      setError(humanizeAuthError(err, 'google', t));
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
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo size={48} />
            <div>
              <h1 className="font-display text-[1.25rem] tracking-[-0.02em] text-[color:var(--foreground)]">
                {mode === 'login' ? t('app.signin.title') : t('app.signup.title')}
              </h1>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                {mode === 'login' ? t('app.signin.subtitle') : t('app.signup.subtitle')}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="mb-5 inline-flex rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 transition-colors',
                mode === 'login'
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)]'
                  : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]',
              )}
              aria-pressed={mode === 'login'}
            >
              <LogIn className="h-3.5 w-3.5" />
              {t('login.mode.signin')}
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 transition-colors',
                mode === 'signup'
                  ? 'bg-[color:var(--accent)] text-[color:var(--accent-foreground)]'
                  : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]',
              )}
              aria-pressed={mode === 'signup'}
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t('login.mode.signup')}
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[color:var(--rose-soft)] p-3 text-xs text-[color:var(--danger)]"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p className="text-pretty">{error}</p>
            </div>
          )}

          {/* Google — shown on both modes */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoogle}
            disabled={busy}
            iconLeft={
              <GoogleMark className="h-4 w-4" />
            }
          >
            {t('login.google.cta')}
          </Button>

          <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]/70">
            <div className="h-px flex-1 bg-[color:var(--color-line)]" />
            <span>{t('login.divider')}</span>
            <div className="h-px flex-1 bg-[color:var(--color-line)]" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3" noValidate>
            {mode === 'signup' && (
              <Field
                label={t('login.field.full_name')}
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('login.full_name_placeholder')}
                disabled={busy}
              />
            )}
            <Field
              label={t('login.field.email')}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('login.email_placeholder')}
              disabled={busy}
            />
            <Field
              label={t('login.field.password')}
              type="password"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.field.password_hint')}
              minLength={8}
              disabled={busy}
            />

            {mode === 'login' && (
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs text-[color:var(--muted-foreground)] underline-offset-2 hover:text-[color:var(--foreground)] hover:underline"
                >
                  {t('login.forgot.link')}
                </Link>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              iconLeft={
                busy ? <Loader2 className="h-4 w-4 animate-spin" /> :
                  mode === 'login' ? <ArrowRight className="h-4 w-4" /> :
                  <CheckCircle2 className="h-4 w-4" />
              }
              disabled={busy || !email.trim() || password.length < 8}
              loading={busy}
            >
              {busy
                ? mode === 'login' ? t('login.button.signing_in') : t('login.button.creating')
                : mode === 'login' ? t('login.button.signin') : t('login.button.signup')}
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/40 p-3 text-xs text-[color:var(--muted-foreground)]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
            <div>
              <p className="font-medium text-[color:var(--foreground)]">{t('login.secure.title')}</p>
              <p className="mt-0.5 text-pretty">
                {t('login.secure.description')}
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
                <strong>{t('login.loop.title')}</strong> {t('login.loop.description')}
              </p>
            ) : (
              <p>
                {t('login.destination')}&nbsp;
                <code className="rounded bg-[color:var(--surface-soft)] px-1 py-0.5 font-mono text-[11px]">
                  {next}
                </code>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-[color:var(--muted-foreground)]">
            <Link to="/" className="underline-offset-2 hover:text-[color:var(--foreground)] hover:underline">
              {t('common.return_home')}
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}

/**
 * Google "G" mark — single source of truth for the official 4-color
 * glyph. The rest of the icon set comes from lucide-react but the
 * Google "G" is a multi-colour brand mark we render inline.
 */
function GoogleMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
