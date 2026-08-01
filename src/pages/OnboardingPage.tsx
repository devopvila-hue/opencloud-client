import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardSection } from '@/components/Card';
import { Field } from '@/components/Field';
import { ErrorState } from '@/components/ErrorState';
import { useToast } from '@/components/Toaster';
import { useCompany, useCreateCompany, useMe, usePatchCompany } from '@/api/queries';
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

const PRIMARY_GOALS: { id: string; label: string; description: string }[] = [
  { id: 'customers', label: 'Get more customers', description: 'Lead generation and sales pipeline' },
  { id: 'marketing', label: 'Marketing', description: 'Brand awareness and campaigns' },
  { id: 'seo', label: 'SEO', description: 'Organic search traffic and rankings' },
  { id: 'automation', label: 'Automate processes', description: 'Internal workflows and tooling' },
  { id: 'software', label: 'Build internal software', description: 'Custom apps for the team' },
  { id: 'other', label: 'Other', description: 'Something else entirely' },
];

const EMPLOYEES_OPTIONS = [
  { id: '1', label: 'Just me' },
  { id: '2-10', label: '2–10' },
  { id: '11-50', label: '11–50' },
  { id: '51-200', label: '51–200' },
  { id: '201+', label: '201+' },
];

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
  const company = useCompany();
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

  // Hydrate from existing company data so the form is editable
  // if the user is re-doing onboarding after a status reset.
  useEffect(() => {
    if (!company.data) return;
    if (!name && company.data.name) setName(company.data.name);
    if (!website && company.data.domain) setWebsite(company.data.domain);
    if (!sector && company.data.sector) setSector(company.data.sector);
    if (!employees && company.data.employees) setEmployees(company.data.employees);
    if (!goal && company.data.goals?.length) setGoal(company.data.goals[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.data]);

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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);

    // The onboarding form IS the workspace provisioning — there
    // is no separate "workspace is being created" service that
    // runs ahead of us. If the company record doesn't exist yet
    // (fresh signup, founder reset) we POST /api/v1/companies
    // to create it. If it already exists, we PATCH it. Same
    // payload shape on the wire so the backend stays clean.
    const payload = {
      name: name.trim(),
      domain: normalizeUrl(website.trim()),
      sector: sector || null,
      employees,
      // Persist the goal as the sole entry in the goals array so
      // future re-use (corporate memory, briefings) sees it.
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
      toast.push({
        tone: 'success',
        title: 'Welcome aboard',
        description: 'Loading your Business Operating System…',
      });
      // Replace history so the user can't click back into onboarding.
      window.location.assign('/');
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Could not save your profile';
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
          <header className="mb-6 flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] text-white"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 60%, var(--color-fg-1)))',
              }}
            >
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="font-display text-[1.25rem] tracking-[-0.01em] text-[color:var(--foreground)]">
                Let's set up your workspace
              </h1>
              <p className="mt-1 text-sm text-[color:var(--muted-foreground)] text-pretty">
                Five quick questions so the Executive Director knows your business. You can edit
                everything later from the Company page.
              </p>
              {me.data?.email && (
                <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
                  Signed in as <span className="font-mono">{me.data.email}</span>
                </p>
              )}
            </div>
          </header>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {error && (
              <ErrorState
                title="Couldn't save your profile"
                description={error}
                retry={() => setError(null)}
              />
            )}

            <Field
              label="Company name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Industries"
              autoComplete="organization"
              disabled={isSubmitting}
            />

            <Field
              label="Website"
              type="url"
              required
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              autoComplete="url"
              inputMode="url"
              disabled={isSubmitting}
              hint="We'll start by just saving the URL — automatic enrichment of your company profile arrives in the next version."
            />

            <Field
              label="Sector"
              type="text"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              placeholder="Pick or type your sector"
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
                Team size
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {EMPLOYEES_OPTIONS.map((opt) => {
                  const active = employees === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setEmployees(opt.id)}
                      disabled={isSubmitting}
                      className={cn(
                        'rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors',
                        active
                          ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
                          : 'border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]',
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-[color:var(--muted-foreground)]">
                Primary objective
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PRIMARY_GOALS.map((g) => {
                  const active = goal === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGoal(g.id)}
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
                        <span className="block text-sm font-medium">{g.label}</span>
                        <span className="mt-0.5 block text-xs text-[color:var(--muted-foreground)]">
                          {g.description}
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
                <p className="text-pretty">
                  Your workspace, organisation and owner profile are created automatically when you
                  submit. Nothing leaves the platform — everything is encrypted at rest.
                </p>
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
              {isSubmitting ? 'Saving workspace…' : 'Open my Business OS'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-[11px] text-[color:var(--muted-foreground)]">
          <Globe className="mr-1 inline-block h-3 w-3" />
          Already part of an existing workspace? Ask your admin to invite you instead.
          <span className="mx-2 opacity-50">·</span>
          <Users className="mr-1 inline-block h-3 w-3" />
          All data stays on the OPENCloud infrastructure.
          <span className="mx-2 opacity-50">·</span>
          <Target className="mr-1 inline-block h-3 w-3" />
          One minute. Five questions. Done.
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