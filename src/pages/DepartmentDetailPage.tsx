import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  History,
  Loader2,
  Pause,
  Play,
  Power,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Badge, Dot } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { Field, Textarea } from '@/components/Field';
import { HealthCard } from '@/components/HealthCard';
import { TaskCard } from '@/components/TaskCard';
import { ActivityFeed } from '@/components/ActivityFeed';
import { EmptyState } from '@/components/EmptyState';
import { useToast } from '@/components/Toaster';
import { useI18n } from '@/i18n/I18nProvider';
import {
  useActivateDepartment,
  useDeactivateDepartment,
  useDepartment,
  useDepartmentCatalog,
  useDepartmentConfig,
  useDepartmentHealthCheck,
  useGrantLicense,
  useInternalMessages,
  useResumeDepartment,
  useSuspendDepartment,
  useTasks,
} from '@/api/queries';
import type { DepartmentCatalogEntry } from '@/api/schemas';
import { getDepartment, iconFromManifest } from '@/design-system/departments';
import { formatRelativeTime, truncate } from '@/utils/format';
import { cn } from '@/design-system/cn';

const lifecycleBadge: Record<string, { tone: 'emerald' | 'amber' | 'rose' | 'neutral' | 'cyan' | 'violet'; label: string }> = {
  active: { tone: 'emerald', label: 'Active' },
  licensed: { tone: 'violet', label: 'Licensed' },
  activating: { tone: 'cyan', label: 'Activating' },
  suspended: { tone: 'amber', label: 'Suspended' },
  deactivating: { tone: 'amber', label: 'Deactivating' },
  inactive: { tone: 'neutral', label: 'Inactive' },
  error: { tone: 'rose', label: 'Error' },
  available: { tone: 'neutral', label: 'Available' },
  installed: { tone: 'neutral', label: 'Installed' },
};

export default function DepartmentDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const def = useDepartment(id);
  const catalog = useDepartmentCatalog();
  const tasks = useTasks({ departmentKey: id, limit: 30 });
  const messages = useInternalMessages({ departmentKey: id, limit: 30 });
  const activate = useActivateDepartment();
  const deactivate = useDeactivateDepartment();
  const suspend = useSuspendDepartment();
  const resume = useResumeDepartment();
  const healthCheck = useDepartmentHealthCheck();
  const grantLicense = useGrantLicense();
  const updateConfig = useDepartmentConfig();
  const toast = useToast();

  const [configOpen, setConfigOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<Record<string, unknown>>({});

  const entry: DepartmentCatalogEntry | undefined = (catalog.data ?? []).find((c) => c.key === id);
  const presentation = getDepartment(id);
  const Icon =
    iconFromManifest(def.data?.manifest.icon ?? entry?.icon ?? '') ??
    presentation?.icon ??
    Compass;

  const lifecycle = def.data?.installation?.lifecycle ?? entry?.installation?.lifecycle ?? 'available';
  const health = def.data?.installation?.health ?? entry?.installation?.health ?? 'unknown';
  const badge = lifecycleBadge[lifecycle] ?? lifecycleBadge.available;
  const lastHealth = def.data?.lastHealth;
  const licenseStatus = def.data?.license?.status ?? entry?.license?.status ?? null;
  const role = def.data?.installation ? 'owner' : 'member';

  function onActivate() {
    activate.mutate(
      { id, body: {} },
      {
        onSuccess: () => toast.push({ tone: 'success', title: 'Department activated', description: `${entry?.name ?? id} is now active.` }),
        onError: (e: Error) => toast.push({ tone: 'error', title: 'Activation failed', description: e.message }),
      },
    );
  }
  function onDeactivate() {
    if (!confirm(`Deactivate ${entry?.name ?? id}? Data will be preserved.`)) return;
    deactivate.mutate(
      { id, reason: 'manual' },
      {
        onSuccess: () => toast.push({ tone: 'success', title: 'Department deactivated' }),
        onError: (e: Error) => toast.push({ tone: 'error', title: 'Deactivation failed', description: e.message }),
      },
    );
  }
  function onSuspend() {
    suspend.mutate(
      { id, reason: 'manual' },
      {
        onSuccess: () => toast.push({ tone: 'success', title: 'Department suspended' }),
        onError: (e: Error) => toast.push({ tone: 'error', title: 'Suspend failed', description: e.message }),
      },
    );
  }
  function onResume() {
    resume.mutate(
      { id, reason: 'manual' },
      {
        onSuccess: () => toast.push({ tone: 'success', title: t('toast.dept.resumed', 'Departamento reactivado') }),
        onError: (e: Error) => toast.push({ tone: 'error', title: t('toast.dept.resume_failed', 'No se pudo reactivar'), description: e.message }),
      },
    );
  }
  function onHealth() {
    healthCheck.mutate(id, {
      onSuccess: (data) => toast.push({
        tone: data.status === 'healthy' ? 'success' : 'info',
        title: t('toast.health.title', 'Estado del departamento'),
        description: t(`health.status.${data.status}`, data.status),
      }),
      onError: (e: Error) => toast.push({ tone: 'error', title: t('toast.health.error', 'No se pudo comprobar el estado'), description: e.message }),
    });
  }
  function onGrantLicense() {
    grantLicense.mutate(
      { id, body: { plan: 'lab', idempotencyKey: `portal-${id}-${Date.now()}` } },
      {
        onSuccess: () => toast.push({ tone: 'success', title: t('toast.dept.license_granted', 'Licencia concedida'), description: t('toast.dept.license_granted_desc', `Licencia de prueba aplicada a ${entry?.name ?? id}.`) }),
        onError: (e: Error) => toast.push({ tone: 'error', title: t('toast.dept.license_failed', 'No se pudo conceder la licencia'), description: e.message }),
      },
    );
  }
  function onSaveConfig() {
    updateConfig.mutate(
      { id, configuration: configDraft },
      {
        onSuccess: () => {
          toast.push({ tone: 'success', title: 'Configuration saved' });
          setConfigOpen(false);
        },
        onError: (e: Error) => toast.push({ tone: 'error', title: 'Save failed', description: e.message }),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link to="/departments" className="mt-1 text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] text-white"
            style={{
              backgroundColor: presentation?.cssVar
                ? `color-mix(in oklab, var(${presentation.cssVar}) 80%, transparent)`
                : 'var(--color-bg-3)',
              color: presentation?.cssVar ? `var(${presentation.cssVar})` : undefined,
            }}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {def.data?.manifest.name ?? entry?.name ?? id}
              </h1>
              <Badge tone={badge.tone} size="sm" icon={<Dot tone={badge.tone} pulse={lifecycle === 'active'} />}>
                {badge.label}
              </Badge>
              {licenseStatus && (
                <Badge tone={licenseStatus === 'active' ? 'emerald' : 'neutral'} size="sm" variant="outline">
                  License · {licenseStatus}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">{def.data?.manifest.description ?? entry?.description}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
              v{def.data?.manifest.version ?? entry?.version} · role: {role}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button iconLeft={<RefreshCw className="h-4 w-4" />} onClick={onHealth} loading={healthCheck.isPending}>
            Health check
          </Button>
          {lifecycle === 'active' && (
            <>
              <Button
                variant="outline"
                iconLeft={<SettingsIcon className="h-4 w-4" />}
                onClick={() => {
                  setConfigDraft(def.data?.installation?.configuration ?? {});
                  setConfigOpen(true);
                }}
              >
                Configure
              </Button>
              <Button
                variant="outline"
                iconLeft={<Pause className="h-4 w-4" />}
                onClick={onSuspend}
                loading={suspend.isPending}
              >
                Suspend
              </Button>
              <Button
                variant="danger"
                iconLeft={<Power className="h-4 w-4" />}
                onClick={onDeactivate}
                loading={deactivate.isPending}
              >
                Deactivate
              </Button>
            </>
          )}
          {lifecycle === 'suspended' && (
            <Button variant="primary" iconLeft={<Play className="h-4 w-4" />} onClick={onResume} loading={resume.isPending}>
              Resume
            </Button>
          )}
          {(lifecycle === 'available' || lifecycle === 'installed' || lifecycle === 'inactive') && (
            <Button variant="primary" iconLeft={<Power className="h-4 w-4" />} onClick={onActivate} loading={activate.isPending}>
              {lifecycle === 'inactive' ? 'Reactivate' : 'Activate'}
            </Button>
          )}
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <HealthCard
          title={t('health.lifecycle.title', 'Estado operativo')}
          subtitle={t(`lifecycle.${lifecycle}`, lifecycle)}
          status={lifecycle === 'active' ? 'healthy' : lifecycle === 'error' ? 'unhealthy' : lifecycle === 'suspended' ? 'degraded' : 'unknown'}
          checkedAt={def.data?.installation?.activated_at ?? entry?.installation?.activated_at}
          durationMs={lastHealth?.duration_ms}
        />
        <HealthCard
          title={t('health.health.title', 'Salud')}
          subtitle={t(`health.status.${health}`, health)}
          status={health}
          checkedAt={lastHealth?.checked_at ?? entry?.last_health?.checked_at}
          durationMs={lastHealth?.duration_ms ?? entry?.last_health?.duration_ms}
        />
        <Card>
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-3)]">Manager</div>
          <div className="mt-2 text-sm font-medium text-[color:var(--color-fg-1)]">
            {def.data?.manager?.agent_id ?? entry?.manager?.agent_id ?? '—'}
          </div>
          <div className="mt-1 text-xs text-[color:var(--color-fg-3)]">
            {entry?.manager ? `Visto por última vez ${formatRelativeTime(entry.manager.last_seen_at)}` : 'Sin registrar'}
          </div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-fg-3)]">License</div>
          <div className="mt-2 text-sm font-medium text-[color:var(--color-fg-1)]">
            {def.data?.license?.plan ?? entry?.license?.plan ?? 'No license'}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[color:var(--color-fg-3)]">
            {def.data?.license?.status ?? entry?.license?.status ?? 'unlicensed'}
            {!entry?.license && (
              <Button size="sm" variant="ghost" iconLeft={<ShieldCheck className="h-3.5 w-3.5" />} onClick={onGrantLicense} loading={grantLicense.isPending}>
                Grant lab license
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Capabilities */}
          <Card>
            <CardHeader title="Qué puede hacer" subtitle="Capacidades reales de este equipo" />
            <div className="flex flex-wrap gap-2">
              {(def.data?.manifest.capabilities ?? entry?.capabilities ?? []).map((c) => (
                <span
                  key={c}
                  className="inline-flex h-7 items-center rounded-full bg-[color:var(--color-bg-3)] px-3 text-xs text-[color:var(--color-fg-2)]"
                >
                  {c}
                </span>
              ))}
            </div>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader
              title="Tareas recientes"
              subtitle={`${(tasks.data ?? []).length} en ${entry?.name ?? id}`}
              action={
                <Link to="/tasks" className="text-xs text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]">
                  Ver cola completa →
                </Link>
              }
            />
            {(tasks.data ?? []).length === 0 ? (
              <EmptyState
                icon={<ClipboardList className="h-5 w-5" />}
                title="Aún no hay tareas"
                description="Cuando el equipo empiece a trabajar, las tareas aparecerán aquí."
              />
            ) : (
              <ul className="space-y-2">
                {(tasks.data ?? []).slice(0, 8).map((t) => (
                  <li key={t.id}>
                    <TaskCard task={t} onClick={() => (window.location.href = `/tasks/${t.id}`)} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader title="Actividad del equipo" subtitle="Últimos mensajes y tareas del departamento" />
            <ActivityFeed tasks={tasks.data ?? []} messages={messages.data ?? []} limit={15} />
          </Card>

          {/* Audit / last health detail */}
          <Card>
            <CardHeader title="Última comprobación" subtitle="Detalle del último chequeo de salud" />
            {lastHealth ? (
              <div className="space-y-2">
                <div className="text-xs text-[color:var(--color-fg-3)]">
                  {formatRelativeTime(lastHealth.checked_at)} · {lastHealth.status}
                </div>
                <ul className="space-y-1">
                  {Object.entries((lastHealth.checks ?? {}) as Record<string, { ok?: boolean; message?: string }>).map(([name, info]) => (
                    <li
                      key={name}
                      className={cn(
                        'flex items-center justify-between rounded-md border border-[color:var(--color-line)] px-3 py-1.5 text-xs',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {info?.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-emerald)]" />
                        ) : (
                          <Wrench className="h-3.5 w-3.5 text-[color:var(--color-amber)]" />
                        )}
                        {name}
                      </span>
                      <span className="text-[color:var(--color-fg-3)]">{info?.message ?? ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState
                icon={<History className="h-5 w-5" />}
                title="Aún no hay comprobaciones"
                description="Lanza una desde la barra superior para ver el detalle."
                action={<Button onClick={onHealth} loading={healthCheck.isPending}>Comprobar ahora</Button>}
              />
            )}
          </Card>
        </div>

        <div className="space-y-6">
          {/* Manager */}
          <Card>
            <CardHeader title="Dirección del equipo" subtitle="Persona responsable de coordinar este departamento" />
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)]">
                <Bot className="h-5 w-5 text-[color:var(--color-fg-2)]" />
              </div>
              <div>
                <div className="text-sm font-medium text-[color:var(--color-fg-1)]">
                  {def.data?.manager?.agent_id ?? entry?.manager?.agent_id ?? `${id}-manager`}
                </div>
                <div className="text-xs text-[color:var(--color-fg-3)]">
                  Cargo: {def.data?.manager?.role ?? 'Dirección'}
                </div>
                <div className="mt-2">
                  <Badge tone={entry?.manager?.status === 'active' ? 'emerald' : 'neutral'} size="xs" icon={<Dot tone={entry?.manager?.status === 'active' ? 'emerald' : 'neutral'} pulse={entry?.manager?.status === 'active'} />}>
                    {entry?.manager?.status ?? 'unknown'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Specialists (inferred from capabilities) */}
          <Card>
            <CardHeader title="Capacidades y especialistas" subtitle="Cada capacidad se asigna a un especialista" />
            <ul className="space-y-2 text-sm">
              {(def.data?.manifest.capabilities ?? entry?.capabilities ?? []).map((cap) => (
                <li
                  key={cap}
                  className="flex items-center justify-between rounded-md border border-[color:var(--color-line)] px-3 py-2"
                >
                  <span className="text-[color:var(--color-fg-2)]">{cap}</span>
                  <Badge tone="cyan" size="xs">especialista</Badge>
                </li>
              ))}
            </ul>
          </Card>

          {/* Dependencies */}
          {(def.data?.manifest.dependencies ?? entry?.dependencies ?? []).length > 0 && (
            <Card>
              <CardHeader title="Dependencias" />
              <ul className="space-y-1 text-sm">
                {(def.data?.manifest.dependencies ?? entry?.dependencies ?? []).map((d) => (
                  <li key={d} className="flex items-center gap-2 text-[color:var(--color-fg-2)]">
                    <ChevronRight className="h-3 w-3 text-[color:var(--color-fg-3)]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Workspace */}
          {def.data?.installation?.workspace_path && (
            <Card>
              <CardHeader title="Espacio de trabajo" subtitle="Ruta donde corre este departamento" />
              <code className="block break-all rounded-md bg-[color:var(--color-bg-3)] px-3 py-2 font-mono text-xs text-[color:var(--color-fg-2)]">
                {def.data.installation.workspace_path}
              </code>
            </Card>
          )}

          {/* Errors */}
          {def.data?.installation?.last_error && (
            <Card>
              <CardHeader title="Último error" />
              <Textarea defaultValue={truncate(def.data.installation.last_error, 240)} readOnly rows={3} />
            </Card>
          )}

          {/* Audit hint */}
          <Card>
            <CardHeader title="Historial" subtitle="Cada cambio de estado queda registrado" />
            <p className="text-xs text-[color:var(--color-fg-3)]">
              Cada activación, suspensión o desactivación se añade al historial corporativo. Consulta la página de Analítica para una visión global.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--color-fg-3)]">
              <ClipboardList className="h-3.5 w-3.5" />
              {def.data?.installation?.activated_at
                ? `Activado ${formatRelativeTime(def.data.installation.activated_at)}`
                : 'Nunca activado'}
            </div>
          </Card>
        </div>
      </div>

      <Drawer
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title={`Configure ${entry?.name ?? id}`}
        width="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfigOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" iconLeft={<SettingsIcon className="h-4 w-4" />} onClick={onSaveConfig} loading={updateConfig.isPending}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-[color:var(--color-fg-3)]">
            These settings are validated against the manifest's <code>configurationSchema</code>.
          </p>
          <Field
            label="Modo de aprobación"
            hint="Híbrido = aprobación automática para bajo riesgo, manual para alto riesgo"
            value={(configDraft.approval_mode as string) ?? 'hybrid'}
            onChange={(e) => setConfigDraft((p) => ({ ...p, approval_mode: e.target.value }))}
          />
          <Field
            label="Max concurrent tasks"
            type="number"
            min={1}
            value={(configDraft.max_concurrent_tasks as number) ?? 5}
            onChange={(e) => setConfigDraft((p) => ({ ...p, max_concurrent_tasks: Number(e.target.value) }))}
          />
          <Field
            label="Default language"
            value={(configDraft.default_language as string) ?? 'es'}
            onChange={(e) => setConfigDraft((p) => ({ ...p, default_language: e.target.value }))}
          />
        </div>
      </Drawer>
    </div>
  );
}