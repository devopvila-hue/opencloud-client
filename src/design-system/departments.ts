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

/**
 * Outcome-based presentation. Each Department is described in
 * customer-facing terms only: what it achieves, three concrete
 * examples, and a realistic time-to-result. We never expose the
 * AI / agent / model internals here — those are operational
 * details and live in the admin / technical surface.
 */
export interface DepartmentOutcomes {
  /** Outcome-of-the-department phrased as a customer outcome (es + en). */
  outcomes: { es: string; en: string };
  /** Three concrete examples, customer-facing (es + en). */
  examples: { es: string; en: string }[];
  /** Realistic time-to-result, customer-facing (es + en). */
  estimatedTime: { es: string; en: string };
}

export interface DepartmentPresentation extends DepartmentOutcomes {
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
  /** Ordering hint for the mega menu grid (lower = first). */
  priority: number;
  /** Featured departments get prime real estate in the mega menu. */
  featured: boolean;
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
    outcomes: {
      es: 'Coordina tu empresa como un solo equipo.',
      en: 'Coordinates your company as a single team.',
    },
    examples: [
      { es: 'Resumen semanal listo para tu lunes', en: 'Weekly brief ready every Monday' },
      { es: 'Borradores de campaña preparados', en: 'Campaign drafts prepared' },
      { es: 'Alertas cuando algo necesita tu OK', en: 'Alerts when something needs your OK' },
    ],
    estimatedTime: { es: '3 min de media', en: '3 min on average' },
    priority: 0,
    featured: true,
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
    outcomes: {
      es: 'Te ayuda a configurar la plataforma sin esperar.',
      en: 'Helps you set up the platform without waiting.',
    },
    examples: [
      { es: 'Conecta tu correo en un paso', en: 'Connect your email in one step' },
      { es: 'Resuelve dudas técnicas', en: 'Answers technical questions' },
      { es: 'Revisa permisos y claves', en: 'Reviews permissions and keys' },
    ],
    estimatedTime: { es: '1 min de media', en: '1 min on average' },
    priority: 7,
    featured: false,
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
    outcomes: {
      es: 'Consigue más clientes cada semana.',
      en: 'Get more customers every week.',
    },
    examples: [
      { es: 'Detecta oportunidades de captación', en: 'Spots acquisition opportunities' },
      { es: 'Lanza pruebas A/B automáticamente', en: 'Launches A/B tests automatically' },
      { es: 'Te avisa de los canales que mejor funcionan', en: 'Tells you which channels work best' },
    ],
    estimatedTime: { es: '10 min de media', en: '10 min on average' },
    priority: 1,
    featured: true,
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
    outcomes: {
      es: 'Cierra más tratos sin perder el control.',
      en: 'Close more deals without losing control.',
    },
    examples: [
      { es: 'Prepara ofertas a medida', en: 'Prepares tailored offers' },
      { es: 'Sigue cada lead en caliente', en: 'Follows every hot lead' },
      { es: 'Programa llamadas de seguimiento', en: 'Schedules follow-up calls' },
    ],
    estimatedTime: { es: '5 min de media', en: '5 min on average' },
    priority: 2,
    featured: true,
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
    outcomes: {
      es: 'Consigue más clientes con tu marca.',
      en: 'Get more customers with your brand.',
    },
    examples: [
      { es: 'Escribe campañas listas para publicar', en: 'Writes campaigns ready to publish' },
      { es: 'Publica contenido en tus canales', en: 'Publishes content on your channels' },
      { es: 'Analiza tu competencia cada semana', en: 'Analyses your competition weekly' },
    ],
    estimatedTime: { es: '3 min de media', en: '3 min on average' },
    priority: 3,
    featured: true,
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
    outcomes: {
      es: 'Lleva tus números al día sin esfuerzo.',
      en: 'Keeps your books current without effort.',
    },
    examples: [
      { es: 'Concilia tus cuentas cada día', en: 'Reconciles your accounts daily' },
      { es: 'Clasifica gastos e ingresos', en: 'Classifies expenses and income' },
      { es: 'Prepara borradores de informes', en: 'Drafts financial reports' },
    ],
    estimatedTime: { es: '8 min de media', en: '8 min on average' },
    priority: 4,
    featured: true,
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
    outcomes: {
      es: 'Automatiza lo repetitivo de tu negocio.',
      en: 'Automates the repetitive work in your business.',
    },
    examples: [
      { es: 'Conecta tus herramientas', en: 'Connects your tools' },
      { es: 'Programa tareas recurrentes', en: 'Schedules recurring tasks' },
      { es: 'Detecta cuellos de botella', en: 'Spots bottlenecks' },
    ],
    estimatedTime: { es: '5 min de media', en: '5 min on average' },
    priority: 5,
    featured: false,
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
    outcomes: {
      es: 'Encuentra y cuida a tu equipo.',
      en: 'Finds and takes care of your team.',
    },
    examples: [
      { es: 'Prepara ofertas de empleo', en: 'Drafts job offers' },
      { es: 'Onboarding guiado del primer mes', en: 'Guided onboarding for the first month' },
      { es: 'Mantiene tu manual cultural vivo', en: 'Keeps your culture manual alive' },
    ],
    estimatedTime: { es: '7 min de media', en: '7 min on average' },
    priority: 6,
    featured: false,
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
    outcomes: {
      es: 'Atiende a tus clientes sin perder calidad.',
      en: 'Serves your customers without losing quality.',
    },
    examples: [
      { es: 'Responde consultas al instante', en: 'Answers inquiries instantly' },
      { es: 'Abre y sigue tickets', en: 'Opens and tracks tickets' },
      { es: 'Detecta clientes en riesgo', en: 'Detects customers at risk' },
    ],
    estimatedTime: { es: '2 min de media', en: '2 min on average' },
    priority: 8,
    featured: false,
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
    outcomes: {
      es: 'Tu empresa cumple sin complicarte.',
      en: 'Keeps your company compliant, hassle-free.',
    },
    examples: [
      { es: 'Revisa contratos antes de firmar', en: 'Reviews contracts before signing' },
      { es: 'Te avisa de plazos legales', en: 'Reminds you of legal deadlines' },
      { es: 'Mantiene tu registro de consents', en: 'Maintains your consent registry' },
    ],
    estimatedTime: { es: '6 min de media', en: '6 min on average' },
    priority: 9,
    featured: false,
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
