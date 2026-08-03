import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { navItems } from './nav';
import { cn } from '@/design-system/cn';
import { Logo } from '@/components/Logo';
import { useTheme, brandConfig } from '@/design-system/theme';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * Public landing URL — the Sidebar logo (when visible) returns
 * the user to the marketing site. Same constant as in Topbar so
 * the two surfaces stay in sync.
 */
const DEPARTIFY_LANDING_URL = 'https://departify.app';

interface SidebarProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ collapsed = false, onNavigate }: SidebarProps) {
  const { branding } = useTheme();
  const brand = brandConfig[branding];
  const { t } = useI18n();
  const primary = navItems.filter((n) => n.group === 'primary');
  const secondary = navItems.filter((n) => n.group === 'secondary');

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[color:var(--color-line)] bg-[color:var(--color-bg-0)]',
        collapsed ? 'w-[68px]' : 'w-[240px]',
      )}
      aria-label={t('sidebar.collapse')}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        {/* Sidebar logo — clicking it returns the user to the
            public landing site (departify.app). Hidden when the
            sidebar is collapsed (the Topbar logo is always visible). */}
        <Logo
          size={28}
          href={DEPARTIFY_LANDING_URL}
          external
          ariaLabel={t('app.name')}
        />
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex min-w-0 flex-col leading-tight"
          >
            <span className="truncate text-sm font-semibold tracking-tight text-[color:var(--color-fg-1)]">
              {brand.name}
            </span>
            <span className="truncate text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
              {brand.product}
            </span>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <SidebarSection
          title={collapsed ? undefined : t('common.search')}
          items={primary}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {!collapsed && (
          <div className="mt-5 px-3 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
            {t('common.search')}
          </div>
        )}
        <SidebarSection items={secondary} collapsed={collapsed} onNavigate={onNavigate} />
      </nav>

      <div className="border-t border-[color:var(--color-line)] px-3 py-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[color:var(--color-bg-2)] p-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-[color:var(--color-emerald)]"
          />
          {!collapsed && (
            <span className="text-[11px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
              {t('office.health.gateway_up')}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}

function SidebarSection({
  title,
  items,
  collapsed,
  onNavigate,
}: {
  title?: string;
  items: typeof navItems;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div>
      {title && (
        <div className="mb-1.5 mt-4 px-3 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)]">
          {title}
        </div>
      )}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors',
                    'hover:bg-[color:var(--color-bg-3)]',
                    isActive
                      ? 'bg-[color:var(--color-bg-3)] text-[color:var(--color-fg-1)]'
                      : 'text-[color:var(--color-fg-2)]',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        isActive ? 'text-[color:var(--color-accent)]' : 'text-[color:var(--color-fg-3)]',
                      )}
                    />
                    {!collapsed && <span className="flex-1 truncate">{t(item.labelKey)}</span>}
                    {!collapsed && item.shortcut && (
                      <span className="hidden rounded bg-[color:var(--color-bg-3)] px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--color-fg-3)] lg:inline-block">
                        {item.shortcut}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}