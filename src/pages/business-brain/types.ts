/**
 * Business Brain — types & state machine.
 *
 * The Business Brain is the persistent representation of what the
 * AI has understood about the user's company. It is built
 * progressively across the 6-phase onboarding flow:
 *
 *   Phase 1 (Bienvenida)         → identity (company, web, country, employees)
 *   Phase 2 (Análisis en vivo)   → market (sector, competitors, value prop)
 *   Phase 3 (Conversación)       → processes, tools, objectives, priorities, successDefinition
 *   Phase 4 (Integraciones)      → tools (confirmed integrations)
 *   Phase 5 (Diagnóstico)        → recommendedDepartments + avoid list
 *   Phase 6 (WOW)                → ChatPage picks up the snapshot
 *
 * The snapshot lives in localStorage in V1 — a single source of truth
 * that survives page reloads and lets the user resume where they left
 * off if they close the browser mid-flow.
 */

export type BrainPhase =
  | 'welcome'
  | 'analyzing'
  | 'conversation'
  | 'integrations'
  | 'diagnosis'
  | 'completed';

export type EmployeeBucket = '1' | '2-10' | '11-50' | '51-200' | '201+';

export interface BrainIdentity {
  name: string;
  domain: string;
  country: string;     // ISO-3166-1 alpha-2
  employees: EmployeeBucket;
}

export interface BrainMarket {
  sector: string | null;
  detectedAt: string | null;
  /** What we believe the company offers. Extracted from the website or
   *  inferred from the sector and a short description. */
  valueProposition: string | null;
  /** Public competitors we are aware of. Empty until the user names one. */
  competitors: string[];
  /** Digital presence signals: social handles, blog presence, etc. */
  digitalPresence: Array<{ platform: string; handle?: string }>;
}

export interface BrainProcess {
  description: string;
  category: 'sales' | 'marketing' | 'operations' | 'support' | 'admin' | 'finance' | 'people' | 'other';
  /** "Tiempo" si fue explícito, "dolor" si fue nombrado como algo que odia. */
  signal: 'time-sink' | 'pain' | 'opportunity';
}

export type BrainTool =
  | 'google_workspace'
  | 'microsoft_365'
  | 'hubspot'
  | 'salesforce'
  | 'pipedrive'
  | 'slack'
  | 'teams'
  | 'wordpress'
  | 'shopify'
  | 'other';

export interface BrainTools {
  primary: BrainTool;
  /** Integrations the user has actually connected (Phase 4). */
  connected: BrainTool[];
  /** Integration rejected (user said "not now" or "doesn't interest me"). */
  rejected: BrainTool[];
}

export interface BrainObjectives {
  /** Free text from the user, plus a reformulation we trust more. */
  raw: string;
  reformulation: string;
  /** Quarter, if mentioned. Defaults to "current quarter" otherwise. */
  quarter: string | null;
}

export interface BrainPriorities {
  /** What worries them most right now. */
  worriedAbout: string | null;
  /** What success means to them — used to calibrate the final recommendation. */
  successDefinition: string | null;
}

export type SignalState = 'empty' | 'partial' | 'complete';

export interface BrainSignals {
  empresa: SignalState;
  mercado: SignalState;
  procesos: SignalState;
  herramientas: SignalState;
  objetivos: SignalState;
  prioridades: SignalState;
}

export interface DepartmentRecommendation {
  /** Department slug from the catalog. */
  department: string;
  /** Justification in the Director General's voice. */
  reason: string;
  /** Ordering: primary = the one we'd start with today. */
  priority: 'primary' | 'secondary' | 'optional';
}

export interface BrainSnapshot {
  /** Current phase — used to resume where the user left off. */
  phase: BrainPhase;
  identity: Partial<BrainIdentity>;
  market: BrainMarket;
  processes: BrainProcess[];
  tools: BrainTools | null;
  objectives: BrainObjectives | null;
  priorities: BrainPriorities;
  signals: BrainSignals;
  recommendations: {
    primary: DepartmentRecommendation | null;
    secondary: DepartmentRecommendation | null;
    optional: DepartmentRecommendation[];
    avoid: Array<{ department: string; reason: string }>;
    rationale: string;
  };
  /** When the user chose to start with a specific department. */
  chosenDepartment: string | null;
  /** ISO timestamp of the last update. */
  updatedAt: string;
  /** Version for forward-compatible migrations. */
  schemaVersion: 1;
}

/**
 * Empty snapshot — what every user starts with.
 */
export function emptySnapshot(): BrainSnapshot {
  return {
    phase: 'welcome',
    identity: {},
    market: {
      sector: null,
      detectedAt: null,
      valueProposition: null,
      competitors: [],
      digitalPresence: [],
    },
    processes: [],
    tools: null,
    objectives: null,
    priorities: { worriedAbout: null, successDefinition: null },
    signals: {
      empresa: 'empty',
      mercado: 'empty',
      procesos: 'empty',
      herramientas: 'empty',
      objetivos: 'empty',
      prioridades: 'empty',
    },
    recommendations: {
      primary: null,
      secondary: null,
      optional: [],
      avoid: [],
      rationale: '',
    },
    chosenDepartment: null,
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
  };
}

/**
 * Derived signal states from a snapshot. Pure function — no I/O.
 * Used by the right-hand "Brain progress" panel to render bars.
 */
export function computeSignals(snap: BrainSnapshot): BrainSignals {
  const id = snap.identity;
  const empresa: SignalState =
    id.name && id.domain && id.country && id.employees ? 'complete' :
    id.name || id.domain ? 'partial' : 'empty';

  const mercado: SignalState =
    snap.market.sector && snap.market.valueProposition ? 'complete' :
    snap.market.sector || snap.market.valueProposition || snap.market.competitors.length > 0 ? 'partial' :
    'empty';

  const procesos: SignalState =
    snap.processes.length >= 2 ? 'complete' :
    snap.processes.length === 1 ? 'partial' : 'empty';

  const herramientas: SignalState =
    snap.tools && snap.tools.connected.length > 0 ? 'complete' :
    snap.tools ? 'partial' : 'empty';

  const objetivos: SignalState =
    snap.objectives?.reformulation ? 'complete' :
    snap.objectives?.raw ? 'partial' : 'empty';

  const prioridades: SignalState =
    snap.priorities.worriedAbout && snap.priorities.successDefinition ? 'complete' :
    snap.priorities.worriedAbout || snap.priorities.successDefinition ? 'partial' :
    'empty';

  return { empresa, mercado, procesos, herramientas, objetivos, prioridades };
}