import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
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
import { useLogin, useMe, useSignup } from '@/api/queries';
import { useI18n } from '@/i18n/I18nProvider';
import { sanitizeNext, isLoginPath, containsLoginPath } from '@/utils/sanitizeNext';
import { cn } from '@/design-system/cn';
import { ApiClientError } from '@/api/client';

/**
 * LoginPage — real email + password authentication.
 *
 * Flow:
 *   1. User lands on /login (typically with ?next=/dashboard).
 *   2. If they already have a session cookie, useMe() resolves and we
 *      bounce them to the sanitized `next` immediately.
 *   3. Otherwise they fill in the form and submit.
 *   4. We POST to /api/v1/auth/login (or /auth/signup). The
 *      middleware sets the HttpOnly `opc_session` cookie.
 *   5. We invalidate `useMe` so the rest of the app re-reads the user.
 *   6. Once useMe resolves, we navigate to the sanitized `next`.
 *
 * The `next` query parameter is sanitized via `sanitizeNext()` to
 * prevent the redirect-loop class of bugs that hit us earlier.
 */
type Mode = 'login' | 'signup';

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const login = useLogin();
  const signup = useSignup();
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
  const busy = mutation.isPending;
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
      const message = err instanceof ApiClientError ? err.message : t('login.error.invalid');
      setError(message);
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