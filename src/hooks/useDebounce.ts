import { useEffect, useState } from 'react';

/**
 * Debounce a value. Used by the command palette search input.
 */
export function useDebounce<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}