import { describe, it, expect } from 'vitest';
import {
  departments,
  departmentList,
  getDepartment,
  iconFromManifest,
  isDepartmentKey,
} from '@/design-system/departments';

describe('departments registry', () => {
  it('contains all 10 known departments', () => {
    expect(departmentList).toHaveLength(10);
    expect(departmentList.map((d) => d.key)).toEqual(
      expect.arrayContaining([
        'executive-office',
        'platform-assistant',
        'growth',
        'sales',
        'marketing',
        'finance',
        'operations',
        'hr',
        'support',
        'legal',
      ]),
    );
  });

  it('looks up by key', () => {
    expect(getDepartment('growth')?.name).toBe('Growth');
    expect(getDepartment('unknown')).toBeUndefined();
  });

  it('maps manifest icon names to lucide icons', () => {
    expect(iconFromManifest('rocket').displayName).toBeDefined();
    expect(iconFromManifest('unknown').displayName).toBeDefined();
  });

  it('isDepartmentKey narrows the type', () => {
    expect(isDepartmentKey('growth')).toBe(true);
    expect(isDepartmentKey('nope')).toBe(false);
    expect(isDepartmentKey(123)).toBe(false);
  });

  it('every department has cssVar and accentText', () => {
    for (const d of departmentList) {
      expect(departments[d.key].cssVar).toMatch(/^--color-/);
      expect(departments[d.key].accentText).toMatch(/^text-/);
    }
  });
});