import { type ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useMe } from '@/api/queries';
import { cn } from '@/design-system/cn';
import { redirectToLogin } from '@/utils/authRedirect';
import { sanitizeNext, isLoginPath } from '@/utils/sanitizeNext';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const me = useMe();
  const location = useLocation();

  useEffect(() => {
    // Never redirect to login if we're already on the login screen —
    // doing so would create an infinite /login?next=/login?next=…
    // loop. The login route is mounted outside this guard by the
    // router so we don't expect to land here, but we still defend
    // against a misconfiguration at runtime.
    if (isLoginPath(location.pathname)) return;

    if (me.isError) {
      // Preserve the intended destination so the user lands back here
      // after a successful sign-in. sanitizeNext collapses any
      // /login references, multi-encoded payloads, absolute URLs and
      // localhost references into a single safe target.
      const next = sanitizeNext(`${location.pathname}${location.search}`);
      redirectToLogin(next);
    }
  }, [me.isError, location.pathname, location.search]);

  if (me.isLoading) {
    return (
      <div className={cn('flex h-screen w-full items-center justify-center bg-[color:var(--color-bg-1)]')}>
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--color-accent)] border-r-transparent" />
      </div>
    );
  }

  if (me.isError || !me.data) {
    return null;
  }

  return <>{children}</>;
}