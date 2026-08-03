import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardSection } from '@/components/Card';
import { Field } from '@/components/Field';
import { ErrorState } from '@/components/ErrorState';
import { Logo } from '@/components/Logo';
import { useI18n } from '@/i18n/I18nProvider';
import { useToast } from '@/components/Toaster';
import { useCompany, useCompanyWithRefetch, useCreateCompany, useMe, usePatchCompany } from '@/api/queries';
import { ApiClientError } from '@/api/client';
import { cn } from '@/design-system/cn';

/**
 * OnboardingPage — the only thing a brand-new user sees.
 *
 * Goals:
 *   - Collect the minimum data we need to personalise the portal
 *     (company name, web, sector, employees, primary objective).
 *   - Save it to the Company record via PATCH /api/v1/companies/:id,
 *     marking onboarding_status='completed' + the timestamp.
 *   - Redirect to the dashboard (/) on success.
 *
 * Guarded by `OnboardingGuard` so any other route that gets hit
 * during the splash is funnelled back here until completion.
 *
 * Design choices:
 *   - Single screen, no multi-step wizard. The previous 5-step
 *     wizard had four empty steps and saved nothing to the
 *     backend — users got nothing for clicking through it.
 *   - All fields required (except sector, which is a soft signal).
 *   - Website URL is stored as-is; scraping is intentionally not
 *     implemented yet (placeholder message shown to the user).
 *   - Primary objective is a radio group of 6 options matching the
 *     backend's goals array.
 */

/**
 * Primary goals + team-size buckets — labels are resolved via i18n at
 * render time so they follow the brand default (Spanish first, English
 * only when the user has switched languages). Keeping the data here as
 * constants and translating at render time keeps the source of truth in
 * one place (the catalog) without spreading keys across data files.
 */
const PRIMARY_GOAL_IDS = ['customers', 'marketing', 'seo', 'automation', 'software', 'other'] as const;
type PrimaryGoalId = (typeof PRIMARY_GOAL_IDS)[number];

const EMPLOYEE_BUCKETS = ['justme', '2-10', '11-50', '51-200', '201'] as const;
type EmployeeBucket = (typeof EMPLOYEE_BUCKETS)[number];

/**
 * The portal keeps bucket ids in their i18n form (`justme`, `2-10`,
 * …) for clean catalog keys; the API still expects the legacy ids
 * (`1`, `2-10`, …). Translate at submit time so the rest of the
 * app can keep using the new keys without the backend noticing.
 */
const EMPLOYEE_BUCKETS_TO_API: Record<EmployeeBucket, string> = {
  justme: '1',
  '2-10': '2-10',
  '11-50': '11-50',
  '51-200': '51-200',
  '201': '201+',
};

const SECTOR_OPTIONS = [
  'Technology',
  'Professional Services',
  'Retail / E-commerce',
  'Hospitality',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Finance',
  'Real Estate',
  'Marketing / Media',
  'Other',
];

export default function OnboardingPage() {
  const me = useMe();
  const { t } = useI18n();
  const company = useCompanyWithRefetch();
  const patch = usePatchCompany();
  const create = useCreateCompany();
  const toast = useToast();

  // Form state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [sector, setSector] = useState('');
  const [employees, setEmployees] = useState('');
  const [goal, setGoal] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Defense in depth (Product Debug #007): when the signed-in user
  // changes, force the form back to empty so a stale `company.data`
  // from the previous user can't hydrate the form via the effect
  // below. The cache invalidation in useLogin/useSignup is the real
  // fix; this is a belt-and-suspenders reset in case the network
  // layer ever leaks a query across the session boundary.
  useEffect(() => {
    setName('');
    setWebsite('');
    setSector('');
    setEmployees('');
    setGoal('');
    setError(null);
  }, [me.data?.id]);

  // If the user already completed onboarding, no need to be here.
  useEffect(() => {
    if (company.data?.onboarding_status === 'completed') {
      window.location.replace('/');
    }
  }, [company.data]);

  const isSubmitting = patch.isPending || create.isPending;
  const canSubmit =
    name.trim().length > 0 &&
    website.trim().length > 0 &&
    employees.length > 0 &&
    goal.length > 0 &&
    !isSubmitting;

  // onSuccess handler that's chained onto the mutation so the
  // refetch completes before we navigate. Without this, the
  // OnboardingGuard on `/` could re-evaluate with the stale
  // `data: null` from cache and bounce us straight back to
  // /onboarding (Product Debug #007 symptom: "I delete the data,
  // click continue, and the form reappears empty"). The mutation
  // already invalidates queryKeys.company; this just awaits the
  // refetch so the guard sees the new status on next render.
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    const payload = {
      name: name.trim(),
      domain: normalizeUrl(website.trim()),
      sector: sector || null,
      // Map the i18n key ('justme' / '2-10' / …) back to the
      // backend-expected bucket id ('1' / '2-10' / …) on submit.
      employees: EMPLOYEE_BUCKETS_TO_API[employees as EmployeeBucket] ?? employees,
      goals: [goal],
      onboarding_status: 'completed' as const,
      onboarding_completed_at: new Date().toISOString(),
    };

    try {
      if (company.data?.id) {
        await patch.mutateAsync({ id: company.data.id, patch: payload });
      } else {
        await create.mutateAsync(payload);
      }
      // Wait for the company query refetch to settle before we
      // navigate. Without this, the OnboardingGuard on `/` could
      // re-evaluate with the stale `data: null` from cache and
      // bounce us straight back to /onboarding (Product Debug
      // #007 symptom: "I delete the data, click continue, and
      // the form reappears empty"). The mutation's onSuccess
      // invalidates the cache; refetch() waits for the new data.
      await company.refetch();
      toast.push({
        tone: 'success',
        title: t('onboarding.welcome.title'),
        description: t('onboarding.welcome.desc'),
      });
      // Replace history so the user can't click back into onboarding.
      window.location.assign('/');
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : t('onboarding.error.title');
      setError(message);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[color:var(--background)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-2xl"
      >
        <Card variant="elevated" padding="lg">
          <header className="mb-6 flex flex-col items-center gap-3 text-center">
            <Logo size={48} />
            <div className="flex-1">
              <h1 className="font-display text-[1.25rem] tracking-[-0.02em] text-[color:var(--foreground)]">
                {t('onboarding.title')}
              </h1>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)] text-pretty">
                {t('onboarding.subtitle')}
              </p>
              {me.data?.email && (
                <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                  {t('app.signed_in_as', { email: me.data.email })}
                </p>
              )}
            </div>
          </header>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {error && (
              <ErrorState
                title={t('onboarding.error.title')}
                description={error}
                retry={() => setError(null)}
              />
            )}

            <Field
              label={t('onboarding.field.name')}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('onboarding.field.name_ph')}
              autoComplete="organization"
              disabled={isSubmitting}
            />

            <Field
              label={t('onboarding.field.website')}
              type="url"
              required
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t('onboarding.field.website_ph')}
              autoComplete="url"
              inputMode="url"
              disabled={isSubmitting}
              hint={t('onboarding.field.website_hint')}
            />

            <Field
              label={t('onboarding.field.sector')}
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder={t('onboarding.field.sector_ph')}
              disabled={isSubmitting}
              list="onboarding-sector-options"
            />
            <datalist id="onboarding-sector-options">
              {SECTOR_OPTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--muted-foreground)]">
                {t('onboarding.field.teamsize')}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {EMPLOYEE_BUCKETS.map((id) => {
                  const active = employees === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setEmployees(id)}
                      disabled={isSubmitting}
                      className={cn(
                        'rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors',
                        active
                          ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
                          : 'border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]',
                      )}
                    >
                      {t(`onboarding.teamsize.${id}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--muted-foreground)]">
                {t('onboarding.field.objective')}
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PRIMARY_GOAL_IDS.map((id) => {
                  const active = goal === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setGoal(id)}
                      disabled={isSubmitting}
                      className={cn(
                        'flex items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors',
                        active
                          ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
                          : 'border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                          active
                            ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-[color:var(--accent-foreground)]'
                            : 'border-[color:var(--border)] bg-transparent',
                        )}
                      >
                        {active && <CheckCircle2 className="h-3 w-3" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{t(`onboarding.objective.${id}`)}</span>
                        <span className="mt-0.5 block text-xs text-[color:var(--muted-foreground)]">
                          {t(`onboarding.objective.${id}_desc`)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <CardSection className="rounded-[var(--radius-md)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/30">
              <div className="flex items-start gap-2 text-xs text-[color:var(--muted-foreground)]">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--accent)]" />
                <p className="text-pretty">{t('onboarding.workspace_notice')}</p>
              </div>
            </CardSection>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              iconLeft={
                isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )
              }
              disabled={!canSubmit}
              loading={isSubmitting}
            >
              {isSubmitting ? t('onboarding.submitting') : t('onboarding.submit')}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-[11px] text-[color:var(--muted-foreground)]">
          <Globe className="mr-1 inline-block h-3 w-3" />
          {t('onboarding.footer.invite')}
          <span className="mx-2 opacity-50">·</span>
          <Users className="mr-1 inline-block h-3 w-3" />
          {t('onboarding.footer.data')}
          <span className="mx-2 opacity-50">·</span>
          <Target className="mr-1 inline-block h-3 w-3" />
          {t('onboarding.footer.cta')}
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Add the scheme if the user typed a bare domain. We DO NOT touch
 * the URL otherwise — the user can submit `https://`, `http://`,
 * `example.com`, or `sub.example.co/path?x=1` and we'll store it
 * verbatim. Scraping is intentionally out of scope.
 */
function normalizeUrl(input: string): string {
  if (!input) return input;
  if (/^https?:\/\//i.test(input)) return input;
  return `https://${input}`;
}