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
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  group: 'primary' | 'secondary';
  shortcut?: string;
  description?: string;
  badge?: { text: string; tone: 'emerald' | 'amber' | 'violet' | 'neutral' };
}

export const navItems: NavItem[] = [
  { label: 'Home', to: '/', icon: Home, group: 'primary', shortcut: 'g h', description: 'Business Operating System' },
  { label: 'Executive Office', to: '/executive-office', icon: Crown, group: 'primary', shortcut: 'g e', description: 'Strategic coordination' },
  { label: 'Executive Room', to: '/executive-room', icon: Activity, group: 'primary', shortcut: 'g r', description: 'Live multi-department view' },
  { label: 'Chat', to: '/chat', icon: MessageSquare, group: 'primary', shortcut: 'g c', description: 'Talk to your departments' },
  { label: 'Departments', to: '/departments', icon: LayoutGrid, group: 'primary', shortcut: 'g d', description: 'Installed department apps' },
  { label: 'Marketplace', to: '/marketplace', icon: ShoppingCart, group: 'primary', shortcut: 'g m', description: 'Install department apps' },
  { label: 'Onboarding', to: '/onboarding', icon: Sparkles, group: 'secondary', shortcut: 'g o', description: 'BOS setup wizard' },
  { label: 'Agents', to: '/agents', icon: Bot, group: 'primary', shortcut: 'g a', description: 'Active AI workers' },
  { label: 'Tasks', to: '/tasks', icon: ClipboardList, group: 'primary', shortcut: 'g t', description: 'Internal queue' },
  { label: 'Timeline', to: '/timeline', icon: Clock, group: 'secondary', shortcut: 'g t', description: 'Department events' },
  { label: 'Results', to: '/results', icon: FileOutput, group: 'secondary', description: 'Library of outputs' },
  { label: 'Documents', to: '/documents', icon: FileText, group: 'secondary', shortcut: 'g o', description: 'Uploaded files' },
  { label: 'Company', to: '/company', icon: Building2, group: 'secondary', shortcut: 'g m', description: 'Profile, memory, branding' },
  { label: 'Analytics', to: '/analytics', icon: BarChart3, group: 'secondary', shortcut: 'g y', description: 'Usage & consumption' },
  { label: 'Integrations', to: '/integrations', icon: Plug, group: 'secondary', description: 'External services' },
  { label: 'Settings', to: '/settings', icon: Settings, group: 'secondary', shortcut: 'g s', description: 'Workspace preferences' },
];

export const marketplaceCategories = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'operations', label: 'Operations' },
  { id: 'people', label: 'People' },
  { id: 'customer', label: 'Customer' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'governance', label: 'Governance' },
] as const;
