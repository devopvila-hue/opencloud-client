import { useState } from 'react';
import { Bell, Languages, LogOut, Moon, Palette, Shield, Sun, User2 } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { useToast } from '@/components/Toaster';
import { useMe } from '@/api/queries';
import { useTheme } from '@/design-system/theme';

const languages = [
  { id: 'es', label: 'Español' },
  { id: 'en', label: 'English' },
  { id: 'pt', label: 'Português' },
];

export default function SettingsPage() {
  const me = useMe();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({ email: true, inapp: true, weekly: false });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
          Personal preferences and security. Org-wide controls live on the Company page.
        </p>
      </header>

      <Card>
        <CardHeader title="Profile" subtitle="Information tied to your account" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
            <User2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-[color:var(--color-fg-1)]">{me.data?.full_name ?? me.data?.email ?? '—'}</div>
            <div className="text-xs text-[color:var(--color-fg-3)]">{me.data?.email}</div>
            <Badge tone="violet" size="xs" variant="outline" className="mt-1">member</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Appearance" subtitle="Switch between dark and light, set language" />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm ${theme === 'dark' ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]' : 'border-[color:var(--color-line-strong)] text-[color:var(--color-fg-2)]'}`}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm ${theme === 'light' ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]' : 'border-[color:var(--color-line-strong)] text-[color:var(--color-fg-2)]'}`}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
          <Palette className="ml-auto h-4 w-4 text-[color:var(--color-fg-3)]" />
        </div>
        <CardSection className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Languages className="h-4 w-4 text-[color:var(--color-fg-3)]" />
            {languages.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setLanguage(l.id)}
                className={`rounded-full px-3 py-1 text-xs ${language === l.id ? 'bg-[color:var(--color-accent)] text-white' : 'bg-[color:var(--color-bg-3)] text-[color:var(--color-fg-2)] hover:text-[color:var(--color-fg-1)]'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </CardSection>
      </Card>

      <Card>
        <CardHeader title="Notifications" subtitle="Choose how the portal reaches you" />
        <div className="space-y-2 text-sm">
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label="In-app notifications"
            checked={notifications.inapp}
            onChange={(v) => setNotifications((p) => ({ ...p, inapp: v }))}
          />
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label="Email notifications"
            checked={notifications.email}
            onChange={(v) => setNotifications((p) => ({ ...p, email: v }))}
          />
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label="Weekly digest"
            checked={notifications.weekly}
            onChange={(v) => setNotifications((p) => ({ ...p, weekly: v }))}
          />
        </div>
      </Card>

      <Card>
        <CardHeader title="Security" subtitle="Session and access" />
        <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-fg-2)]">
          <Shield className="h-4 w-4" />
          <span>Session: {me.data ? 'active' : '—'}</span>
          <Badge tone="emerald" size="xs" variant="outline">
            HttpOnly · SameSite=Lax
          </Badge>
        </div>
        <CardSection className="mt-3">
          <Button
            variant="danger"
            iconLeft={<LogOut className="h-4 w-4" />}
            onClick={async () => {
              try {
                await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'same-origin' });
                window.location.assign('/login');
              } catch {
                toast.push({ tone: 'error', title: 'Could not sign out' });
              }
            }}
          >
            Sign out
          </Button>
        </CardSection>
      </Card>
    </div>
  );
}

function Toggle({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-line)] px-3 py-2 text-left hover:border-[color:var(--color-line-strong)]"
    >
      <span className="text-[color:var(--color-fg-3)]">{icon}</span>
      <span className="flex-1 text-sm text-[color:var(--color-fg-1)]">{label}</span>
      <span
        className={`relative inline-block h-5 w-9 rounded-full transition-colors ${checked ? 'bg-[color:var(--color-accent)]' : 'bg-[color:var(--color-bg-3)]'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
}