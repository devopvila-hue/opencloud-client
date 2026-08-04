/**
 * ModelSettingsCard — per-organisation LLM provider config.
 *
 * Replaces the previous localStorage-only BYOK card. The browser
 * sends the key to the backend once; the backend encrypts and
 * persists it. We never store the plaintext key in the browser
 * and we never receive it back from the API.
 *
 * Sprint P0 — Real Connection.
 */

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { useToast } from '@/components/Toaster';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { Badge } from '@/components/Badge';
import {
  deleteModelSetting,
  getModelSetting,
  listModelProviders,
  testModelConnection,
  upsertModelSetting,
  type ModelSettingPublic,
  type ProviderCatalogEntry,
} from '@/api/brain-api';

export function ModelSettingsCard() {
  const { t } = useI18n();
  const toast = useToast();

  const [providers, setProviders] = useState<ProviderCatalogEntry[]>([]);
  const [current, setCurrent] = useState<ModelSettingPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Fetch in parallel but never abort the catalog load if the
      // current-setting lookup fails (e.g. schema missing).
      const [listResult, currentResult] = await Promise.allSettled([
        listModelProviders(),
        getModelSetting(),
      ]);
      if (cancelled) return;
      if (listResult.status === 'fulfilled') {
        setProviders(listResult.value);
      }
      if (currentResult.status === 'fulfilled') {
        setCurrent(currentResult.value);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function reload() {
    try {
      const c = await getModelSetting();
      setCurrent(c);
    } catch {
      setCurrent(null);
    }
  }

  return (
    <Card data-testid="model-settings-card">
      <CardHeader
        title={t('settings.ai_providers.title') ?? 'Modelos y proveedores'}
        subtitle={
          'Configura el proveedor LLM que usará el Business Brain para analizar la web y mantener la conversación.'
        }
      />
      <CardSection>
        {loading ? (
          <p className="text-sm text-[color:var(--muted-foreground)]">Cargando…</p>
        ) : current ? (
          <CurrentProviderRow
            setting={current}
            providers={providers}
            onTest={async () => {
              setTesting(true);
              try {
                const r = await testModelConnection();
                toast.push({
                  tone: r.ok ? 'success' : 'error',
                  title: r.ok ? 'Conexión correcta' : 'Sin conexión',
                  description: r.message,
                });
                await reload();
              } finally {
                setTesting(false);
              }
            }}
            onEdit={() => setShowForm(true)}
            onDelete={async () => {
              try {
                await deleteModelSetting();
                toast.push({ tone: 'info', title: 'Proveedor eliminado' });
                setCurrent(null);
              } catch {
                toast.push({ tone: 'error', title: 'No se pudo eliminar' });
              }
            }}
            testing={testing}
          />
        ) : showForm ? (
          <ProviderForm
            providers={providers}
            current={current}
            onCancel={() => setShowForm(false)}
            onSaved={async () => {
              setShowForm(false);
              await reload();
            }}
            onSavingChange={setSaving}
          />
        ) : (
          <EmptyState onAdd={() => setShowForm(true)} />
        )}

        {!showForm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={saving || testing}
            className="mt-3"
          >
            {current ? 'Cambiar proveedor' : 'Configurar proveedor'}
          </Button>
        )}
      </CardSection>

      <CardSection className="border-t border-[color:var(--color-line)] pt-3">
        <details className="text-xs text-[color:var(--muted-foreground)]">
          <summary className="cursor-pointer font-medium">¿Cómo funciona?</summary>
          <p className="mt-1.5 text-pretty">
            La clave se envía una sola vez al backend, que la cifra con AES-256-GCM y nunca la
            devuelve. El portal solo ve una huella (últimos 4 caracteres). Puedes reemplazar o
            eliminar la clave cuando quieras.
          </p>
        </details>
      </CardSection>
    </Card>
  );
}

function CurrentProviderRow({
  setting,
  providers,
  onTest,
  onEdit,
  onDelete,
  testing,
}: {
  setting: ModelSettingPublic;
  providers: ProviderCatalogEntry[];
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  testing: boolean;
}) {
  const provider = providers.find((p) => p.id === setting.provider_id);
  const displayName = setting.display_name || provider?.displayName || setting.provider_id;
  const lastTestLabel = setting.last_tested_at
    ? new Date(setting.last_tested_at).toLocaleString()
    : 'Nunca probada';
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[color:var(--foreground)]">
            {displayName}
          </p>
          <p className="mt-1 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--muted-foreground)]">
            {setting.model_id}
          </p>
          {setting.base_url && (
            <p className="mt-1 truncate text-[0.75rem] text-[color:var(--muted-foreground)]">
              {setting.base_url}
            </p>
          )}
          <p className="mt-1 font-mono text-[0.7rem] text-[color:var(--muted-foreground)]">
            Clave: {setting.api_key_fingerprint}
          </p>
        </div>
        {setting.last_test_status === 'ok' ? (
          <Badge tone="emerald" size="xs">OK</Badge>
        ) : setting.last_test_status === 'error' ? (
          <Badge tone="rose" size="xs">Error</Badge>
        ) : (
          <Badge tone="cyan" size="xs">Sin probar</Badge>
        )}
      </div>
      <p className="text-[0.75rem] text-[color:var(--muted-foreground)]">
        Última prueba: {lastTestLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={onTest} disabled={testing}>
          {testing ? 'Probando…' : 'Probar conexión'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Cambiar
        </Button>
        <Button variant="danger" size="sm" onClick={onDelete}>
          Eliminar
        </Button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-line)] p-4 text-center">
      <p className="text-sm font-medium text-[color:var(--foreground)]">
        Sin proveedor configurado
      </p>
      <p className="mt-1 text-[0.8125rem] text-[color:var(--muted-foreground)] text-pretty">
        El Business Brain necesita un modelo configurado para analizar tu web y mantener la
        conversación. Sin proveedor, no podemos ofrecerte análisis real.
      </p>
      <Button size="sm" onClick={onAdd} className="mt-3">
        Configurar ahora
      </Button>
    </div>
  );
}

function ProviderForm({
  providers,
  current,
  onCancel,
  onSaved,
  onSavingChange,
}: {
  providers: ProviderCatalogEntry[];
  current: ModelSettingPublic | null;
  onCancel: () => void;
  onSaved: () => void;
  onSavingChange: (saving: boolean) => void;
}) {
  const toast = useToast();
  const [providerId, setProviderId] = useState<string>(current?.provider_id ?? providers[0]?.id ?? '');
  const [modelId, setModelId] = useState<string>(current?.model_id ?? '');
  const [baseUrl, setBaseUrl] = useState<string>(current?.base_url ?? '');
  const [apiKey, setApiKey] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const selected = providers.find((p) => p.id === providerId);
  const isCustom = selected?.id === 'custom';

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!providerId) return;
    if (!isCustom && !modelId) {
      // Use the catalog default by submitting empty model_id; the
      // backend will fill it in.
    }
    if (!apiKey && !current) {
      toast.push({ tone: 'error', title: 'La clave es obligatoria' });
      return;
    }
    setSaving(true);
    onSavingChange(true);
    try {
      const saved = await upsertModelSetting({
        provider_id: providerId,
        model_id: modelId || undefined,
        base_url: isCustom ? baseUrl : null,
        api_key: apiKey || undefined,
      });
      toast.push({
        tone: 'success',
        title: 'Proveedor guardado',
        description: `Clave ${saved.api_key_fingerprint}`,
      });
      onSaved();
    } catch (err) {
      toast.push({
        tone: 'error',
        title: 'No se pudo guardar',
        description: err instanceof Error ? err.message : 'Error desconocido',
      });
    } finally {
      setSaving(false);
      onSavingChange(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-[var(--radius-md)] border border-[color:var(--color-line)] p-4">
      <div>
        <label className="mb-2 block text-xs font-medium text-[color:var(--foreground)]">
          Proveedor
        </label>
        <select
          value={providerId}
          onChange={(e) => setProviderId(e.target.value)}
          className="w-full rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-bg-2)] px-3 py-2 text-sm text-[color:var(--foreground)]"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.displayName}
            </option>
          ))}
        </select>
      </div>

      {selected && !isCustom && (
        <Field
          label="Modelo"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          placeholder={selected.defaultModel}
        />
      )}

      {isCustom && (
        <>
          <Field
            label="Modelo"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            placeholder="my-model-1"
            required
          />
          <Field
            label="Base URL"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.example.com/v1"
            required
          />
        </>
      )}

      <Field
        label={current ? 'Nueva clave (deja vacío para conservar)' : 'Clave API'}
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder={current ? '••••••••' : 'sk-...'}
        autoComplete="off"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  );
}