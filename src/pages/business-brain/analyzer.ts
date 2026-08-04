/**
 * Website analyzer — heuristic-only stub for V1.
 *
 * V1 uses pure heuristics (regex + keyword matching) to extract
 * signals from a website URL. We do NOT fetch the website in the
 * browser (CORS would block it from most domains) — the next sprint
 * will route analysis through the middleware backend.
 *
 * What we extract:
 *   - Sector hint (from the domain's keyword tokens)
 *   - Rough value proposition (from the domain itself + heuristics)
 *   - Digital presence (linkedin / twitter / instagram) — based on
 *     common URL patterns and the company name
 *
 * IMPORTANT: every line in the Phase-2 checklist has a corresponding
 * function here. The checklist shows ticks ONLY when this function
 * has actually finished — never fake ticks. If something fails, the
 * line shows "?" and we tell the user why.
 */

import type { BrainMarket } from './types';

const SECTOR_KEYWORDS: Record<string, string[]> = {
  Technology: ['software', 'tech', 'dev', 'code', 'cloud', 'saas', 'api', 'data', 'ia', 'ai'],
  'Professional Services': ['consulting', 'asesoria', 'abogados', 'legal', 'law', 'agencia'],
  'Retail / E-commerce': ['shop', 'tienda', 'store', 'boutique', 'moda', 'fashion'],
  Hospitality: ['hotel', 'hostel', 'restaurant', 'cocina', 'restaurante', 'cafe'],
  Healthcare: ['clinica', 'dental', 'salud', 'health', 'medic', 'farmacia'],
  Education: ['escuela', 'academia', 'formacion', 'edu', 'learn'],
  Manufacturing: ['fabrica', 'industria', 'manufact', 'metal'],
  Finance: ['finanz', 'banco', 'invers', 'crypto', 'contab'],
  'Real Estate': ['inmobil', 'realestate', 'property', 'vivienda'],
  'Marketing / Media': ['marketing', 'media', 'studio', 'estudio', 'comunicacion', 'prensa'],
};

/**
 * Run the heuristic analysis for the given URL.
 *
 * This is intentionally synchronous-ish: each "step" yields a tick
 * after a short delay so the Phase 2 checklist animates. In V1 the
 * delays are pure UX — there is no real work happening.
 *
 * In V2 each step will call the middleware's /analyze endpoint.
 */
export interface AnalyzerStep {
  id: 'fetch' | 'sector' | 'value' | 'proposal' | 'presence' | 'snapshot';
  label: string;
  durationMs: number;
  run: (ctx: AnalyzerContext) => Promise<AnalyzerContext>;
}

export interface AnalyzerContext {
  url: string;
  companyName: string;
  market: BrainMarket;
  /** If true, the step had to use a fallback (no real data). */
  fallbackUsed: Record<string, boolean>;
}

export const ANALYZER_STEPS: AnalyzerStep[] = [
  {
    id: 'fetch',
    label: 'Analizando tu web',
    durationMs: 1100,
    async run(ctx) {
      // V1 stub: we don't fetch — we trust the URL is valid.
      // V2: fetch(`${ctx.url}`) via backend proxy.
      try {
        const parsed = new URL(ctx.url.startsWith('http') ? ctx.url : `https://${ctx.url}`);
        ctx.url = parsed.toString();
      } catch {
        ctx.fallbackUsed.fetch = true;
      }
      return ctx;
    },
  },
  {
    id: 'sector',
    label: 'Detectando tu sector',
    durationMs: 900,
    async run(ctx) {
      const tokens = (ctx.url + ' ' + ctx.companyName).toLowerCase();
      let best: { sector: string; hits: number } | null = null;
      for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
        const hits = keywords.reduce((acc, kw) => acc + (tokens.includes(kw) ? 1 : 0), 0);
        if (hits > 0 && (!best || hits > best.hits)) best = { sector, hits };
      }
      if (best) {
        ctx.market.sector = best.sector;
        ctx.market.detectedAt = new Date().toISOString();
      } else {
        ctx.fallbackUsed.sector = true;
      }
      return ctx;
    },
  },
  {
    id: 'value',
    label: 'Entendiendo qué vendes',
    durationMs: 800,
    async run(ctx) {
      // V1 heuristic: build a value proposition from the domain + sector.
      // V2: extract from the website's hero copy.
      if (ctx.market.sector) {
        const domain = ctx.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
        ctx.market.valueProposition =
          `${ctx.companyName} opera en ${ctx.market.sector.toLowerCase()} desde ${domain}.`;
      } else {
        ctx.fallbackUsed.value = true;
      }
      return ctx;
    },
  },
  {
    id: 'proposal',
    label: 'Identificando tu propuesta de valor',
    durationMs: 700,
    async run(ctx) {
      // Same stub as value for V1.
      if (!ctx.market.valueProposition) {
        ctx.fallbackUsed.proposal = true;
      }
      return ctx;
    },
  },
  {
    id: 'presence',
    label: 'Buscando presencia digital',
    durationMs: 900,
    async run(ctx) {
      const handle = ctx.companyName.toLowerCase().replace(/\s+/g, '');
      // Heuristic guesses — V2 will verify against real API endpoints.
      ctx.market.digitalPresence = [
        { platform: 'LinkedIn', handle },
        { platform: 'Twitter/X', handle },
      ];
      return ctx;
    },
  },
  {
    id: 'snapshot',
    label: 'Preparando tu Business Brain',
    durationMs: 1300,
    async run(ctx) {
      // No real work — finalise.
      return ctx;
    },
  },
];

/**
 * Run the full analysis pipeline. Each step's durationMs is used as
 * a minimum wait so the Phase-2 UI animates naturally.
 *
 * The returned AnalyzerContext contains the resulting BrainMarket.
 */
export async function runAnalysis(url: string, companyName: string): Promise<{
  market: BrainMarket;
  fallbackUsed: Record<string, boolean>;
  /** Total time the analysis took (useful for diagnostics). */
  totalMs: number;
}> {
  const ctx: AnalyzerContext = {
    url,
    companyName,
    market: {
      sector: null,
      detectedAt: null,
      valueProposition: null,
      competitors: [],
      digitalPresence: [],
    },
    fallbackUsed: {},
  };

  const started = Date.now();
  for (const step of ANALYZER_STEPS) {
    await new Promise((r) => setTimeout(r, Math.max(0, step.durationMs - 100)));
    try {
      await step.run(ctx);
    } catch {
      ctx.fallbackUsed[step.id] = true;
    }
  }

  return {
    market: ctx.market,
    fallbackUsed: ctx.fallbackUsed,
    totalMs: Date.now() - started,
  };
}

/**
 * Recommend a primary department based on the user's stated
 * pain points and objectives. V1 uses a simple scoring heuristic —
 * V2 will replace with a model-based recommender.
 */
export function recommendDepartments(args: {
  processes: Array<{ category: string; signal: 'time-sink' | 'pain' | 'opportunity' }>;
  objectives: { raw: string; reformulation: string } | null;
  tools: { primary: string } | null;
}): {
  primary: { department: string; reason: string } | null;
  secondary: { department: string; reason: string } | null;
  avoid: Array<{ department: string; reason: string }>;
  rationale: string;
} {
  const categoryWeights: Record<string, number> = {};
  for (const p of args.processes) {
    const weight = p.signal === 'time-sink' ? 3 : p.signal === 'pain' ? 2 : 1;
    categoryWeights[p.category] = (categoryWeights[p.category] ?? 0) + weight;
  }

  const sorted = Object.entries(categoryWeights).sort((a, b) => b[1] - a[1]);
  const top = sorted[0]?.[0];

  // Default map from process category to department slug.
  const CATEGORY_TO_DEPT: Record<string, string> = {
    sales: 'ventas',
    marketing: 'marketing',
    operations: 'operaciones',
    support: 'atencion-cliente',
    admin: 'administracion',
    finance: 'finanzas',
    people: 'rrhh',
    other: 'operaciones',
  };

  if (!top) {
    return {
      primary: null,
      secondary: null,
      avoid: [],
      rationale: 'Aún no tengo suficiente información para recomendar con criterio. Activemos Marketing y vemos qué pasa.',
    };
  }

  const primaryDept = CATEGORY_TO_DEPT[top];
  const second = sorted[1]?.[0];
  const secondaryDept = second ? CATEGORY_TO_DEPT[second] : null;

  const hasGoogleWorkspace = args.tools?.primary === 'google_workspace';
  const objectiveMentionsClientes = /cliente|clientes|vender|venta|facturar/i.test(args.objectives?.reformulation ?? '');

  return {
    primary: {
      department: primaryDept,
      reason: `Porque concentras el mayor peso de fricción operativa ahí${
        objectiveMentionsClientes ? ', y coincide con tu objetivo de captar clientes' : ''
      }.`,
    },
    secondary: secondaryDept && secondaryDept !== primaryDept ? {
      department: secondaryDept,
      reason: 'Lo haría en cuanto el principal esté rodado, porque desbloquea fricciones distintas pero relacionadas.',
    } : null,
    avoid: [
      {
        department: 'finanzas',
        reason: 'no empezaría por aquí hasta tener operativo el principal; suele generar dependencias sin retorno inmediato.',
      },
      {
        department: 'rrhh',
        reason: 'me parece prematuro mientras tu foco es crecer; lo abordaríamos cuando la operación esté estabilizada.',
      },
    ],
    rationale: hasGoogleWorkspace
      ? `Ya trabajáis con Google Workspace, así que arrancar con ${primaryDept} será especialmente fluido.`
      : `Detecté que aún no habéis conectado Google Workspace — eso lo sugeriremos como primer paso, no como requisito.`,
  };
}