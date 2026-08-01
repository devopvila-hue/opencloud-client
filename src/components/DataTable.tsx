import type { ComponentProps, ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { cn } from '@/design-system/cn';

interface DataTableProps<T> extends ComponentProps<'table'> {
  columns: Array<{
    key: string;
    label: ReactNode;
    render?: (row: T) => ReactNode;
    sortable?: boolean;
    className?: string;
  }>;
  data: T[];
  defaultSort?: { key: string; direction: 'asc' | 'desc' };
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  defaultSort,
  className,
  ...rest
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(defaultSort?.key ?? '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSort?.direction ?? 'desc');

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  return (
    <div className={cn('w-full overflow-x-auto rounded-[var(--radius-lg)] border border-[color:var(--border)]', className)}>
      <table className="w-full border-collapse text-sm" {...rest}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="border-b border-[color:var(--border)] px-4 py-2.5 text-left font-mono text-[0.65rem] uppercase tracking-[0.14em] text-[color:var(--muted-foreground)]"
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (sortKey === col.key) {
                        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortKey(col.key);
                        setSortDir('desc');
                      }
                    }}
                    className="flex items-center gap-1 hover:text-[color:var(--foreground)]"
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="text-[color:var(--accent)]">
                        {sortDir === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className="border-b border-[color:var(--border)] last:border-0">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn('px-4 py-2.5 text-[color:var(--muted-foreground)]', col.className)}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
