import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Field } from '@/components/Field';
import { Logo } from '@/components/Logo';
import { usePasswordResetRequest } from '@/api/queries';
import { humanizeAuthError } from '@/utils/humanizeAuthError';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * ForgotPasswordPage — DEPARTIFY password recovery.
 *
 * The user enters the email associated with their account and we
 * POST to /api/v1/auth/password-reset/request. The backend sends a
 * one-time link. We intentionally do not surface whether the email
 * exists — the user always sees the same confirmation so the form
 * cannot be used to enumerate accounts.
 *
 * The technical error (network / 5xx) goes through
 * humanizeAuthError so the user never sees a raw backend string.
 */
type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const reset = usePasswordResetRequest();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await reset.mutateAsync({ email: email.trim() });
      setStatus('sent');
    } catch (err) {
      // Keep the message friendly but log the raw error for
      // developers (DevTools console only — never shown to the
      // user).
      // eslint-disable-next-line no-console
      console.error('[forgot-password] request failed:', err);
      setStatus('error');
      setError(humanizeAuthError(err, 'forgot', t));
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
                {t('forgot.title')}
              </h1>
              <p className="mt-1 text-xs text-[color:var(--muted-foreground)] text-pretty">
                {t('forgot.subtitle')}
              </p>
            </div>
          </div>

          {status === 'sent' ? (
            <div className="rounded-[var(--radius-md)] border border-[color:var(--success)]/30 bg-[color:var(--success)]/10 p-4 text-sm text-[color:var(--foreground)]">
              <div className="flex items-center gap-2 text-[color:var(--success)]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="font-medium">{t('forgot.sent.title')}</p>
              </div>
              <p className="mt-2 text-pretty text-[color:var(--muted-foreground)]">
                {t('forgot.sent.desc')}
              </p>
              <Link
                to="/login"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)] underline-offset-2 hover:text-[color:var(--foreground)] hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                {t('forgot.back_to_login')}
              </Link>
            </div>
          ) : (
            <>
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
                <Field
                  label={t('forgot.field.email')}
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.email_placeholder')}
                  disabled={status === 'sending'}
                  leading={<Mail className="h-4 w-4" />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  iconLeft={
                    status === 'sending' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )
                  }
                  disabled={status === 'sending' || !email.trim()}
                  loading={status === 'sending'}
                >
                  {status === 'sending' ? t('forgot.button.sending') : t('forgot.button.cta')}
                </Button>
              </form>

              <div className="mt-5 flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                <KeyRound className="h-3.5 w-3.5 text-[color:var(--accent)]" />
                <p className="text-pretty">
                  {t('forgot.hint')}
                </p>
              </div>

              <p className="mt-6 text-center text-xs text-[color:var(--muted-foreground)]">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 underline-offset-2 hover:text-[color:var(--foreground)] hover:underline"
                >
                  <ArrowLeft className="h-3 w-3" />
                  {t('forgot.back_to_login')}
                </Link>
              </p>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
