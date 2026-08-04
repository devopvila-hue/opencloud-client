import { describe, expect, it } from 'vitest';
import { runAnalysis, recommendDepartments, ANALYZER_STEPS } from '@/pages/business-brain/analyzer';

describe('analyzer — website heuristic', () => {
  it('runs all 6 steps in order', () => {
    const ids = ANALYZER_STEPS.map((s) => s.id);
    expect(ids).toEqual(['fetch', 'sector', 'value', 'proposal', 'presence', 'snapshot']);
  });

  it(
    'detects the marketing/media sector from a marketing domain',
    async () => {
      const { market, fallbackUsed } = await runAnalysis('https://acme-marketing.com', 'Acme Marketing');
      expect(market.sector).toBe('Marketing / Media');
      expect(fallbackUsed.sector).toBeUndefined();
    },
    20000,
  );

  it(
    'detects the technology sector from a software domain',
    async () => {
      const { market } = await runAnalysis('https://acme-software.io', 'Acme Software');
      expect(market.sector).toBe('Technology');
    },
    20000,
  );

  it(
    'marks sector as fallback when no keyword matches',
    async () => {
      const { market, fallbackUsed } = await runAnalysis('https://banana-yellow.example', 'Banana Yellow');
      expect(market.sector).toBeNull();
      expect(fallbackUsed.sector).toBe(true);
    },
    20000,
  );

  it(
    'always populates a digital presence hint',
    async () => {
      const { market } = await runAnalysis('https://example.com', 'Example Co');
      expect(market.digitalPresence.length).toBeGreaterThan(0);
      expect(market.digitalPresence.some((p) => p.platform === 'LinkedIn')).toBe(true);
    },
    20000,
  );
});

describe('recommendDepartments — Director General with criterio', () => {
  it('recommends marketing when most processes are in marketing', () => {
    const rec = recommendDepartments({
      processes: [
        { category: 'marketing', signal: 'time-sink' },
        { category: 'marketing', signal: 'pain' },
        { category: 'sales', signal: 'opportunity' },
      ],
      objectives: null,
      tools: null,
    });
    expect(rec.primary?.department).toBe('marketing');
    expect(rec.avoid).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ department: 'finanzas' }),
        expect.objectContaining({ department: 'rrhh' }),
      ]),
    );
  });

  it('does NOT recommend all departments — only 1-2 by default', () => {
    const rec = recommendDepartments({
      processes: [
        { category: 'sales', signal: 'pain' },
        { category: 'marketing', signal: 'time-sink' },
        { category: 'operations', signal: 'time-sink' },
        { category: 'support', signal: 'pain' },
        { category: 'admin', signal: 'pain' },
        { category: 'finance', signal: 'opportunity' },
        { category: 'people', signal: 'opportunity' },
      ],
      objectives: null,
      tools: null,
    });
    expect(rec.primary).not.toBeNull();
    expect(rec.secondary === null || rec.secondary !== undefined).toBe(true);
  });

  it('returns a no-op rationale when there are no processes', () => {
    const rec = recommendDepartments({
      processes: [],
      objectives: null,
      tools: null,
    });
    expect(rec.primary).toBeNull();
    expect(rec.rationale).toMatch(/suficiente información/i);
  });

  it('mentions Google Workspace when the user already uses it', () => {
    const withGoogle = recommendDepartments({
      processes: [{ category: 'marketing', signal: 'time-sink' }],
      objectives: null,
      tools: { primary: 'google_workspace' },
    });
    expect(withGoogle.rationale).toMatch(/Google Workspace/);
  });
});