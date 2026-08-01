import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, FileOutput, FileText, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { Badge } from '@/components/Badge';
import { TaskCard } from '@/components/TaskCard';
import { useMemoryList, useTasks } from '@/api/queries';
import { formatRelativeTime, truncate } from '@/utils/format';
import { getDepartment } from '@/design-system/departments';
import { Link } from 'react-router-dom';

type Tab = 'tasks' | 'memory' | 'documents';

export default function ResultsPage() {
  const [tab, setTab] = useState<Tab>('tasks');
  const [query, setQuery] = useState('');

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Results</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            Library of reports, completed tasks, memory files and uploaded documents.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-0.5 text-xs">
          {(['tasks', 'memory', 'documents'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 transition-colors ${tab === t ? 'bg-[color:var(--color-accent)] text-white' : 'text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="min-w-[240px] flex-1">
          <Field
            leading={<Search className="h-4 w-4" />}
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {tab === 'tasks' && <TasksTab query={query} />}
      {tab === 'memory' && <MemoryTab query={query} />}
      {tab === 'documents' && <DocumentsTab query={query} />}
    </div>
  );
}

function TasksTab({ query }: { query: string }) {
  const tasks = useTasks({ status: 'completed', limit: 200 });
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (tasks.data ?? []).filter((t) =>
      !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
    );
  }, [tasks.data, query]);

  if (filtered.length === 0) {
    return <EmptyState icon={<FileOutput className="h-5 w-5" />} title="No completed tasks yet" description="As departments complete work, their outputs appear here." />;
  }
  return (
    <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
      {filtered.map((t) => (
        <li key={t.id}>
          <TaskCard task={t} onClick={() => (window.location.href = `/tasks/${t.id}`)} />
        </li>
      ))}
    </motion.ul>
  );
}

function MemoryTab({ query }: { query: string }) {
  const memory = useMemoryList();
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (memory.data ?? []).filter((m) =>
      !q || m.title.toLowerCase().includes(q) || m.file_key.toLowerCase().includes(q),
    );
  }, [memory.data, query]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" />}
        title="No memory files yet"
        description="Generate corporate memory from the Company page to start populating this library."
        action={<Link to="/company"><Button>Open company</Button></Link>}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((m) => (
        <Link key={m.id} to={`/company/memory/${m.file_key}`}>
          <Card interactive padding="md">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)]">
                <FileText className="h-4 w-4 text-[color:var(--color-fg-2)]" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{m.title}</div>
                <div className="text-xs text-[color:var(--color-fg-3)]">v{m.version} · {truncate(m.file_key, 24)}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[color:var(--color-fg-3)]">
              <Badge tone="neutral" size="xs" variant="outline">
                {formatRelativeTime(m.updated_at)}
              </Badge>
              <span className="font-mono text-[10px] uppercase tracking-wider">{truncate(m.file_key, 24)}</span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function DocumentsTab({ query }: { query: string }) {
  const docs = useMemoryList();
  const tasks = useTasks({ limit: 200 });
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const completed = (tasks.data ?? []).filter((t) => t.status === 'completed');
    return completed.filter((t) =>
      !q || t.title.toLowerCase().includes(q) || (t.department_key ?? '').toLowerCase().includes(q),
    );
  }, [tasks.data, query, docs.data]);

  if (filtered.length === 0) {
    return <EmptyState icon={<FileOutput className="h-5 w-5" />} title="No documents yet" />;
  }
  return (
    <Card padding="sm">
      <CardHeader title="Generated documents" subtitle="Outputs from completed tasks" />
      <ul className="divide-y divide-[color:var(--color-line)]">
        {filtered.map((t) => {
          const pres = getDepartment(t.department_key);
          return (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)]">
                <ClipboardList className="h-4 w-4 text-[color:var(--color-fg-2)]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{t.title}</div>
                <div className="text-xs text-[color:var(--color-fg-3)]">{pres?.name ?? t.department_key} · {formatRelativeTime(t.completed_at ?? t.updated_at)}</div>
              </div>
              <Link to={`/tasks/${t.id}`} className="text-xs text-[color:var(--color-accent)] hover:underline">
                Open →
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}