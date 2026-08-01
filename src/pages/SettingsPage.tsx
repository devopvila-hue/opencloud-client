import { useState, useEffect } from 'react';
import { Bell, Languages, LogOut, Moon, Palette, Shield, Sun, User2, Key, Eye, EyeOff, Plus, Trash2, ExternalLink, Check } from 'lucide-react';
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
import { formatRelativeTime } from '@/utils/format';
import { redirectToLogin } from '@/utils/authRedirect';

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
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [showProviderForm, setShowProviderForm] = useState<ProviderId | null>(null);
  const [saving, setSaving] = useState(false);

  // The language selector drives locale directly — changes are
  // persisted immediately to localStorage (see I18nProvider) but
  // we ALSO surface a toast + banner so the user gets feedback.
  const [langDirty, setLangDirty] = useState(false);

  function addProvider(providerId: ProviderId, name: string, key: string, endpoint?: string) {
    const pres = providerPresets.find((p) => p.id === providerId);
    setProviders((prev) => [
      ...prev,
      {
        id: `${providerId}-${Date.now()}`,
        providerId,
        name,
        key,
        endpoint,
        lastUsed: null,
        status: 'active',
        icon: pres?.icon ?? Key,
        label: pres?.label ?? providerId,
        color: pres?.color ?? 'var(--accent)',
      },
    ]);
    toast.push({ tone: 'success', title: `${pres?.label ?? providerId} key saved` });
  }

  function removeProvider(id: string) {
    setProviders((prev) => prev.filter((p) => p.id !== id));
    toast.push({ tone: 'info', title: t('settings.ai_providers.title') });
  }

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
        <CardHeader title={t('settings.profile.title')} subtitle="Information tied to your account" />
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
        <CardHeader title={t('settings.notifications.title')} subtitle="Choose how the portal reaches you" />
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

      <Card>
        <CardHeader
          title={t('settings.ai_providers.title')}
          subtitle={t('settings.ai_providers.subtitle')}
        />
        <CardSection>
          {providers.length === 0 ? (
            <EmptyProviderState onAdd={() => setShowProviderForm('openai')} />
          ) : (
            <div className="space-y-2">
              {providers.map((p) => (
                <ProviderRow key={p.id} provider={p} onRemove={() => removeProvider(p.id)} />
              ))}
            </div>
          )}
          {showProviderForm && (
            <ProviderForm
              provider={showProviderForm}
              onSave={(name, key, endpoint) => {
                addProvider(showProviderForm, name, key, endpoint);
                setShowProviderForm(null);
              }}
              onCancel={() => setShowProviderForm(null)}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            iconLeft={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setShowProviderForm('openai')}
            className="mt-3"
          >
            Add provider
          </Button>
        </CardSection>
        <CardSection className="border-t border-[color:var(--color-line)] pt-3">
          <details className="text-xs text-[color:var(--color-fg-3)]">
            <summary className="cursor-pointer font-medium text-[color:var(--color-fg-2)]">
              How BYOK works
            </summary>
            <p className="mt-1.5 text-pretty">
              Your key is sent directly from the browser to the OpenClaw Gateway. The middleware
              proxies requests without ever logging the key. Keys are encrypted at rest using the
              organization master secret. Remove any key at any time.
            </p>
          </details>
        </CardSection>
      </Card>

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
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  );
}

// ── BYOK AI Providers ──────────────────────────────────────────

type ProviderId = 'openai' | 'anthropic' | 'google' | 'nvidia' | 'openrouter' | 'xai' | 'deepseek' | 'openai-compatible';

interface ProviderPreset {
  id: ProviderId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  endpointLabel?: string;
  endpointPlaceholder?: string;
  endpointDefault?: string;
}

const providerPresets: ProviderPreset[] = [
  { id: 'openai', label: 'OpenAI', icon: Key, color: 'var(--color-dept-revenue)', endpointLabel: 'Base URL (optional)', endpointPlaceholder: 'https://api.openai.com/v1' },
  { id: 'anthropic', label: 'Anthropic', icon: Key, color: 'var(--color-dept-governance)' },
  { id: 'google', label: 'Google', icon: Key, color: 'var(--color-dept-operations)' },
  { id: 'nvidia', label: 'NVIDIA', icon: Key, color: 'var(--color-dept-people)' },
  { id: 'openrouter', label: 'OpenRouter', icon: Key, color: 'var(--color-dept-customer)' },
  { id: 'xai', label: 'xAI', icon: Key, color: 'var(--color-dept-compliance)' },
  { id: 'deepseek', label: 'DeepSeek', icon: Key, color: 'var(--color-dept-revenue)' },
  { id: 'openai-compatible', label: 'OpenAI Compatible', icon: Key, color: 'var(--accent)', endpointLabel: 'Base URL', endpointPlaceholder: 'https://your-endpoint.com/v1', endpointDefault: '' },
];

interface ProviderRecord {
  id: string;
  providerId: ProviderId;
  name: string;
  key: string;
  endpoint?: string;
  lastUsed: string | null;
  status: 'active' | 'error';
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

function EmptyProviderState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center">
      <Key className="mx-auto h-8 w-8 text-[color:var(--color-fg-3)]" />
      <p className="mt-2 text-sm text-[color:var(--color-fg-2)]">No AI providers configured yet.</p>
      <p className="mt-1 text-xs text-[color:var(--color-fg-3)]">
        Add your first provider key to let departments make autonomous requests.
      </p>
      <Button size="sm" iconLeft={<Plus className="h-3.5 w-3.5" />} onClick={onAdd} className="mt-3">
        Add a provider
      </Button>
    </div>
  );
}

function ProviderRow({ provider, onRemove }: { provider: ProviderRecord; onRemove: () => void }) {
  const { t } = useI18n();
  const [revealed, setRevealed] = useState(false);
  const PresIcon = provider.icon;
  const masked = '•'.repeat(Math.min(provider.key.length, 8)) + provider.key.slice(-4);
  return (
    <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-3">
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
        >
          <PresIcon className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-[color:var(--color-fg-1)]">{provider.name || provider.label}</span>
            <Badge tone={provider.status === 'active' ? 'emerald' : 'rose'} size="xs" icon={<span className="h-1.5 w-1.5 rounded-full" />} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[color:var(--color-fg-3)]">
            <span className="font-mono">{revealed ? provider.key : masked}</span>
            <button
              type="button"
              onClick={() => setRevealed(!revealed)}
              className="rounded p-0.5 text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]"
              aria-label={revealed ? t('settings.ai_providers.mask') : t('settings.ai_providers.reveal')}
            >
              {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>
          {provider.lastUsed && (
            <div className="mt-0.5 text-[10px] text-[color:var(--color-fg-3)]">
              {t('settings.ai_providers.last_used')}{' '}{formatRelativeTime(provider.lastUsed)}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-md p-1.5 text-[color:var(--color-fg-3)] hover:bg-[color:var(--color-bg-3)] hover:text-[color:var(--color-rose)]"
        aria-label={t('common.delete')}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProviderForm({
  provider,
  onSave,
  onCancel,
}: {
  provider: ProviderId;
  onSave: (name: string, key: string, endpoint?: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState<string>(provider);
  const [key, setKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const pres = providerPresets.find((p) => p.id === provider);

  return (
    <div className="mt-4 space-y-3 rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface-soft)]/30 p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)]"
          style={{ backgroundColor: `${pres?.color ?? 'var(--accent)'}20`, color: pres?.color ?? 'var(--accent)' }}
        >
          {pres ? <pres.icon className="h-4 w-4" /> : <Key className="h-4 w-4" />}
        </span>
        <h4 className="font-medium text-[color:var(--foreground)]">{pres?.label ?? provider}</h4>
      </div>
      <input
        type="text"
        placeholder={t('settings.ai_providers.empty.cta')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] px-3 py-2 text-sm text-[color:var(--color-fg-1)] placeholder:text-[color:var(--color-fg-3)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      />
      <input
        type="password"
        placeholder={t('settings.ai_providers.key_placeholder')}
        value={key}
        onChange={(e) => setKey(e.target.value)}
        className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] px-3 py-2 text-sm font-mono text-[color:var(--color-fg-1)] placeholder:text-[color:var(--color-fg-3)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      />
      {pres?.endpointLabel && (
        <input
          type="url"
          placeholder={pres.endpointPlaceholder}
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] px-3 py-2 text-sm text-[color:var(--color-fg-1)] placeholder:text-[color:var(--color-fg-3)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
        />
      )}
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant="primary"
          iconLeft={<Check className="h-3.5 w-3.5" />}
          disabled={!key.trim()}
          onClick={() => onSave(name, key, endpoint || undefined)}
        >
          Save key
        </Button>
      </div>
    </div>
  );
}