import { Cloud, KeyRound, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { useI18n } from '@/i18n/I18nProvider';

interface Integration {
  id: string;
  name: string;
  category: 'productivity' | 'communication' | 'crm' | 'finance' | 'storage' | 'social' | 'developer';
  icon: LucideIcon;
  description: string;
  comingSoon: true;
}

const integrations: Integration[] = [
  { id: 'google', name: 'Google Workspace', category: 'productivity', icon: Cloud, description: 'Gmail, Calendar, Drive, Docs.', comingSoon: true },
  { id: 'microsoft', name: 'Microsoft 365', category: 'productivity', icon: Cloud, description: 'Outlook, OneDrive, Teams, Excel.', comingSoon: true },
  { id: 'slack', name: 'Slack', category: 'communication', icon: Cloud, description: 'Channels, DMs and notifications.', comingSoon: true },
  { id: 'discord', name: 'Discord', category: 'communication', icon: Cloud, description: 'Servers and bots.', comingSoon: true },
  { id: 'hubspot', name: 'HubSpot', category: 'crm', icon: Cloud, description: 'Contacts, deals and pipelines.', comingSoon: true },
  { id: 'salesforce', name: 'Salesforce', category: 'crm', icon: Cloud, description: 'Enterprise CRM.', comingSoon: true },
  { id: 'pipedrive', name: 'Pipedrive', category: 'crm', icon: Cloud, description: 'Pipeline & deal tracking.', comingSoon: true },
  { id: 'stripe', name: 'Stripe', category: 'finance', icon: Cloud, description: 'Payments, subscriptions, invoices.', comingSoon: true },
  { id: 'meta', name: 'Meta', category: 'social', icon: Cloud, description: 'Facebook + Instagram Graph API.', comingSoon: true },
  { id: 'linkedin', name: 'LinkedIn', category: 'social', icon: Cloud, description: 'Pages, leads and conversation ads.', comingSoon: true },
];

const categories = ['all', 'productivity', 'communication', 'crm', 'finance', 'social'] as const;

export default function IntegrationsPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('nav.integrations')}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
          {t('integrations.header.subtitle')}
        </p>
      </header>

      <Card>
        <CardHeader title={t('integrations.api_keys')} subtitle={t('integrations.api_keys_sub')} />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-3">
          <div className="flex items-center gap-2 text-sm text-[color:var(--color-fg-2)]">
            <KeyRound className="h-4 w-4" />
            <span>{t('integrations.no_keys')}</span>
          </div>
          <Button variant="outline" disabled>
            {t('integrations.generate')}
          </Button>
        </div>
      </Card>

      <section>
        <div className="mb-3 flex flex-wrap gap-1 text-xs">
          {categories.map((c) => (
            <span
              key={c}
              className="rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] px-3 py-1 text-[color:var(--color-fg-3)]"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((it) => {
            const Icon = it.icon;
            return (
              <Card key={it.id} padding="md">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)] text-[color:var(--color-fg-2)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{it.name}</h3>
                      <Badge tone="amber" size="xs">{t('megamenu.coming.title')}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-[color:var(--color-fg-3)]">{it.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <Button size="sm" variant="outline" disabled>
                    {t('integrations.connect')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}