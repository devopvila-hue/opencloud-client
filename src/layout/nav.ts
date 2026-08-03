import {
  Home,
  Crown,
  MessageSquare,
  LayoutGrid,
  Bot,
  ClipboardList,
  FileOutput,
  FileText,
  Building2,
  BarChart3,
  Plug,
  Settings,
  Activity,
  Megaphone,
  ShoppingCart,
  Clock,
  Compass,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  /** i18n key — translated by `nav.<key>` at render time. */
  labelKey: string;
  /** i18n key — translated by `nav.<key>.desc` for the description. */
  descriptionKey: string;
  to: string;
  icon: LucideIcon;
  group: 'primary' | 'secondary';
  shortcut?: string;
  badge?: { textKey: string; tone: 'emerald' | 'amber' | 'violet' | 'neutral' };
}

export const navItems: NavItem[] = [
  { labelKey: 'nav.home',              descriptionKey: 'app.tagline',         to: '/',                icon: Home,           group: 'primary',   shortcut: 'g h' },
  { labelKey: 'nav.executive_office',  descriptionKey: 'office.header.subtitle', to: '/executive-office', icon: Crown,          group: 'primary',   shortcut: 'g e' },
  { labelKey: 'nav.executive_room',    descriptionKey: 'office.header.subtitle', to: '/executive-room',   icon: Activity,       group: 'primary',   shortcut: 'g r' },
  { labelKey: 'nav.chat',              descriptionKey: 'common.search',        to: '/chat',            icon: MessageSquare,  group: 'primary',   shortcut: 'g c' },
  { labelKey: 'nav.departments',       descriptionKey: 'departments.header.subtitle', to: '/departments',  icon: LayoutGrid,    group: 'primary',   shortcut: 'g d' },
  { labelKey: 'nav.marketplace',       descriptionKey: 'marketplace.header.subtitle', to: '/marketplace',  icon: ShoppingCart,  group: 'primary',   shortcut: 'g m' },
  { labelKey: 'nav.onboarding',        descriptionKey: 'onboarding.title',    to: '/onboarding',      icon: Compass,        group: 'secondary', shortcut: 'g o' },
  { labelKey: 'nav.agents',            descriptionKey: 'common.search',        to: '/agents',          icon: Bot,            group: 'primary',   shortcut: 'g a' },
  { labelKey: 'nav.tasks',             descriptionKey: 'tasks.header.subtitle', to: '/tasks',         icon: ClipboardList,  group: 'primary',   shortcut: 'g t' },
  { labelKey: 'nav.timeline',          descriptionKey: 'office.header.subtitle', to: '/timeline',      icon: Clock,          group: 'secondary', shortcut: 'g t' },
  { labelKey: 'nav.results',           descriptionKey: 'tasks.header.subtitle', to: '/results',       icon: FileOutput,     group: 'secondary' },
  { labelKey: 'nav.documents',         descriptionKey: 'common.search',        to: '/documents',      icon: FileText,       group: 'secondary', shortcut: 'g o' },
  { labelKey: 'nav.company',           descriptionKey: 'onboarding.title',     to: '/company',        icon: Building2,      group: 'secondary', shortcut: 'g m' },
  { labelKey: 'nav.analytics',         descriptionKey: 'common.search',        to: '/analytics',      icon: BarChart3,      group: 'secondary', shortcut: 'g y' },
  { labelKey: 'nav.integrations',      descriptionKey: 'common.search',        to: '/integrations',   icon: Plug,           group: 'secondary' },
  { labelKey: 'nav.settings',          descriptionKey: 'settings.subtitle',    to: '/settings',       icon: Settings,       group: 'secondary', shortcut: 'g s' },
];

export const marketplaceCategories = [
  { id: 'revenue',    labelKey: 'nav.marketplace' },
  { id: 'operations', labelKey: 'nav.tasks' },
  { id: 'people',     labelKey: 'nav.agents' },
  { id: 'customer',   labelKey: 'nav.chat' },
  { id: 'compliance', labelKey: 'nav.company' },
  { id: 'governance', labelKey: 'nav.executive_office' },
] as const;