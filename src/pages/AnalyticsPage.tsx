import { useMemo } from 'react';
import { Activity, BarChart3, Cpu, Layers, Sparkles, Timer } from 'lucide-react';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MetricTile } from '@/components/MetricTile';
import { BarChart } from '@/components/Chart';
import { useDepartmentCatalog, useInternalMessages, useSystemStatus, useTasks } from '@/api/queries';
import { getDepartment } from '@/design-system/departments';
import { formatDuration } from '@/utils/format';
import { useI18n } from '@/i18n/I18nProvider';

export default function AnalyticsPage() {
  const { t } = useI18n();
  const system = useSystemStatus();
  const tasks = useTasks({ limit: 200 });
  const messages = useInternalMessages({ limit: 200 });
  const catalog = useDepartmentCatalog();

  const tasksByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks.data ?? []) map.set(t.department_key, (map.get(t.department_key) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [tasks.data]);

  const messagesByType = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of messages.data ?? []) {
      const k = m.type.replace('task.', '');
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [messages.data]);

  const completion = useMemo(() => {
    const all = tasks.data ?? [];
    if (all.length === 0) return 0;
    return Math.round((all.filter((t) => t.status === 'completed').length / all.length) * 100);
  }, [tasks.data]);

  const avgLatency = useMemo(() => {
    const checks = (catalog.data ?? []).map((d) => d.last_health?.duration_ms ?? 0).filter((n) => n > 0);
    if (checks.length === 0) return null;
    return Math.round(checks.reduce((a, b) => a + b, 0) / checks.length);
  }, [catalog.data]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('analytics.header.title')}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
          {t('analytics.header.subtitle')}
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label={t('analytics.kpi.total')} value={(tasks.data ?? []).length} icon={<Layers className="h-4 w-4" />} accent="--color-dept-governance" />
        <MetricTile label={t('analytics.kpi.completion')} value={`${completion}%`} icon={<Sparkles className="h-4 w-4" />} accent="--color-emerald" />
        <MetricTile label={t('analytics.kpi.messages')} value={(messages.data ?? []).length} icon={<Activity className="h-4 w-4" />} accent="--color-cyan" />
        <MetricTile label={t('analytics.kpi.latency')} value={formatDuration(avgLatency)} icon={<Timer className="h-4 w-4" />} accent="--color-amber" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('analytics.tasks_by_team')} subtitle={t('analytics.tasks_by_team_sub')} />
          {tasksByDept.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-5 w-5" />} title={t('analytics.no_data')} />
          ) : (
            <BarChart
              data={tasksByDept.map(([k, v]) => ({ label: getDepartment(k)?.name ?? k, value: v }))}
              height={220}
            />
          )}
        </Card>

        <Card>
          <CardHeader title={t('analytics.messages_type')} subtitle={t('analytics.messages_type_sub')} />
          {messagesByType.length === 0 ? (
            <EmptyState icon={<BarChart3 className="h-5 w-5" />} title={t('analytics.no_data')} />
          ) : (
            <BarChart data={messagesByType.map(([k, v]) => ({ label: k, value: v }))} height={220} />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title={t('analytics.system')} subtitle={t('analytics.system_sub')} />
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Gateway URL" value={system.data?.gateway.gateway_url ?? '—'} />
          <Field label="Gateway latency" value={formatDuration(system.data?.gateway.latency_ms ?? null)} />
          <Field label="Supabase latency" value={formatDuration(system.data?.supabase.latency_ms ?? null)} />
          <Field label="Models available" value={String(system.data?.gateway.models.length ?? 0)} />
          <Field label="Active model" value={system.data?.gateway.agent_model ?? '—'} />
          <Field label="Middleware version" value={system.data?.middleware_version ?? '—'} />
        </dl>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-xs text-[color:var(--color-fg-1)]">{value}</dd>
    </div>
  );
}