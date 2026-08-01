import type { ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/design-system/cn';

interface TabItem {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
  panel: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(items[0]?.id);
  const active = value ?? internal;

  function select(id: string) {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  }

  const activeItem = items.find((t) => t.id === active);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-[color:var(--border)]"
      >
        {items.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => select(t.id)}
              className={cn(
                'relative flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-[color:var(--foreground)]'
                  : 'text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]',
              )}
            >
              <span>{t.label}</span>
              {t.badge && <span className="ml-1">{t.badge}</span>}
              {isActive && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute inset-x-0 -bottom-px h-0.5 bg-[color:var(--accent)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{activeItem?.panel}</div>
    </div>
  );
}
