import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Download,
  type LucideIcon,
  Search,
  Shield,
  Sparkles,
  Star,
  Store,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/Card';
import { Badge, Dot } from '@/components/Badge';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { useDepartmentCatalog, useActivateDepartment } from '@/api/queries';
import { useToast } from '@/components/Toaster';
import type { DepartmentCatalogEntry } from '@/api/schemas';
import { departments, categoryLabel, getDepartment, iconFromManifest, type DepartmentCategory } from '@/design-system/departments';
import { cn } from '@/design-system/cn';

const lifecycleTone: Record<string, 'emerald' | 'amber' | 'rose' | 'neutral' | 'cyan' | 'violet'> = {
  active: 'emerald',
  available: 'cyan',
  licensed: 'violet',
  activating: 'cyan',
  suspended: 'amber',
  error: 'rose',
  deactivating: 'amber',
  inactive: 'neutral',
  installed: 'neutral',
};

export default function MarketplacePage() {
  const catalog = useDepartmentCatalog();
  const activate = useActivateDepartment();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');

  const filtered = useMemo(() => {
    const list = catalog.data ?? [];
    return list.filter((d) => {
      const matchesQuery =
        !query.trim() ||
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.description.toLowerCase().includes(query.toLowerCase()) ||
        d.capabilities.some((c) => c.toLowerCase().includes(query.toLowerCase()));
      const matchesCategory = category === 'all' || d.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [catalog.data, query, category]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (catalog.data ?? []).forEach((d) => set.add(d.category));
    return Array.from(set);
  }, [catalog.data]);

  const activeCount = (catalog.data ?? []).filter((d) => d.installation?.lifecycle === 'active').length;

  function onInstall(id: string, name: string) {
    activate.mutate(
      { id, body: {} },
      {
        onSuccess: () => toast.push({ tone: 'success', title: 'Department installed', description: `${name} is now active.` }),
        onError: (e: Error) => toast.push({ tone: 'error', title: 'Installation failed', description: e.message }),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--accent-soft)]">
            <Store className="h-6 w-6" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Marketplace</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Browse and install department apps for your Business Operating System.
            </p>
          </div>
        </div>
        <Badge tone="accent" size="sm" icon={<Dot tone="accent" pulse />}>
          {activeCount} active · {(catalog.data ?? []).length} available
        </Badge>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[240px] flex-1">
          <Field
            leading={<Search className="h-4 w-4" />}
            placeholder="Search apps, capabilities or descriptions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search marketplace"
          />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                category === c
                  ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent)]'
                  : 'text-[color:var(--muted-foreground)] hover:bg-[color:var(--surface-soft)]',
              )}
            >
              {c === 'all' ? 'All categories' : categoryLabel[c as DepartmentCategory] ?? c}
            </button>
          ))}
        </div>
      </div>

      {catalog.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer h-52 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="No apps match"
          description="Try a different search or remove filters."
          action={<Button onClick={() => { setQuery(''); setCategory('all'); }}>Reset filters</Button>}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((entry, i) => (
            <MarketplaceCard
              key={entry.key}
              entry={entry}
              onInstall={() => onInstall(entry.key, entry.name)}
              installing={activate.isPending}
            />
          ))}
        </motion.div>
      )}

      <Card padding="md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Hint
            title="What is a department app?"
            description="A bundle of agent capabilities, prompts and policies ready to work for your company."
          />
          <Hint
            title="How do I install one?"
            description="Click Install. We provision the workspace, register the manager agent and run the first health check."
          />
          <Hint
            title="Can I remove apps?"
            description="Yes. Open any department page and press Deactivate. Data is preserved."
          />
        </div>
      </Card>
    </div>
  );
}

function MarketplaceCard({
  entry,
  onInstall,
  installing,
}: {
  entry: DepartmentCatalogEntry;
  onInstall: () => void;
  installing: boolean;
}) {
  const presentation = getDepartment(entry.key);
  const Icon = iconFromManifest(entry.icon);
  const lifecycle = entry.installation?.lifecycle ?? 'available';
  const isInstalled = lifecycle === 'active' || lifecycle === 'licensed' || lifecycle === 'installed';
  const isActivating = lifecycle === 'activating';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: 0.02 }}
      whileHover={{ y: -2 }}
    >
      <Card variant="elevated" className="flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]"
            style={{
              backgroundColor: presentation?.cssVar
                ? `color-mix(in oklab, var(${presentation.cssVar}) 18%, transparent)`
                : 'var(--surface-soft)',
              color: presentation?.cssVar ? `var(${presentation.cssVar})` : undefined,
            }}
          >
            <Icon className="h-5 w-5" />
          </div>
          <Badge tone={lifecycleTone[lifecycle] ?? 'neutral'} size="xs">
            {lifecycle.replace('_', ' ')}
          </Badge>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate text-base font-medium text-[color:var(--foreground)]">{entry.name}</h3>
            <span className="text-[11px] font-mono text-[color:var(--muted-foreground)]">v{entry.version}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-[color:var(--muted-foreground)]">{entry.description}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          {entry.capabilities.slice(0, 3).map((c) => (
            <span
              key={c}
              className="inline-flex h-5 items-center rounded-full bg-[color:var(--surface-soft)] px-1.5 text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)]"
            >
              {c}
            </span>
          ))}
          {entry.capabilities.length > 3 && (
            <span className="inline-flex h-5 items-center rounded-full bg-[color:var(--surface-soft)] px-1.5 text-[10px] uppercase tracking-wider text-[color:var(--muted-foreground)]">
              +{entry.capabilities.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[color:var(--border)] pt-3">
          <Badge tone="neutral" size="xs" variant="outline">
            {categoryLabel[(presentation?.category ?? 'internal') as DepartmentCategory] ?? entry.category}
          </Badge>
          {isInstalled ? (
            <Button size="sm" variant="ghost" iconLeft={<Check className="h-3.5 w-3.5" />}>
              Installed
            </Button>
          ) : isActivating ? (
            <Button size="sm" variant="ghost" loading>
              Installing…
            </Button>
          ) : (
            <Button size="sm" variant="primary" iconLeft={<Download className="h-3.5 w-3.5" />} onClick={onInstall} loading={installing}>
              Install
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function Hint({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--foreground)]">
        <Shield className="h-4 w-4 text-[color:var(--muted-foreground)]" />
        {title}
      </div>
      <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">{description}</p>
    </div>
  );
}
