import { type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMe } from '@/api/queries';
import { cn } from '@/design-system/cn';
import { redirectToLogin } from '@/utils/authRedirect';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const me = useMe();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (me.isError) {
      // Preserve the intended destination so the user lands back here
      // after a successful sign-in. The login URL is resolved from
      // VITE_AUTH_URL (or window.location.origin) — never hardcoded.
      const next = `${location.pathname}${location.search}`;
      redirectToLogin(next);
    }
  }, [me.isError, location.pathname, location.search, navigate]);

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