import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import { Field } from '@/components/Field';
import { AuthShell } from '@/components/AuthShell';
import { AuthCardHeader } from '@/components/AuthCardHeader';
import { GoogleMark } from '@/components/GoogleMark';
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
    <AuthShell>
      <AuthCardHeader
        title={mode === 'login' ? t('app.signin.title') : t('app.signup.title')}
        subtitle={mode === 'login' ? t('app.signin.subtitle') : t('app.signup.subtitle')}
      />

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

      <div className="mt-6">
        <p className="text-center text-xs text-[color:var(--muted-foreground)]">
          <Link to="/" className="underline-offset-2 hover:text-[color:var(--foreground)] hover:underline">
            {t('common.return_home')}
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}