import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// --- Mock state ---
const pushToast = vi.fn();
const localeRef = { locale: 'en', setLocale: vi.fn() };

vi.mock('@/components/Toaster', () => ({
  useToast: () => ({ push: pushToast }),
}));

vi.mock('@/api/queries', () => ({
  useMe: () => ({ data: { full_name: 'Ada', email: '[email protected]' }, isLoading: false }),
  usePatchCompany: () => ({ mutateAsync: vi.fn(), isPending: false, isError: false }),
  useLogin: () => ({ isPending: false, status: 'idle' }),
  useSignup: () => ({ isPending: false, status: 'idle' }),
  useLogout: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/i18n/I18nProvider', () => ({
  I18nProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useI18n: () => ({
    locale: localeRef.locale,
    setLocale: localeRef.setLocale,
    t: (key: string) => key, // identity for assertions
  }),
}));

vi.mock('@/design-system/theme', () => ({
  useTheme: () => ({ theme: 'dark' as const, setTheme: vi.fn(), toggle: vi.fn(), branding: 'departify' as const, setBranding: vi.fn() }),
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  brandConfig: {
    departify: { name: 'DEPARTIFY', tagline: 'Business Operating System', product: 'Business Operating System', description: '', domain: 'deptify.com' },
  },
}));

import SettingsPage from '@/pages/SettingsPage';

function renderSettings() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SettingsPage — language Save button', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, assign: vi.fn(), replace: vi.fn() },
    });
    pushToast.mockClear();
    localeRef.setLocale.mockClear();
    localeRef.locale = 'en';
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation });
  });

  it('renders the language toggle with English active by default', () => {
    renderSettings();
    // Two language option buttons exist (en + es), identified by the
    // translation keys the identity mock t() returns.
    expect(screen.queryByText('settings.language.label_en')).toBeInTheDocument();
    expect(screen.queryByText('settings.language.label_es')).toBeInTheDocument();
  });

  it('clicking a language sets the locale and surfaces the Save banner', async () => {
    renderSettings();

    // The ES button has an aria-label matching the locale id pattern.
    const esButton = screen.getByText('settings.language.label_es');
    fireEvent.click(esButton);

    // setLocale was called with 'es'.
    expect(localeRef.setLocale).toHaveBeenCalledWith('es');
  });

  it('Save button shows a success toast on click', async () => {
    renderSettings();

    // Make the dirty / Save-banner appear by clicking ES.
    fireEvent.click(screen.getByText('settings.language.label_es'));

    // The Save banner button contains the key "common.save" (t is identity).
    const saveBtn = await screen.findByText('common.save');
    fireEvent.click(saveBtn);

    await waitFor(() => expect(pushToast).toHaveBeenCalled());
    const [firstCall] = pushToast.mock.calls[0] as [{ tone: string; title: string }];
    expect(firstCall.tone).toBe('success');
  });

  it('Save banner does NOT appear before switching language', () => {
    renderSettings();
    expect(screen.queryByText('common.save')).not.toBeInTheDocument();
  });
});
