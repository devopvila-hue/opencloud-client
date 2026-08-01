import { type ReactNode, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMe } from '@/api/queries';
import { cn } from '@/design-system/cn';

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const me = useMe();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (me.isError) {
      const next = encodeURIComponent(location.pathname + location.search);
      // Redirect to the standalone web app login (apps/web),
      // then back to this portal with a valid session cookie.
      window.location.assign(`http://localhost:5173/login?next=${next}`);
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
