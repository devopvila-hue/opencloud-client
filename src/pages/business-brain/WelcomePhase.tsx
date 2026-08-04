/**
 * Phase 1 — Bienvenida.
 *
 * Four fields only. Less than 30 seconds.
 *
 *   • Nombre de la empresa
 *   • Página web
 *   • País
 *   • Número aproximado de empleados
 *
 * No sector dropdown. No objective dropdown. We learn those in the
 * conversation phase — they come from the user in their own words.
 */

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Building2, Globe, Users } from 'lucide-react';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useBrain } from './BrainContext';
import type { EmployeeBucket } from './types';

const EMPLOYEE_OPTIONS: { id: EmployeeBucket; label: string }[] = [
  { id: '1', label: 'Solo yo' },
  { id: '2-10', label: '2–10' },
  { id: '11-50', label: '11–50' },
  { id: '51-200', label: '51–200' },
  { id: '201+', label: '201+' },
];

const COUNTRIES: Array<{ code: string; name: string; flag: string }> = [
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'FR', name: 'Francia', flag: '🇫🇷' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
];
const TOP_COUNTRIES = COUNTRIES.slice(0, 6);
const MORE_COUNTRIES = COUNTRIES.slice(6);

export function WelcomePhase() {
  const { snapshot, update } = useBrain();
  const [showMoreCountries, setShowMoreCountries] = useState(false);
  const [name, setName] = useState(snapshot.identity.name ?? '');
  const [domain, setDomain] = useState(snapshot.identity.domain ?? '');
  const [country, setCountry] = useState(snapshot.identity.country ?? '');
  const [employees, setEmployees] = useState<EmployeeBucket | ''>(snapshot.identity.employees ?? '');
  const [touched, setTouched] = useState(false);

  const canSubmit =
    name.trim().length > 1 &&
    domain.trim().length > 3 &&
    country.length > 0 &&
    employees.length > 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    update({
      identity: {
        name: name.trim(),
        domain: domain.trim(),
        country,
        employees: employees as EmployeeBucket,
      },
      phase: 'analyzing',
    });
  }

  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      className="mx-auto w-full max-w-xl"
    >
      {/* Sticky progress bar so users always know where they are. */}
      <div className="sticky top-0 z-10 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex flex-col">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted">
            Paso 1 de 5 · 30 segundos
          </span>
          <div className="mt-1.5 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`h-1 w-6 rounded-sm transition-colors ${
                  n <= 1 ? 'bg-accent' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6 text-center">
        <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] tracking-[-0.02em] text-foreground">
          Cuéntame lo mínimo sobre tu empresa.
        </h1>
        <p className="mt-2 text-[0.9375rem] text-muted">
          Lo justo para empezar a conocerla. Lo demás lo hablamos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field
          label="Nombre de tu empresa"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Acme Industries"
          autoComplete="organization"
          leading={<Building2 className="h-4 w-4" />}
        />

        <Field
          label="Página web"
          required
          type="url"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="https://tuempresa.com"
          autoComplete="url"
          inputMode="url"
          leading={<Globe className="h-4 w-4" />}
          hint={touched && domain.trim().length < 4 ? 'Necesito una URL válida' : undefined}
        />

        <div>
          <label className="mb-2 block text-[0.8125rem] font-medium text-foreground">
            País
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(showMoreCountries ? COUNTRIES : TOP_COUNTRIES).map((c) => {
              const active = country === c.code;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c.code)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-[0.875rem] transition-colors ${
                    active
                      ? 'border-accent bg-accent-soft text-foreground'
                      : 'border-border bg-surface text-muted hover:border-foreground/20 hover:text-foreground'
                  }`}
                >
                  <span aria-hidden>{c.flag}</span>
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
          {!showMoreCountries && (
            <button
              type="button"
              onClick={() => setShowMoreCountries(true)}
              className="mt-2 text-[0.8125rem] text-muted transition-colors hover:text-foreground"
            >
              Ver más países ({MORE_COUNTRIES.length})
            </button>
          )}
        </div>

        <div>
          <label className="mb-2 block text-[0.8125rem] font-medium text-foreground">
            Número aproximado de empleados
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {EMPLOYEE_OPTIONS.map((o) => {
              const active = employees === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setEmployees(o.id)}
                  className={`flex flex-col items-center gap-1 rounded-md border px-2 py-3 text-[0.8125rem] transition-colors ${
                    active
                      ? 'border-accent bg-accent-soft text-foreground'
                      : 'border-border bg-surface text-muted hover:border-foreground/20 hover:text-foreground'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" aria-hidden />
                  <span>{o.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-[0.75rem] text-muted">
            Nada se envía sin tu confirmación.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit}

          >
            Continuar
          </Button>
        </div>
      </form>
    </motion.div>
  );
}