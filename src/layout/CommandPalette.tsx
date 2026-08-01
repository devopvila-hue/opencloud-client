import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Compass, Hash, Search, Sparkles, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/design-system/cn';
import { useDebounce } from '@/hooks/useDebounce';
import { useHotkey } from '@/hooks/useHotkey';
import { navItems } from './nav';
import { useConversations, useDepartmentCatalog, useTasks } from '@/api/queries';
import { getDepartment } from '@/design-system/departments';
import { useEffect, useMemo, useState } from 'react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type PaletteItem = {
  id: string;
  group: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  keywords?: string[];
  perform: () => void;
};

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const debounced = useDebounce(query, 120);
  const navigate = useNavigate();

  const departments = useDepartmentCatalog();
  const tasks = useTasks({ limit: 30 });
  const conversations = useConversations();

  useHotkey('mod+k', () => (open ? onClose() : setQuery('')), { enabled: true });

  useEffect(() => {
    if (!open) setQuery('');
    setActive(0);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [debounced]);

  const items = useMemo<PaletteItem[]>(() => {
    const out: PaletteItem[] = [];

    for (const n of navItems) {
      out.push({
        id: `nav-${n.to}`,
        group: 'Navigate',
        title: n.label,
        subtitle: n.description,
        icon: n.icon,
        shortcut: n.shortcut,
        keywords: ['go', 'open', n.label.toLowerCase()],
        perform: () => {
          navigate(n.to);
          onClose();
        },
      });
    }

    out.push({
      id: 'action-new-conversation',
      group: 'Create',
      title: 'New conversation',
      subtitle: 'Start chatting with the Executive Director',
      icon: Plus,
      keywords: ['chat', 'conversation', 'talk'],
      perform: () => {
        navigate('/chat/new');
        onClose();
      },
    });
    out.push({
      id: 'action-search-documents',
      group: 'Search',
      title: 'Search documents',
      subtitle: 'Browse uploaded files',
      icon: Hash,
      keywords: ['document', 'file', 'pdf'],
      perform: () => {
        navigate('/documents');
        onClose();
      },
    });

    if (departments.data) {
      for (const d of departments.data) {
        const pres = getDepartment(d.key);
        out.push({
          id: `dept-${d.key}`,
          group: 'Departments',
          title: d.name,
          subtitle: d.description,
          icon: pres?.icon ?? Sparkles,
          keywords: ['department', d.key, d.name.toLowerCase()],
          perform: () => {
            navigate(`/departments/${d.key}`);
            onClose();
          },
        });
      }
    }

    if (tasks.data) {
      for (const t of tasks.data.slice(0, 20)) {
        out.push({
          id: `task-${t.id}`,
          group: 'Tasks',
          title: t.title,
          subtitle: `${t.department_key} · ${t.status}`,
          icon: Compass,
          keywords: ['task', t.department_key, t.title.toLowerCase()],
          perform: () => {
            navigate(`/tasks/${t.id}`);
            onClose();
          },
        });
      }
    }

    if (conversations.data) {
      for (const c of conversations.data.slice(0, 20)) {
        out.push({
          id: `conv-${c.id}`,
          group: 'Conversations',
          title: c.title || 'Untitled conversation',
          subtitle: c.department_key,
          icon: MessageSquare,
          keywords: ['chat', 'conversation'],
          perform: () => {
            navigate(`/chat/${c.id}`);
            onClose();
          },
        });
      }
    }

    return out;
  }, [departments.data, tasks.data, conversations.data, navigate, onClose]);

  const filtered = useMemo(() => {
    if (!debounced.trim()) return items.slice(0, 30);
    const q = debounced.toLowerCase();
    return items
      .filter((it) => {
        if (it.title.toLowerCase().includes(q)) return true;
        if (it.subtitle?.toLowerCase().includes(q)) return true;
        if (it.keywords?.some((k) => k.includes(q))) return true;
        return false;
      })
      .slice(0, 50);
  }, [items, debounced]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const it of filtered) {
      const arr = map.get(it.group) ?? [];
      arr.push(it);
      map.set(it.group, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      filtered[active]?.perform();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[55] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-1)] shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-center gap-2 border-b border-[color:var(--color-line)] px-3">
              <Search className="h-4 w-4 text-[color:var(--color-fg-3)]" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search or jump to anywhere…"
                className="h-12 flex-1 bg-transparent text-sm text-[color:var(--color-fg-1)] placeholder:text-[color:var(--color-fg-3)] focus:outline-none"
              />
              <kbd className="kbd">esc</kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-1">
              {grouped.length === 0 ? (
                <div className="p-6 text-center text-sm text-[color:var(--color-fg-3)]">
                  No results for "{debounced}".
                </div>
              ) : (
                grouped.map(([group, list]) => (
                  <div key={group} className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
                      {group}
                    </div>
                    <ul>
                      {list.map((it) => {
                        const index = filtered.indexOf(it);
                        const isActive = index === active;
                        const Icon = it.icon;
                        return (
                          <li key={it.id}>
                            <button
                              type="button"
                              onMouseEnter={() => setActive(index)}
                              onClick={() => it.perform()}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors',
                                isActive
                                  ? 'bg-[color:var(--color-bg-3)] text-[color:var(--color-fg-1)]'
                                  : 'text-[color:var(--color-fg-2)]',
                              )}
                            >
                              <Icon className="h-4 w-4 text-[color:var(--color-fg-3)]" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate">{it.title}</div>
                                {it.subtitle && (
                                  <div className="truncate text-xs text-[color:var(--color-fg-3)]">
                                    {it.subtitle}
                                  </div>
                                )}
                              </div>
                              {it.shortcut && <kbd className="kbd">{it.shortcut}</kbd>}
                              {isActive && <ArrowRight className="h-3.5 w-3.5 text-[color:var(--color-accent)]" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center justify-between border-t border-[color:var(--color-line)] px-3 py-2 text-[11px] text-[color:var(--color-fg-3)]">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="kbd">↑</kbd>
                  <kbd className="kbd">↓</kbd> navigate
                </span>
                <span>
                  <kbd className="kbd">↵</kbd> select
                </span>
              </div>
              <span>OPENCloud · Business OS</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
