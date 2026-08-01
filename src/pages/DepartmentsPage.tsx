import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, Search, Sliders } from 'lucide-react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { DepartmentCard } from '@/components/DepartmentCard';
import { Badge } from '@/components/Badge';
import { useDepartmentCatalog } from '@/api/queries';
import { departmentList, categoryLabel } from '@/design-system/departments';
import { cn } from '@/design-system/cn';

export default function DepartmentsPage() {
  const catalog = useDepartmentCatalog();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'available'>('all');
  const [category, setCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    const list = catalog.data ?? [];
    return list.filter((d) => {
      const matchesQuery =
        !query.trim() ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase()) ||
        d.capabilities.some((c) => c.toLowerCase().includes(query.toLowerCase()));
      const matchesFilter =
        filter === 'all' ||
        (filter === 'active' && d.installation?.lifecycle === 'active') ||
        (filter === 'available' && !d.installation);
      const matchesCategory = category === 'all' || d.category === category;
      return matchesQuery && matchesFilter && matchesCategory;
    });
  }, [catalog.data, query, filter, category]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (catalog.data ?? []).forEach((d) => set.add(d.category));
    return Array.from(set);
  }, [catalog.data]);

  const expectedKeys = useMemo(() => new Set(departmentList.map((d) => d.key)), []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Departments</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            Activate any department to start delegating work to its manager and specialists.
          </p>
        </div>
        <Badge tone="neutral" size="sm" variant="outline" icon={<Layers className="h-3 w-3" />}>
          {(catalog.data ?? []).length} catalog entries
        </Badge>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[240px] flex-1">
          <Field
            leading={<Search className="h-4 w-4" />}
            placeholder="Search departments, capabilities or descriptions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search departments"
          />
        </div>
        <FilterChips value={filter} onChange={setFilter} />
        <div className="ml-auto flex flex-wrap items-center gap-1">
          <Sliders className="h-3.5 w-3.5 text-[color:var(--color-fg-3)]" />
          {['all', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                category === c
                  ? 'bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]'
                  : 'text-[color:var(--color-fg-3)] hover:bg-[color:var(--color-bg-3)]',
              )}
            >
              {c === 'all' ? 'All categories' : categoryLabel[c as keyof typeof categoryLabel] ?? c}
            </button>
          ))}
        </div>
      </div>

      {catalog.isLoading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No departments match"
          description="Try a different search or remove filters."
          action={<Button onClick={() => { setQuery(''); setFilter('all'); setCategory('all'); }}>Reset filters</Button>}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((d, i) => (
            <motion.div
              key={d.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, delay: i * 0.03 }}
            >
              <DepartmentCard entry={d} to={expectedKeys.has(d.key) ? `/departments/${d.key}` : undefined} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Quick help */}
      <Card padding="md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Hint
            title="What is a department?"
            description="A bundle of agent capabilities, prompts and policies ready to work for your company."
          />
          <Hint
            title="How do I activate one?"
            description="Open a department and press Activate. We provision its workspace, register the manager agent and run the first health check."
          />
          <Hint
            title="Where do conversations live?"
            description="Use Chat to talk to the Executive Director. It delegates to the right department automatically."
          />
        </div>
      </Card>
    </div>
  );
}

function FilterChips({ value, onChange }: { value: 'all' | 'active' | 'available'; onChange: (v: 'all' | 'active' | 'available') => void }) {
  const options: Array<{ id: 'all' | 'active' | 'available'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'available', label: 'Available' },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            value === o.id
              ? 'bg-[color:var(--color-accent)] text-white'
              : 'text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="shimmer h-44 rounded-[var(--radius-lg)]" />
      ))}
    </div>
  );
}

function Hint({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="text-sm font-medium text-[color:var(--color-fg-1)]">{title}</div>
      <p className="mt-1 text-xs text-[color:var(--color-fg-3)]">{description}</p>
    </div>
  );
}