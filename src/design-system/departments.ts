import type { LucideIcon } from 'lucide-react';
import {
  Crown,
  Sparkles,
  Rocket,
  Megaphone,
  Calculator,
  Users,
  LifeBuoy,
  Scale,
  Handshake,
  Settings,
  Globe,
  Palette,
  type LucideProps,
} from 'lucide-react';

/**
 * Department registry — single source of truth for icons, accents
 * and labels across the Business Operating System.
 *
 * Mirrors the OPENCloud Department Core catalog but adds presentation
 * metadata (icons, colors) that the API does not carry.
 */

export type DepartmentCategory =
  | 'governance'
  | 'internal'
  | 'revenue'
  | 'operations'
  | 'people'
  | 'customer'
  | 'compliance';

export interface DepartmentPresentation {
  key: string;
  name: string;
  shortName: string;
  category: DepartmentCategory;
  icon: LucideIcon;
  /** Tailwind text-color class for inline use. */
  accentText: string;
  /** Background swatch (already a Tailwind utility). */
  accentBg: string;
  /** Soft 14% background for chips. */
  accentSoft: string;
  /** CSS var for dynamic styling. */
  cssVar: string;
  /** Primary color (hex) for gradients and accents. */
  color: string;
  shortDescription: string;
}

export const departments: Record<string, DepartmentPresentation> = {
  'executive-office': {
    key: 'executive-office',
    name: 'Executive Office',
    shortName: 'Executive',
    category: 'governance',
    icon: Crown,
    accentText: 'text-[color:var(--color-dept-governance)]',
    accentBg: 'bg-[color:var(--color-dept-governance)]',
    accentSoft: 'bg-[color:var(--color-dept-governance)]/15',
    cssVar: '--color-dept-governance',
    color: '#a855f7',
    shortDescription: 'Strategic coordination and inter-department orchestration.',
  },
  'platform-assistant': {
    key: 'platform-assistant',
    name: 'Platform Assistant',
    shortName: 'Platform',
    category: 'internal',
    icon: Sparkles,
    accentText: 'text-[color:var(--color-dept-internal)]',
    accentBg: 'bg-[color:var(--color-dept-internal)]',
    accentSoft: 'bg-[color:var(--color-dept-internal)]/15',
    cssVar: '--color-dept-internal',
    color: '#c7c8d4',
    shortDescription: 'System-level validation and internal coordination.',
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    shortName: 'Growth',
    category: 'revenue',
    icon: Rocket,
    accentText: 'text-[color:var(--color-dept-revenue)]',
    accentBg: 'bg-[color:var(--color-dept-revenue)]',
    accentSoft: 'bg-[color:var(--color-dept-revenue)]/15',
    cssVar: '--color-dept-revenue',
    color: '#f472b6',
    shortDescription: 'Growth strategy, audience development, demand generation.',
  },
  sales: {
    key: 'sales',
    name: 'Sales',
    shortName: 'Sales',
    category: 'revenue',
    icon: Handshake,
    accentText: 'text-[color:var(--color-dept-revenue)]',
    accentBg: 'bg-[color:var(--color-dept-revenue)]',
    accentSoft: 'bg-[color:var(--color-dept-revenue)]/15',
    cssVar: '--color-dept-revenue',
    color: '#f472b6',
    shortDescription: 'Pipeline, qualification and commercial closing.',
  },
  marketing: {
    key: 'marketing',
    name: 'Marketing',
    shortName: 'Marketing',
    category: 'revenue',
    icon: Megaphone,
    accentText: 'text-[color:var(--color-dept-revenue)]',
    accentBg: 'bg-[color:var(--color-dept-revenue)]',
    accentSoft: 'bg-[color:var(--color-dept-revenue)]/15',
    cssVar: '--color-dept-revenue',
    color: '#f472b6',
    shortDescription: 'Brand campaigns, positioning and performance.',
  },
  finance: {
    key: 'finance',
    name: 'Finance',
    shortName: 'Finance',
    category: 'operations',
    icon: Calculator,
    accentText: 'text-[color:var(--color-dept-operations)]',
    accentBg: 'bg-[color:var(--color-dept-operations)]',
    accentSoft: 'bg-[color:var(--color-dept-operations)]/15',
    cssVar: '--color-dept-operations',
    color: '#38bdf8',
    shortDescription: 'Financial planning, budgeting and reporting.',
  },
  operations: {
    key: 'operations',
    name: 'Operations',
    shortName: 'Operations',
    category: 'operations',
    icon: Settings,
    accentText: 'text-[color:var(--color-dept-operations)]',
    accentBg: 'bg-[color:var(--color-dept-operations)]',
    accentSoft: 'bg-[color:var(--color-dept-operations)]/15',
    cssVar: '--color-dept-operations',
    color: '#38bdf8',
    shortDescription: 'Internal automation and operational orchestration.',
  },
  hr: {
    key: 'hr',
    name: 'Human Resources',
    shortName: 'HR',
    category: 'people',
    icon: Users,
    accentText: 'text-[color:var(--color-dept-people)]',
    accentBg: 'bg-[color:var(--color-dept-people)]',
    accentSoft: 'bg-[color:var(--color-dept-people)]/15',
    cssVar: '--color-dept-people',
    color: '#a78bfa',
    shortDescription: 'People operations, hiring and culture.',
  },
  support: {
    key: 'support',
    name: 'Support',
    shortName: 'Support',
    category: 'customer',
    icon: LifeBuoy,
    accentText: 'text-[color:var(--color-dept-customer)]',
    accentBg: 'bg-[color:var(--color-dept-customer)]',
    accentSoft: 'bg-[color:var(--color-dept-customer)]/15',
    cssVar: '--color-dept-customer',
    color: '#34d399',
    shortDescription: 'Customer support and success operations.',
  },
  legal: {
    key: 'legal',
    name: 'Legal',
    shortName: 'Legal',
    category: 'compliance',
    icon: Scale,
    accentText: 'text-[color:var(--color-dept-compliance)]',
    accentBg: 'bg-[color:var(--color-dept-compliance)]',
    accentSoft: 'bg-[color:var(--color-dept-compliance)]/15',
    cssVar: '--color-dept-compliance',
    color: '#fbbf24',
    shortDescription: 'Contracts, compliance and legal review.',
  },
};

export const departmentList = Object.values(departments);

export function getDepartment(key: string): DepartmentPresentation | undefined {
  return departments[key];
}

export function departmentIcon(key: string): LucideIcon {
  return departments[key]?.icon ?? Globe;
}

export const categoryLabel: Record<DepartmentCategory, string> = {
  governance: 'Governance',
  internal: 'Internal',
  revenue: 'Revenue',
  operations: 'Operations',
  people: 'People',
  customer: 'Customer',
  compliance: 'Compliance',
};

export function iconFromManifest(name: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    crown: Crown,
    sparkles: Sparkles,
    rocket: Rocket,
    megaphone: Megaphone,
    calculator: Calculator,
    users: Users,
    'life-buoy': LifeBuoy,
    scale: Scale,
    handshake: Handshake,
    settings: Settings,
    globe: Globe,
    palette: Palette,
  };
  return map[name] ?? Globe;
}

export function isDepartmentKey(value: unknown): value is string {
  return typeof value === 'string' && value in departments;
}

export type { LucideIcon, LucideProps };
