import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Command, Menu, Moon, Search, Sun } from 'lucide-react';
import { Button } from '@/components/Button';
import { Avatar } from '@/components/Avatar';
import { useTheme, brandConfig } from '@/design-system/theme';
import { useMe } from '@/api/queries';
import { cn } from '@/design-system/cn';
import { redirectToLogin } from '@/utils/authRedirect';

interface TopbarProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
}

export function Topbar({ onMenuClick, onSearchClick, onNotificationsClick }: TopbarProps) {
  const { theme, toggle, branding } = useTheme();
  const brand = brandConfig[branding];
  const me = useMe();
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[color:var(--color-line)] bg-[color:var(--color-bg-0)]/80 px-3 backdrop-blur md:px-5',
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={onMenuClick}
          aria-label="Toggle navigation"
          className="lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={onSearchClick}
          className={cn(
            'flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-2)] px-3 text-sm text-[color:var(--color-fg-3)] transition-colors',
            'hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-fg-2)]',
            'min-w-[200px] sm:min-w-[280px] lg:min-w-[360px]',
          )}
          aria-label="Quick search"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-left">Search anything…</span>
          <span className="hidden items-center gap-1 sm:flex">
            <kbd className="kbd">⌘</kbd>
            <kbd className="kbd">K</kbd>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-1">
        <Button size="icon" variant="ghost" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button size="icon" variant="ghost" onClick={onSearchClick} aria-label="Command palette" className="hidden md:inline-flex">
          <Command className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onNotificationsClick}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="relative ml-1">
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2 rounded-[var(--radius-md)] p-1 hover:bg-[color:var(--color-bg-3)]"
            aria-haspopup="menu"
            aria-expanded={userOpen}
          >
            <Avatar name={me.data?.full_name ?? me.data?.email} size="sm" />
            <div className="hidden text-left md:block">
              <div className="text-xs font-medium text-[color:var(--color-fg-1)]">
                {me.data?.full_name ?? me.data?.email ?? 'You'}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
                Operator
              </div>
            </div>
          </button>
          {userOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-56 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-1)] p-1 shadow-[var(--shadow-pop)]"
            >
              <div className="px-3 py-2 text-xs text-[color:var(--color-fg-3)]">
                Signed in as<br />
                <span className="text-[color:var(--color-fg-1)]">{me.data?.email}</span>
              </div>
              <Link
                to="/settings"
                onClick={() => setUserOpen(false)}
                className="block rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[color:var(--color-fg-2)] hover:bg-[color:var(--color-bg-3)]"
              >
                Settings
              </Link>
              <Link
                to="/company"
                onClick={() => setUserOpen(false)}
                className="block rounded-[var(--radius-sm)] px-3 py-1.5 text-sm text-[color:var(--color-fg-2)] hover:bg-[color:var(--color-bg-3)]"
              >
                Company profile
              </Link>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
                  } catch {
                    // ignore — we still want to redirect away
                  }
                  redirectToLogin();
                }}
                className="block w-full rounded-[var(--radius-sm)] px-3 py-1.5 text-left text-sm text-[color:var(--color-rose)] hover:bg-[color:var(--color-rose)]/10"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
