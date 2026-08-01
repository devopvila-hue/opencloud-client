import { useEffect } from 'react';

/**
 * Global hotkey listener. Modifier-agnostic: pass `'mod+k'` (cmd/ctrl),
 * `mod+k,/,` for multiple bindings.
 */
export function useHotkey(
  binding: string,
  handler: (e: KeyboardEvent) => void,
  options: { enabled?: boolean; preventDefault?: boolean } = {},
) {
  const { enabled = true, preventDefault = true } = options;
  useEffect(() => {
    if (!enabled) return;
    const combos = binding.split(',').map((s) => s.trim());

    function isMacLike() {
      return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
    }

    function matches(event: KeyboardEvent, combo: string): boolean {
      const parts = combo.toLowerCase().split('+');
      const key = parts[parts.length - 1];
      const mods = parts.slice(0, -1);
      if (mods.includes('mod')) {
        const ok = isMacLike() ? event.metaKey : event.ctrlKey;
        if (!ok) return false;
      }
      if (mods.includes('shift') && !event.shiftKey) return false;
      if (mods.includes('alt') && !event.altKey) return false;
      const k = event.key.toLowerCase();
      return k === key || (key === 'space' && k === ' ');
    }

    function onKey(e: KeyboardEvent) {
      if (combos.some((c) => matches(e, c))) {
        if (preventDefault) e.preventDefault();
        handler(e);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [binding, handler, enabled, preventDefault]);
}