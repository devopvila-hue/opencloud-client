import { Link, useParams } from 'react-router-dom';
import { Building2, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Field, Textarea } from '@/components/Field';
import { useCompany, useMemoryFile, useMemoryList, usePatchCompany, useRegenerateMemory } from '@/api/queries';
import { useToast } from '@/components/Toaster';
import { useI18n } from '@/i18n/I18nProvider';
import { formatRelativeTime } from '@/utils/format';

export default function CompanyPage() {
  const { t } = useI18n();
  const company = useCompany();
  const patch = usePatchCompany();
  const regen = useRegenerateMemory();
  const memory = useMemoryList();
  const toast = useToast();

  if (company.isLoading) {
    return <div className="mx-auto w-full max-w-5xl p-6"><div className="shimmer h-40 rounded-[var(--radius-lg)]" /></div>;
  }

  if (!company.data) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={t('company.empty.title')}
          description={t('company.empty.desc')}
        />
      </div>
    );
  }
  const c = company.data;

  async function save(patchObj: Parameters<typeof patch.mutate>[0]) {
    try {
      await patch.mutateAsync(patchObj);
      toast.push({ tone: 'success', title: t('company.toast.updated') });
    } catch (e) {
      toast.push({ tone: 'error', title: t('company.toast.update_failed'), description: (e as Error).message });
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-white"
            style={{ background: `linear-gradient(135deg, ${c.primary_color || 'var(--color-accent)'}, ${c.accent_color || 'var(--color-cyan)'})` }}
          >
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{c.name}</h1>
            <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">{c.description ?? t('company.no_description')}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="violet" size="xs">{c.brand ?? t('company.brand_placeholder')}</Badge>
              <Badge tone="cyan" size="xs" variant="outline">{c.sector ?? t('company.sector_placeholder')}</Badge>
              <Badge tone="neutral" size="xs" variant="outline">{c.country ?? t('company.country_placeholder')}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title={t('company.cards.profile')} subtitle={t('company.cards.profile_sub')} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={t('company.fields.name')}
                defaultValue={c.name}
                onBlur={(e) => save({ id: c.id, patch: { name: e.target.value } })}
              />
              <Field
                label={t('company.fields.brand')}
                defaultValue={c.brand ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { brand: e.target.value } })}
              />
              <Field
                label={t('company.fields.domain')}
                defaultValue={c.domain ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { domain: e.target.value } })}
              />
              <Field
                label={t('company.fields.sector')}
                defaultValue={c.sector ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { sector: e.target.value } })}
              />
              <Field
                label={t('company.fields.country')}
                defaultValue={c.country ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { country: e.target.value } })}
              />
              <Field
                label={t('company.fields.employees')}
                defaultValue={c.employees ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { employees: e.target.value } })}
              />
            </div>
            <div className="mt-3">
              <Textarea
                label={t('company.fields.description')}
                defaultValue={c.description ?? ''}
                rows={3}
                onBlur={(e) => save({ id: c.id, patch: { description: e.target.value } })}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field
                label={t('company.fields.primary_color')}
                defaultValue={c.primary_color}
                onBlur={(e) => save({ id: c.id, patch: { primary_color: e.target.value } })}
              />
              <Field
                label={t('company.fields.secondary_color')}
                defaultValue={c.secondary_color}
                onBlur={(e) => save({ id: c.id, patch: { secondary_color: e.target.value } })}
              />
              <Field
                label={t('company.fields.accent_color')}
                defaultValue={c.accent_color}
                onBlur={(e) => save({ id: c.id, patch: { accent_color: e.target.value } })}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title={t('company.cards.branding')}
              subtitle={t('company.cards.branding_sub')}
            />
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)]">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="h-16 w-16 rounded-[var(--radius-md)] object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-[color:var(--color-fg-3)]" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <Field
                  label={t('company.fields.logo_url')}
                  defaultValue={c.logo_url ?? ''}
                  placeholder="https://example.com/logo.png"
                  onBlur={(e) => save({ id: c.id, patch: { logo_url: e.target.value } })}
                />
                <Field
                  label={t('company.fields.brand')}
                  defaultValue={c.brand ?? ''}
                  onBlur={(e) => save({ id: c.id, patch: { brand: e.target.value } })}
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-[color:var(--color-fg-3)]">{t('company.color.primary')}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={c.primary_color}
                        onChange={(e) => save({ id: c.id, patch: { primary_color: e.target.value } })}
                        className="h-7 w-7 cursor-pointer rounded-[var(--radius-sm)] border border-[color:var(--color-line)] p-0.5"
                      />
                      <Field label="" defaultValue={c.primary_color} onBlur={(e) => save({ id: c.id, patch: { primary_color: e.target.value } })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[color:var(--color-fg-3)]">{t('company.color.secondary')}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={c.secondary_color}
                        onChange={(e) => save({ id: c.id, patch: { secondary_color: e.target.value } })}
                        className="h-7 w-7 cursor-pointer rounded-[var(--radius-sm)] border border-[color:var(--color-line)] p-0.5"
                      />
                      <Field label="" defaultValue={c.secondary_color} onBlur={(e) => save({ id: c.id, patch: { secondary_color: e.target.value } })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[color:var(--color-fg-3)]">{t('company.color.accent')}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={c.accent_color}
                        onChange={(e) => save({ id: c.id, patch: { accent_color: e.target.value } })}
                        className="h-7 w-7 cursor-pointer rounded-[var(--radius-sm)] border border-[color:var(--color-line)] p-0.5"
                      />
                      <Field label="" defaultValue={c.accent_color} onBlur={(e) => save({ id: c.id, patch: { accent_color: e.target.value } })} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title={t('company.cards.services')} subtitle={t('company.cards.services_sub')} />
            <Textarea
              label={t('company.fields.services')}
              defaultValue={c.services.join('\n')}
              rows={3}
              onBlur={(e) =>
                save({
                  id: c.id,
                  patch: { services: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) },
                })
              }
            />
          </Card>

          <Card>
            <CardHeader title={t('company.cards.products')} subtitle={t('company.cards.products_sub')} />
            <Textarea
              label={t('company.fields.products')}
              defaultValue={c.products.join('\n')}
              rows={3}
              onBlur={(e) =>
                save({
                  id: c.id,
                  patch: { products: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) },
                })
              }
            />
          </Card>

          <Card>
            <CardHeader
              title={t('company.cards.memory')}
              subtitle={t('company.cards.memory_sub')}
              action={
                <Button
                  variant="primary"
                  iconLeft={<RefreshCw className="h-4 w-4" />}
                  onClick={() => regen.mutate(undefined, { onSuccess: () => toast.push({ tone: 'success', title: t('company.toast.regenerated') }) })}
                  loading={regen.isPending}
                >
                  {t('company.regenerate')}
                </Button>
              }
            />
            {(memory.data ?? []).length === 0 ? (
              <EmptyState icon={<FileText className="h-5 w-5" />} title={t('company.memory.empty')} />
            ) : (
              <ul className="divide-y divide-[color:var(--color-line)]">
                {(memory.data ?? []).map((m) => (
                  <li key={m.id}>
                    <Link
                      to={`/company/memory/${m.file_key}`}
                      className="flex items-center gap-3 py-2.5 hover:bg-[color:var(--color-bg-3)]"
                    >
                      <FileText className="h-4 w-4 text-[color:var(--color-fg-3)]" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{m.title}</div>
                        <div className="text-xs text-[color:var(--color-fg-3)]">v{m.version} · {formatRelativeTime(m.updated_at)}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[color:var(--color-fg-3)]" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('company.cards.mission_vision')} />
            <Textarea
              label={t('company.fields.mission')}
              defaultValue={c.mission ?? ''}
              rows={3}
              onBlur={(e) => save({ id: c.id, patch: { mission: e.target.value } })}
            />
            <div className="mt-3">
              <Textarea
                label={t('company.fields.vision')}
                defaultValue={c.vision ?? ''}
                rows={3}
                onBlur={(e) => save({ id: c.id, patch: { vision: e.target.value } })}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title={t('company.cards.goals')} />
            <Textarea
              label={t('company.fields.goals')}
              defaultValue={c.goals.join('\n')}
              rows={4}
              onBlur={(e) =>
                save({
                  id: c.id,
                  patch: { goals: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) },
                })
              }
            />
          </Card>

          <Card>
            <CardHeader title={t('company.cards.team')} subtitle={t('company.cards.team_sub')} />
            <div className="space-y-2">
              {c.clients.length > 0
                ? c.clients.map((client) => (
                    <div key={client} className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-2.5">
                      <Building2 className="h-4 w-4 text-[color:var(--color-fg-3)]" />
                      <span className="text-sm text-[color:var(--color-fg-1)]">{client}</span>
                    </div>
                  ))
                : (
                  <p className="text-xs text-[color:var(--color-fg-3)]">
                    {t('company.team.empty')}
                  </p>
                )}
            </div>
          </Card>

          <Card>
            <CardHeader title={t('company.cards.contact')} />
            <div className="grid grid-cols-1 gap-3">
              <Field
                label={t('company.fields.email')}
                defaultValue={c.email ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { email: e.target.value } })}
              />
              <Field
                label={t('company.fields.phone')}
                defaultValue={c.phone ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { phone: e.target.value } })}
              />
              <Field
                label={t('company.fields.address')}
                defaultValue={c.address ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { address: e.target.value } })}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}