import { useMemo, useState } from 'react';
import { Bot, Search } from 'lucide-react';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { AgentCard } from '@/components/AgentCard';
import { useDepartmentCatalog } from '@/api/queries';
import { departmentList, getDepartment, iconFromManifest } from '@/design-system/departments';
import { useI18n } from '@/i18n/I18nProvider';
import type { DepartmentCatalogEntry } from '@/api/schemas';

interface AgentView {
  id: string;
  role: 'manager' | 'specialist' | 'observer';
  entry: DepartmentCatalogEntry;
  status: string;
  lastSeenAt?: string;
  capabilities: string[];
}

export default function AgentsPage() {
  const { t } = useI18n();
  const catalog = useDepartmentCatalog();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'manager' | 'specialist'>('all');

  const expectedKeys = useMemo(() => new Set(departmentList.map((d) => d.key)), []);

  const agents = useMemo<AgentView[]>(() => {
    const list: AgentView[] = [];
    for (const d of catalog.data ?? []) {
      const pres = getDepartment(d.key);
      const cap = (d.capabilities ?? []) as string[];
      // Manager agent
      list.push({
        id: d.manager_agent_id,
        role: 'manager',
        entry: d,
        status: d.manager?.status ?? 'unknown',
        lastSeenAt: d.manager?.last_seen_at,
        capabilities: cap,
      });
      // Specialists inferred from capabilities (no API field for them yet).
      // Cap to a reasonable number so the page doesn't explode.
      const specialistKeys = cap.length > 6 ? cap.slice(0, 6) : cap;
      for (const sk of specialistKeys) {
        list.push({
          id: `${d.key}-${sk}`,
          role: 'specialist',
          entry: d,
          status: d.installation?.lifecycle === 'active' ? 'active' : 'inactive',
          capabilities: [sk],
        });
      }
    }
    return list.filter((a) => expectedKeys.has(a.entry.key));
  }, [catalog.data, expectedKeys]);

  const filtered = useMemo(() => {
    return agents.filter((a) => {
      const matchesQuery =
        !query.trim() ||
        a.id.toLowerCase().includes(query.toLowerCase()) ||
        a.entry.name.toLowerCase().includes(query.toLowerCase()) ||
        a.capabilities.some((c) => c.toLowerCase().includes(query.toLowerCase()));
      const matchesFilter = filter === 'all' || a.role === filter;
      return matchesQuery && matchesFilter;
    });
  }, [agents, query, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, AgentView[]>();
    for (const a of filtered) {
      const arr = map.get(a.entry.name) ?? [];
      arr.push(a);
      map.set(a.entry.name, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t('agents.header.title')}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            {t('agents.header.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-0.5 text-xs">
          {(['all', 'manager', 'specialist'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 transition-colors ${filter === v ? 'bg-[color:var(--color-accent)] text-white' : 'text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]'}`}
            >
              {t(v === 'all' ? 'tasks.status.all' : `agent.role.${v}`)}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-md">
        <Field
          leading={<Search className="h-4 w-4" />}
          placeholder={t('agents.search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {catalog.isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-32 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-5 w-5" />}
          title={t('agents.empty.title')}
          description={t('agents.empty.desc')}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([deptName, list]) => (
            <Card key={deptName}>
              <CardHeader
                title={deptName}
                subtitle={
                  list.length === 1
                    ? t('agents.group.subtitle_one')
                    : t('agents.group.subtitle_other', { count: list.length })
                }
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {list.map((a) => {
                  const pres = getDepartment(a.entry.key);
                  return (
                    <AgentCard
                      key={`${a.role}-${a.id}`}
                      agentId={a.id}
                      entry={a.entry}
                      role={a.role}
                      status={a.status}
                      lastSeenAt={a.lastSeenAt}
                      capabilities={a.capabilities}
                      className=""
                    />
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}