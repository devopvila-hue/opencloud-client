import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';
import { vi } from 'vitest';

describe('useDebounce', () => {
  it('delays updates', async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'a' },
    });
    expect(result.current).toBe('a');
    rerender({ value: 'b' });
    expect(result.current).toBe('a');
    act(() => vi.advanceTimersByTime(120));
    expect(result.current).toBe('b');
    vi.useRealTimers();
  });
});