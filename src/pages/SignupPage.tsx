import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { AuthShell } from '@/components/AuthShell';
import { AuthCardHeader } from '@/components/AuthCardHeader';
import { GoogleMark } from '@/components/GoogleMark';
import { useToast } from '@/components/Toaster';
import { useGoogleStart, useMe, useSignup } from '@/api/queries';
import { useI18n } from '@/i18n/I18nProvider';
import { sanitizeNext, containsLoginPath } from '@/utils/sanitizeNext';
import { humanizeAuthError } from '@/utils/humanizeAuthError';

/**
 * SignupPage — DEPARTIFY account creation.
 *
 * Dedicated route (no longer piggy-backed on LoginPage's mode toggle).
 * The previous behaviour — toggling `?mode=signup` inside LoginPage —
 * meant a user landing directly on /signup would see the SIGN IN form
 * while the Sign up tab was visually selected. Confusing and broken.
 *
 * Layout is identical to /login and /forgot-password thanks to
 * AuthShell + AuthCardHeader — they are the same screen at a glance.
 */
export default function SignupPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const me = useMe();
  const signup = useSignup();
  const googleStart = useGoogleStart();
  const { t } = useI18n();

  const rawNext = params.get('next');
  const next = sanitizeNext(rawNext ?? '/');
  const loopDetected = containsLoginPath(rawNext);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const busy = signup.isPending || googleStart.isPending;

  // Bounce out if already signed in
  useEffect(() => {
    if (me.data) navigate(next, { replace: true });
  }, [me.data, next, navigate]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    try {
      await signup.mutateAsync({
        email: email.trim(),
        password,
        ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
      });
      toast.push({
        tone: 'success',
        title: t('login.success.signup'),
        description: t('login.success.signin_desc'),
      });
    } catch (err) {
      setError(humanizeAuthError(err, 'signup', t));
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      const { url } = await googleStart.mutateAsync({ next });
      window.location.href = url;
    } catch (err) {
      setError(humanizeAuthError(err, 'google', t));
    }
  }

  return (
    <AuthShell>
      <AuthCardHeader
        title={t('app.signup.title')}
        subtitle={t('app.signup.subtitle')}
      />

      {/* Subtle link back to sign in (signup-first users still need it) */}
      <p className="mb-5 text-center text-xs text-[color:var(--muted-foreground)]">
        {t('login.have_account')}{' '}
        <Link
          to="/login"
          className="text-[color:var(--foreground)] underline-offset-2 hover:underline"
        >
          {t('login.mode.signin')}
        </Link>
      </p>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--danger)]/30 bg-[color:var(--rose-soft)] p-3 text-xs text-[color:var(--danger)]"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p className="text-pretty">{error}</p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onGoogle}
        disabled={busy}
        iconLeft={<GoogleMark className="h-4 w-4" />}
      >
        {t('login.google.cta')}
      </Button>

      <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]/70">
        <div className="h-px flex-1 bg-[color:var(--color-line)]" />
        <span>{t('login.divider')}</span>
        <div className="h-px flex-1 bg-[color:var(--color-line)]" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <Field
          label={t('login.field.full_name')}
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t('login.full_name_placeholder')}
          disabled={busy}
        />
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
          autoComplete="new-password"
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
            busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />
          }
          disabled={busy || !email.trim() || password.length < 8}
          loading={busy}
        >
          {busy ? t('login.button.creating') : t('login.button.signup')}
        </Button>
      </form>

      <div className="mt-5 flex items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/40 p-3 text-xs text-[color:var(--muted-foreground)]">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
        <div>
          <p className="font-medium text-[color:var(--foreground)]">{t('login.secure.title')}</p>
          <p className="mt-0.5 text-pretty">{t('login.secure.description')}</p>
        </div>
      </div>

      {loopDetected ? (
        <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 p-3 text-xs text-[color:var(--warning)]">
          <p>
            <strong>{t('login.loop.title')}</strong> {t('login.loop.description')}
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--border)] bg-transparent p-3 text-xs text-[color:var(--muted-foreground)]">
          <p>
            {t('login.destination')}&nbsp;
            <code className="rounded bg-[color:var(--surface-soft)] px-1 py-0.5 font-mono text-[11px]">
              {next}
            </code>
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-[color:var(--muted-foreground)]">
        <Link to="/" className="underline-offset-2 hover:text-[color:var(--foreground)] hover:underline">
          {t('common.return_home')}
        </Link>
      </p>
    </AuthShell>
  );
}