import { useState, useEffect } from 'react';
import { Bell, Check, Languages, LogOut, Moon, Palette, Shield, Sun, User2, Key } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Field } from '@/components/Field';
import { useToast } from '@/components/Toaster';
import { useMe, useLogout } from '@/api/queries';
import { useTheme } from '@/design-system/theme';
import { useI18n } from '@/i18n/I18nProvider';
import { type Locale } from '@/i18n/i18n';
import { cn } from '@/design-system/cn';
import { redirectToLogin } from '@/utils/authRedirect';
import { ModelSettingsCard } from '@/components/ModelSettingsCard';

const languages: { id: Locale; nameKey: string }[] = [
  { id: 'en', nameKey: 'English' },  // will be translated via t() at render
  { id: 'es', nameKey: 'Spanish' },
];

export default function SettingsPage() {
  const me = useMe();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const toast = useToast();
  const [notifications, setNotifications] = useState({ email: true, inapp: true, weekly: false });
  const [saving, setSaving] = useState(false);

  // The language selector drives locale directly — changes are
  // persisted immediately to localStorage (see I18nProvider) but
  // we ALSO surface a toast + banner so the user gets feedback.
  const [langDirty, setLangDirty] = useState(false);

  async function handleSaveLanguage() {
    setSaving(true);
    toast.push({
      tone: 'success',
      title: t('settings.language.saved'),
      description: t('settings.language.saved_desc'),
    });
    setLangDirty(false);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
          {t('settings.subtitle')}
        </p>
      </header>

      <Card>
        <CardHeader title={t('settings.profile.title')} subtitle="Información asociada a tu cuenta" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]">
            <User2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-medium text-[color:var(--color-fg-1)]">{me.data?.full_name ?? me.data?.email ?? '—'}</div>
            <div className="text-xs text-[color:var(--color-fg-3)]">{me.data?.email}</div>
            <Badge tone="violet" size="xs" variant="outline" className="mt-1">{t('settings.profile.member')}</Badge>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title={t('settings.appearance.title')} subtitle={t('settings.appearance.subtitle')} />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm ${theme === 'dark' ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]' : 'border-[color:var(--color-line-strong)] text-[color:var(--color-fg-2)]'}`}
          >
            <Moon className="h-4 w-4" /> {t('common.dark')}
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm ${theme === 'light' ? 'border-[color:var(--color-accent)] bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]' : 'border-[color:var(--color-line-strong)] text-[color:var(--color-fg-2)]'}`}
          >
            <Sun className="h-4 w-4" /> {t('common.light')}
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
                onClick={() => { setLocale(l.id); setLangDirty(true); }}
                className={`rounded-full px-3 py-1 text-xs ${locale === l.id ? 'bg-[color:var(--color-accent)] text-white' : 'bg-[color:var(--color-bg-3)] text-[color:var(--color-fg-2)] hover:text-[color:var(--color-fg-1)]'}`}
              >
                {l.id === 'en' ? t('settings.language.label_en') : t('settings.language.label_es')}
              </button>
            ))}
          </div>
        </CardSection>
        {langDirty && (
          <CardSection className="border-t border-[color:var(--color-line)] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[color:var(--color-fg-2)]">
                {locale === 'es' ? 'Idioma configurado en español.' : 'Language set to English.'}
              </span>
              <Button size="sm" variant="primary" iconLeft={<Check className="h-3.5 w-3.5" />} onClick={handleSaveLanguage} loading={saving} disabled={saving}>
                {saving ? t('common.saving') : t('common.save')}
              </Button>
            </div>
          </CardSection>
        )}
      </Card>

      <Card>
        <CardHeader title={t('settings.notifications.title')} subtitle="Cómo prefieres que el portal te avise" />
        <div className="space-y-2 text-sm">
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label={t('settings.notifications.inapp')}
            checked={notifications.inapp}
            onChange={(v) => setNotifications((p: typeof notifications) => ({ ...p, inapp: v }))}
          />
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label={t('settings.notifications.email')}
            checked={notifications.email}
            onChange={(v) => setNotifications((p: typeof notifications) => ({ ...p, email: v }))}
          />
          <Toggle
            icon={<Bell className="h-4 w-4" />}
            label={t('settings.notifications.weekly')}
            checked={notifications.weekly}
            onChange={(v) => setNotifications((p: typeof notifications) => ({ ...p, weekly: v }))}
          />
        </div>
      </Card>

      <ModelSettingsCard />

      <Card>
        <CardHeader title={t('settings.security.title')} subtitle={t('settings.security.subtitle')} />
        <div className="flex flex-wrap items-center gap-2 text-sm text-[color:var(--color-fg-2)]">
          <Shield className="h-4 w-4" />
          <span>{t('settings.security.session')} {me.data ? t('settings.security.active') : '—'}</span>
          <Badge tone="emerald" size="xs" variant="outline">
            {t('settings.security.cookie')}
          </Badge>
        </div>
        <CardSection className="mt-3">
          <Button
            variant="danger"
            iconLeft={<LogOut className="h-4 w-4" />}
            onClick={async () => {
              // Route through useLogout so the TanStack Query cache
              // is cleared via qc.clear() — the bare fetch path would
              // only drop the cookie and the next user on this browser
              // would see the previous user's company data leak
              // (Product Debug #007).
              try {
                await logout.mutateAsync();
                redirectToLogin();
              } catch {
                toast.push({ tone: 'error', title: t('settings.signout_error') });
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
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-[color:var(--background)] transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
}