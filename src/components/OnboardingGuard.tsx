import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useCompany, useMe } from '@/api/queries';

/**
 * OnboardingGuard — second-layer auth check, mounted *inside*
 * RequireAuth. Every authenticated user that lands on a protected
 * route is funnelled through this component:
 *
 *   1. me.loading      → render a centred spinner (no redirect)
 *   2. no company yet  → redirect to /onboarding
 *   3. company.onboarding_status !== 'completed'
 *                       → redirect to /onboarding
 *   4. already on /onboarding → skip the redirect (so the user
 *                              can actually fill in the form)
 *   5. otherwise        → render the protected children
 *
 * The skip-on-/onboarding rule prevents the
 * /onboarding?next=/onboarding loop that would otherwise form
 * once we redirect: the guard sees the URL, decides "they are
 * already where they need to be" and stops.
 *
 * Note: this guard is intentionally read-only — it never modifies
 * the company. Completing onboarding is the OnboardingPage's job.
 */
interface OnboardingGuardProps {
  children: ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const me = useMe();
  const company = useCompany();
  const navigate = useNavigate();
  const location = useLocation();

  const onOnboardingPath =
    location.pathname === '/onboarding' ||
    location.pathname.startsWith('/onboarding/');

  // Decide whether the user needs (re-)onboarding.
  const needsOnboarding = (() => {
    if (!me.data) return false;        // RequireAuth handles unauth.
    if (company.isLoading) return false; // wait, don't bounce yet.
    if (!company.data) return true;    // no company record → fresh user.
    const status = company.data.onboarding_status;
    return status !== 'completed' && status !== 'skipped';
  })();

  useEffect(() => {
    if (onOnboardingPath) return;
    if (company.isLoading) return;
    if (me.isLoading) return;
    if (needsOnboarding) {
      navigate('/onboarding', { replace: true });
    }
  }, [onOnboardingPath, company.isLoading, me.isLoading, needsOnboarding, navigate]);

  // Loading state — single full-screen spinner while we figure out
  // whether the user can enter the app.
  if (me.isLoading || company.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[color:var(--color-bg-1)]">
        <Loader2 className="h-8 w-8 animate-spin text-[color:var(--accent)]" />
      </div>
    );
  }

  // While we are redirecting, render nothing to avoid a flash of
  // protected content. The redirect is replace:true so the
  // /onboarding URL doesn't pollute browser history. The exception
  // is the /onboarding path itself: the user is already on the
  // page they need to be, so we render children (the OnboardingPage
  // via the matched route) instead of `null` — otherwise the page
  // stays blank instead of showing the onboarding form.
  if (needsOnboarding && !onOnboardingPath) return null;

  return <>{children}</>;
}