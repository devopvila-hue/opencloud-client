import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type Branding = 'departify';

const STORAGE_KEY = 'opc-theme';
const BRANDING_STORAGE_KEY = 'opc-branding';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  branding: Branding;
  setBranding: (b: Branding) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {}
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);
  const [branding, setBrandingState] = useState<Branding>('departify');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);
  const setBranding = useCallback((b: Branding) => setBrandingState(b), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, branding, setBranding }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

// Brand configuration. Single brand — DEPARTIFY.
export const brandConfig: Record<Branding, {
  name: string;
  tagline: string;
  product: string;
  description: string;
  domain: string;
}> = {
  departify: {
    name: 'DEPARTIFY',
    tagline: 'Business Operating System',
    product: 'Business Operating System',
    description: 'Coordinated teams of AI departments that know your business, work with your tools, and execute under your control.',
    domain: 'deptify.com',
  },
};
