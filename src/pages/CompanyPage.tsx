import { Link, useParams } from 'react-router-dom';
import { Building2, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Field, Textarea } from '@/components/Field';
import { useCompany, useMemoryFile, useMemoryList, usePatchCompany, useRegenerateMemory } from '@/api/queries';
import { useToast } from '@/components/Toaster';
import { formatRelativeTime } from '@/utils/format';

export default function CompanyPage() {
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
          title="No company profile yet"
          description="Create your company profile to start personalising your departments."
        />
      </div>
    );
  }
  const c = company.data;

  async function save(patchObj: Parameters<typeof patch.mutate>[0]) {
    try {
      await patch.mutateAsync(patchObj);
      toast.push({ tone: 'success', title: 'Company updated' });
    } catch (e) {
      toast.push({ tone: 'error', title: 'Update failed', description: (e as Error).message });
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
            <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">{c.description ?? 'No description set yet.'}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="violet" size="xs">{c.brand ?? 'brand'}</Badge>
              <Badge tone="cyan" size="xs" variant="outline">{c.sector ?? 'sector'}</Badge>
              <Badge tone="neutral" size="xs" variant="outline">{c.country ?? 'country'}</Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader title="Profile" subtitle="Edit fields and save individually" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Name"
                defaultValue={c.name}
                onBlur={(e) => save({ id: c.id, patch: { name: e.target.value } })}
              />
              <Field
                label="Brand"
                defaultValue={c.brand ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { brand: e.target.value } })}
              />
              <Field
                label="Domain"
                defaultValue={c.domain ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { domain: e.target.value } })}
              />
              <Field
                label="Sector"
                defaultValue={c.sector ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { sector: e.target.value } })}
              />
              <Field
                label="Country"
                defaultValue={c.country ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { country: e.target.value } })}
              />
              <Field
                label="Employees"
                defaultValue={c.employees ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { employees: e.target.value } })}
              />
            </div>
            <div className="mt-3">
              <Textarea
                label="Description"
                defaultValue={c.description ?? ''}
                rows={3}
                onBlur={(e) => save({ id: c.id, patch: { description: e.target.value } })}
              />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field
                label="Primary color"
                defaultValue={c.primary_color}
                onBlur={(e) => save({ id: c.id, patch: { primary_color: e.target.value } })}
              />
              <Field
                label="Secondary color"
                defaultValue={c.secondary_color}
                onBlur={(e) => save({ id: c.id, patch: { secondary_color: e.target.value } })}
              />
              <Field
                label="Accent color"
                defaultValue={c.accent_color}
                onBlur={(e) => save({ id: c.id, patch: { accent_color: e.target.value } })}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Corporate memory"
              subtitle="Versioned files maintained by the Executive Director"
              action={
                <Button
                  variant="primary"
                  iconLeft={<RefreshCw className="h-4 w-4" />}
                  onClick={() => regen.mutate(undefined, { onSuccess: () => toast.push({ tone: 'success', title: 'Memory regenerated' }) })}
                  loading={regen.isPending}
                >
                  Regenerate
                </Button>
              }
            />
            {(memory.data ?? []).length === 0 ? (
              <EmptyState icon={<FileText className="h-5 w-5" />} title="No memory files yet" />
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
            <CardHeader title="Mission & vision" />
            <Textarea
              label="Mission"
              defaultValue={c.mission ?? ''}
              rows={3}
              onBlur={(e) => save({ id: c.id, patch: { mission: e.target.value } })}
            />
            <div className="mt-3">
              <Textarea
                label="Vision"
                defaultValue={c.vision ?? ''}
                rows={3}
                onBlur={(e) => save({ id: c.id, patch: { vision: e.target.value } })}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Goals" />
            <Textarea
              label="Active goals (one per line)"
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
            <CardHeader title="Contact" />
            <div className="grid grid-cols-1 gap-3">
              <Field
                label="Email"
                defaultValue={c.email ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { email: e.target.value } })}
              />
              <Field
                label="Phone"
                defaultValue={c.phone ?? ''}
                onBlur={(e) => save({ id: c.id, patch: { phone: e.target.value } })}
              />
              <Field
                label="Address"
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