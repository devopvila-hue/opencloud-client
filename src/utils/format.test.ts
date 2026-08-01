import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDateTime,
  formatDuration,
  formatRelativeTime,
  initialsFromName,
  pluralize,
  safeNumber,
  safeString,
  truncate,
} from '@/utils/format';

describe('format utilities', () => {
  it('truncates long strings', () => {
    expect(truncate('abcdef', 4)).toBe('abc…');
    expect(truncate('abc', 10)).toBe('abc');
  });

  it('formats bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024 * 2)).toMatch(/MB$/);
  });

  it('formats durations', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(500)).toBe('500 ms');
    expect(formatDuration(2500)).toBe('2.5 s');
    expect(formatDuration(75_000)).toMatch(/^1m/);
  });

  it('pluralizes', () => {
    expect(pluralize(1, 'task')).toBe('1 task');
    expect(pluralize(3, 'task')).toBe('3 tasks');
    expect(pluralize(3, 'child', 'children')).toBe('3 children');
  });

  it('builds initials', () => {
    expect(initialsFromName('Ada Lovelace')).toBe('AL');
    expect(initialsFromName('mononym')).toBe('MO');
    expect(initialsFromName(null)).toBe('?');
  });

  it('safe number / string', () => {
    expect(safeNumber(42)).toBe(42);
    expect(safeNumber('not-a-number', 7)).toBe(7);
    expect(safeString('hello')).toBe('hello');
    expect(safeString(null, 'fallback')).toBe('fallback');
  });

  it('relative time returns just-now / in-a-moment near now', () => {
    const out = formatRelativeTime(new Date().toISOString());
    expect(['just now', 'in a moment']).toContain(out);
  });

  it('formatDateTime returns a string', () => {
    const out = formatDateTime(new Date('2025-01-01T00:00:00Z'));
    expect(typeof out).toBe('string');
  });
});