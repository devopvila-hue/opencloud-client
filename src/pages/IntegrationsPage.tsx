import { Cloud, KeyRound, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { useI18n } from '@/i18n/I18nProvider';

interface Integration {
  id: string;
  name: string;
  category: 'productivity' | 'communication' | 'crm' | 'finance' | 'storage' | 'social' | 'developer';
  icon: LucideIcon;
  description: string;
  comingSoon: true;
}

const integrationIds = ['google', 'microsoft', 'slack', 'discord', 'hubspot', 'salesforce', 'pipedrive', 'stripe', 'meta', 'linkedin'] as const;
type IntegrationId = (typeof integrationIds)[number];
const integrationCategory: Record<IntegrationId, Integration['category']> = {
  google: 'productivity',
  microsoft: 'productivity',
  slack: 'communication',
  discord: 'communication',
  hubspot: 'crm',
  salesforce: 'crm',
  pipedrive: 'crm',
  stripe: 'finance',
  meta: 'social',
  linkedin: 'social',
};

const categories = ['all', 'productivity', 'communication', 'crm', 'finance', 'social'] as const;

export default function IntegrationsPage() {
  const { t } = useI18n();
  const integrations: Integration[] = integrationIds.map((id) => ({
    id,
    name: t(`integrations.item.${id}.name`),
    category: integrationCategory[id],
    icon: Cloud,
    description: t(`integrations.item.${id}.desc`),
    comingSoon: true,
  }));
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={t('integrations.header.title')}
        subtitle={t('integrations.header.subtitle')}
      />

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
              {t(`integrations.category.${c}`)}
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