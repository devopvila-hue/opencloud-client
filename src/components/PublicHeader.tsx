import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';

/**
 * PublicHeader — sticky top navigation for unauthenticated screens.
 *
 * Used by AuthShell so /login, /signup and /forgot-password share
 * the same horizontal navigation as docs.departify.app. The pattern
 * mirrors the DNA docs topbar (sticky, backdrop-blur, border-bottom)
 * so the three surfaces feel like one product.
 *
 * Links point to the marketing site (departify.app) — the portal
 * is a SaaS product inside the DEPARTIFY ecosystem, not the
 * landing. "Acceder" routes back to /login. "Crear mi equipo" is
 * the primary CTA that opens the signup flow.
 */
const PRIMARY_LINKS = [
  { href: 'https://departify.app/departamentos', label: 'Departamentos' },
  { href: 'https://departify.app/como-funciona', label: 'Cómo funciona' },
  { href: 'https://departify.app/seguridad', label: 'Seguridad' },
  { href: 'https://departify.app/precios', label: 'Precios' },
  { href: 'https://departify.app/recursos', label: 'Recursos' },
] as const;

export function PublicHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-[color:var(--background)]/80 border-b border-[color:var(--border)]">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-5 py-4 md:px-8">
        {/* Logo → back to the marketing site */}
        <Link
          to="https://departify.app"
          aria-label="DEPARTIFY — volver a la web"
          className="flex items-center gap-2 shrink-0"
        >
          <Logo variant="full" size={32} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {PRIMARY_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm rounded-md text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA cluster */}
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden md:inline-flex items-center px-3 py-2 text-sm rounded-md text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
          >
            Acceder
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-foreground)] transition-opacity hover:opacity-90"
          >
            Crear mi equipo
            <span aria-hidden="true">→</span>
          </Link>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-[color:var(--border)]"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-[color:var(--border)] bg-[color:var(--background)]/95 backdrop-blur">
          <nav className="mx-auto max-w-[1320px] px-5 py-4 flex flex-col">
            {PRIMARY_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              className="block py-2 text-sm text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            >
              Acceder
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}