# LOCALIZATION_AUDIT

**Fecha:** 2026-08-03
**Scope:** Auditoría CEO-like + localización completa del portal `opencloud-client`.
**Idioma oficial:** Español (España) — `es-ES`.
**Idiomas soportados actualmente:** `en`, `es`.

> "Cuando un CEO abra Departify no debe pensar 'Está muy bien.' Debe pensar 'Parece un producto terminado.'"
>
> — Valentin, Product Owner

---

## 0. Resumen ejecutivo (veredicto CEO)

| Pantalla | ¿Parece terminada? | Por qué |
|---|---|---|
| **Login** | ❌ NO | Header con `KeyRound` genérico en vez del Logo DEPARTIFY (B-01 previo). Toasts post-login en inglés hardcoded. Sin Logo visible = parece "una pantalla más de auth". |
| **Onboarding** | ❌ NO | TODO el copy está en inglés hardcoded (títulos, labels, placeholders, footer, primary goals). La pantalla no usa `t()` en absoluto. |
| **Dashboard** | ❌ NO | ~30 strings en inglés hardcoded. Mezcla `Welcome back` con badges en español. Se siente "demo en desarrollo". |
| **Departments** | ❌ NO | Headers, empty states, search placeholder, filter chips en inglés. `lifecycleBadge` reescribe labels en inglés ignorando el i18n. |
| **DepartmentDetail** | ❌ NO | `lifecycleBadge` redefine labels hardcoded en inglés. `recent activity`, `Capabilities`, `Manager`, etc. en inglés. |
| **Tasks** | ⚠️ PARCIAL | Status options renderizan las keys crudas (`queued`, `assigned`) en vez de labels traducidos. Toasts en algunos sitios, hardcoded en otros. |
| **TaskDetail** | ❌ NO | 100% inglés hardcoded. Botones, status, copy de timeline. |
| **Chat** | ❌ NO | 25+ strings hardcoded: sidebar header, status badges, composer placeholder, sugerencias iniciales, botones Copy/Retry/Cancel, sources header. |
| **Agents** | ❌ NO | 5+ strings hardcoded: search placeholder, empty states, filter labels. Sin i18n en absoluto. |
| **Analytics** | ❌ NO | 8 strings hardcoded: KPIs labels, card titles, empty states. |
| **Documents** | ❌ NO | `confirm(\`Delete ${name}?\`)`, toasts "Document uploaded/Upload failed", empty state title, dialog. |
| **Integrations** | ❌ NO | Página 100% hardcoded en inglés. |
| **Marketplace** | ⚠️ PARCIAL | Empty states hardcoded. Toasts en inglés. Falta i18n en "Reset filters", "All categories". |
| **Company** | ❌ NO | 10+ strings hardcoded. |
| **Settings** | ⚠️ PARCIAL | Mayormente i18n. Hardcoded: "Information tied to your account", "Choose how the portal reaches you", "Add provider", "How BYOK works", BYOK empty state, "Sign out", language switcher "Idioma configurado en español" hardcoded. |
| **Results** | ⚠️ PARCIAL | i18n usado en headers. Empty states inline en inglés. |
| **Timeline** | ❌ NO | `Cargando timeline...` mezclado con status keys en inglés hardcoded. |
| **OrchestrationDetail** | ❌ NO | `Orchestration no especificada`, `Cargando orquestación...` (mezcla ES/EN). Status keys crudos. |
| **MarketingOverview** | ❌ NO | Lista de specialists con capabilities crudas (`market_analysis`, `icp_definition`). Status hardcoded `'active'`. |
| **ExecutiveOffice** | ⚠️ PARCIAL | i18n razonablemente. Mezcla algunos strings hardcoded. |
| **ExecutiveRoom** | ❌ NO | `STATUS_LABELS` redefine los status en español (✅) pero el resto está mezclado. |
| **MemoryFile** | ❌ NO | "Memory file not found", "Back to company", "File key" hardcoded. |
| **Footer global** | ❌ NO | Sí existe footer (commit 8298057) pero solo el wordmark; falta CTA visual de "Volver" más prominente. |

**Veredicto global: ❌ NO parece terminado.** Mezcla de inglés y español en la misma pantalla, copy placeholder en varios sitios, sin locale default correcto.

---

## 1. Hallazgos clasificados

### 🔴 P0 — Idioma por defecto incorrecto

| # | Archivo | Problema | Impacto |
|---|---|---|---|
| **L-01** | `src/i18n/i18n.ts:25` | `DEFAULT_LOCALE = 'en'` | **Crítico** — usuario en España ve el primer load en inglés. Esto contradice el req. 1 del Product Owner. |
| **L-02** | `src/i18n/i18n.ts:43` | `detectBrowserLocale()` solo devuelve 'es' si el navegador es `es*`. Para todo lo demás (incluido navegador en blanco / `*`) → 'en'. | **Crítico** — el 95% de usuarios que NO tienen `es-ES` caen en inglés. |
| **L-03** | `src/i18n/I18nProvider.tsx` | `pickInitialLocale` prioriza stored → browser → default. Sin stored, depende del navegador. | **Crítico** — usuario nuevo ve lo que decida el navegador, no la decisión de marca. |

**Acción:** Invertir la lógica:
- `DEFAULT_LOCALE = 'es'`
- `detectBrowserLocale()` devuelve `'en'` solo cuando `navigator.language` empieza por `en`
- Cualquier otro caso → `'es'`

### 🔴 P0 — Login + Onboarding completamente en inglés

| # | Archivo | Problema |
|---|---|---|
| **L-04** | `src/pages/LoginPage.tsx:96` | Toast `description: 'Loading your Business Operating System…'` en inglés. El catálogo tiene `login.success.signin_desc` ya traducido. |
| **L-05** | `src/pages/LoginPage.tsx:198` | `placeholder="At least 8 characters"` hardcoded. Existe `login.field.password_hint` en el catálogo. |
| **L-06** | `src/pages/OnboardingPage.tsx` (todo el archivo) | ~30 strings hardcoded en inglés: titles, subtitles, fields, placeholders, hints, goals descriptions, sector options, employee options, footer. El catálogo `onboarding.*` está completo. Solo hay que conectar. |
| **L-07** | `src/pages/OnboardingPage.tsx:162` | `description: 'Loading your Business Operating System…'` — debería usar `onboarding.welcome.desc`. |
| **L-08** | `src/pages/OnboardingPage.tsx` | Footer con `Globe`, `Users`, `Target` icons + copy "Already part of an existing workspace? Ask your admin to invite you instead." + "All data stays on your private infrastructure." + "One minute. Five questions. Done." → todo hardcoded en inglés. |

**Acción:** Reemplazar TODOS los strings hardcoded por `t('...')` usando las claves del catálogo. OnboardingPage debe usar `useI18n` y leer el catálogo completo.

### 🔴 P0 — Dashboard, Chat, Departments 100% hardcoded

| # | Archivo | Strings afectados (muestra) |
|---|---|---|
| **L-09** | `src/pages/DashboardPage.tsx` | "Welcome back", "Gateway connected", "of X available", "Tasks running", "Completed today", "New conversation", "Browse departments", "What needs your attention", "Nothing urgent. Nice work.", "Open queue", "Department health", "All departments", "Nothing needs your attention", "Approvals, failures and expirations will surface here in real time.", "Recent activity", "Tasks and internal messages across every department", "Open office", "Pulse", "events", "tasks", "convos", "Workspace", "Capacity & integration status", "Connected", "Unreachable", "Department activation", "Connect more", "Recent conversations", "Untitled", "View all", "8 specialists operativos" (hardcoded num), "completed", "attention", "Hablar con marketing", "Configurar", "Marketing", "Open catalog", "Open my Business OS". |
| **L-10** | `src/pages/ChatPage.tsx` | "Conversations", "Untitled", "Delete conversation", "Delete this conversation?", "No conversations yet", "streaming…", "ready", "live", "idle", "Start a conversation", `Talk to the ${department?.name ?? 'Executive Director'} about goals, plans, reports and approvals.`, "Summarise what my departments did this week", "Draft a plan to launch the new pricing page", "Approve the open tasks waiting for me", "Show me the latest corporate memory files", "Jump to latest", `Message ${department?.name ?? 'the Executive Director'}…`, "Enter to send · Shift+Enter for newline", "Remove attachment", "thinking…", "Sources used", "Copy", "Stop generation", "Send", "Retry", "Cancel", "New conversation". |
| **L-11** | `src/pages/DepartmentsPage.tsx` | "Departments", "Activate any department…", "X catalog entries", "Search departments, capabilities or descriptions…", "Search departments", "All categories", "All", "Active", "Available", "No departments match", "Try a different search or remove filters.", "Reset filters". |
| **L-12** | `src/pages/DepartmentDetailPage.tsx` | `lifecycleBadge` redefine 9 labels en inglés (ignora `lifecycle.*` ya en el catálogo). "Recent tasks", "No tasks yet", "Internal activity", "Last health check", "No health check run yet", "Manager", "Capabilities", "What this department can do", "Run health check". |
| **L-13** | `src/pages/AgentsPage.tsx` | "Search by agent id, department or capability…", "No agents match", "Try a different search". |

### 🔴 P0 — TaskDetail, MemoryFile, Documents, Integrations, Company, Analytics, OrchestrationDetail, Timeline, MarketingOverview

| # | Archivo | Strings afectados |
|---|---|---|
| **L-14** | `src/pages/TaskDetailPage.tsx` | "Task not found", "It may have been deleted or never existed.", "Back to queue", "Action failed", "Task created", "Agent started", "Approved", copy de timeline. |
| **L-15** | `src/pages/MemoryFilePage.tsx` | "Memory file not found", `No file with key "${key}" exists for this company.`, "Back to company", "corporate memory", "File key:". |
| **L-16** | `src/pages/DocumentsPage.tsx` | "No documents yet", "Upload document", "Cancel", "Drop a file or click to select", `confirm(\`Delete ${name}?\`)`, "Document uploaded", "Upload failed", "Document deleted", "Delete failed". |
| **L-17** | `src/pages/IntegrationsPage.tsx` | "Integrations", "Bring external services into your workspace. Phase 4 prepares the UI — every connection will be activated in the next phases.", "API keys", "Manage programmatic access to your workspace", "No keys generated yet", "Generate key". Lista de integrations con `name`/`description` en inglés. |
| **L-18** | `src/pages/CompanyPage.tsx` | "No company profile yet", "Create your company profile to start personalising your departments.", "No description set yet.", "brand", "sector", "Company updated", "Update failed", "Memory regenerated", `v${version} · updated …`, copy del company editor. |
| **L-19** | `src/pages/AnalyticsPage.tsx` | "Analytics", "Operational metrics across every department and agent.", "Total tasks", "Completion", "Internal messages", "Avg health latency", "Tasks by department", "Distribution across active and inactive departments", "No data yet", "Internal message types", "How departments communicate", "System", "Gateway and Supabase reachability". |
| **L-20** | `src/pages/OrchestrationDetailPage.tsx` | "Orchestration no especificada", "Falta el id.", "Cargando orquestación...", `STATUS_COLORS` con keys en inglés (mapeo de backend — no es copy visible). |
| **L-21** | `src/pages/TimelinePage.tsx` | "Cargando timeline...", "Timeline", subtitle, "All", copy de eventos (los `EVENT_TYPE_COLORS` son keys, no copy). |
| **L-22** | `src/pages/MarketingOverviewPage.tsx` | Lista de 8 specialists con `capabilities` raw keys (`market_analysis`, `icp_definition`, etc.) — hardcoded inglés. `status: 'active'` literal. Workflows en español OK. Pero capabilities y status sí están hardcoded. |

### 🟡 P1 — Tasks, TasksPage, Settings, Results, ExecutiveRoom — parcialmente localizados

| # | Archivo | Problema |
|---|---|---|
| **L-23** | `src/pages/TasksPage.tsx` | `STATUS_OPTIONS` renderiza las keys crudas (`queued`, `assigned`, etc.) en los chips. El catálogo tiene `task.status.*`. |
| **L-24** | `src/pages/TasksPage.tsx` | "Filter", "All departments" — bien en i18n. Faltan toasts en algunos sitios. |
| **L-25** | `src/pages/SettingsPage.tsx` | "Information tied to your account", "Choose how the portal reaches you", "Add provider", "How BYOK works", "Your key is sent directly from the browser to the OpenClaw Gateway…", "No AI providers configured yet.", "Add your first provider key to let departments make autonomous requests.", "Add a provider", "Cancel", "Save key", "Sign out" (también está `t('common.sign_out')`, debería usarlo). Selector de idioma con `nameKey: 'English'/'Spanish'` con comentario que dice "will be translated via t()" — nunca se traduce. |
| **L-26** | `src/pages/ResultsPage.tsx` | Empty states inline en inglés. |
| **L-27** | `src/pages/ExecutiveRoomPage.tsx` | `STATUS_LABELS` redefine 6 labels en español (✅ correcto). El resto del copy de la página está mezclado. |
| **L-28** | `src/pages/MarketplacePage.tsx` | Empty states hardcoded. Toasts hardcoded. "Search apps, capabilities or descriptions…", "All categories", "Reset filters" hardcoded. |
| **L-29** | `src/pages/DepartmentDetailPage.tsx:154,157` | "Configuration saved", "Save failed" hardcoded en toasts. |

### 🟡 P1 — Componentes con copy visible en inglés

| # | Archivo | Strings |
|---|---|---|
| **L-30** | `src/components/Toaster.tsx:85` | `aria-label="Dismiss"` |
| **L-31** | `src/components/JsonBlock.tsx:30` | `aria-label="Copy JSON"`, label "Copy" / "Copied" |
| **L-32** | `src/components/Dialog.tsx:86` | `aria-label="Close dialog"` |
| **L-33** | `src/components/Drawer.tsx:74` | `aria-label="Close panel"` |
| **L-34** | `src/components/ActivityFeed.tsx:62` | "No activity yet." |
| **L-35** | `src/components/Timeline.tsx:13` | "No activity yet." |
| **L-36** | `src/components/ErrorState.tsx` | Default `title="No se pudo cargar este contenido"` ✅. Pero `retry` button label "Reintentar" hardcoded — debería usar `common.retry`. |
| **L-37** | `src/components/AgentCard.tsx` | `status` literal hardcoded, `last seen` hardcoded, `role` literal hardcoded. |
| **L-38** | `src/components/TaskCard.tsx` | `priority N` literal hardcoded, `attempt N/M` hardcoded. |

### 🟡 P1 — aria-labels en inglés

| # | Archivo | Strings |
|---|---|---|
| **L-39** | `src/pages/DepartmentsPage.tsx:66` | `aria-label="Search departments"` |
| **L-40** | `src/pages/MarketplacePage.tsx:103` | `aria-label="Search marketplace"` |
| **L-41** | `src/pages/ChatPage.tsx:245,274,403,439,447,634,645,655` | aria-labels variados en inglés. |

### 🟢 P2 — Detalles de pulido

| # | Archivo | Observación |
|---|---|---|
| **L-42** | `src/i18n/i18n.ts` | El catálogo tiene algunos strings de marca en inglés ("Business Operating System") que se mantienen en ambos idiomas (✅ correcto). |
| **L-43** | `src/i18n/I18nProvider.tsx` | El orden de prioridad de idioma es: stored > browser > default. Debería ser: stored > **default (es)** > browser detection > en fallback. |
| **L-44** | `src/pages/LoginPage.tsx:100` y `src/pages/OnboardingPage.tsx:168` | `setError(message)` pinta el mensaje del backend (`ApiClientError.message`) directamente. Si el backend devuelve strings en inglés, el cliente las pinta en inglés. Necesita map de códigos de error → i18n. |
| **L-45** | `src/components/TaskCard.tsx` | `priority ${task.priority}` literal — debería usar `t('task.priority', { n })`. |
| **L-46** | `src/components/AgentCard.tsx` | Misma situación con `last seen`. |
| **L-47** | `src/pages/ExecutiveRoomPage.tsx` | `STATUS_COLORS` y `STATUS_LABELS` son redefiniciones locales — duplicación con el catálogo. |
| **L-48** | `src/pages/DepartmentDetailPage.tsx:51-59` | `lifecycleBadge` redefine labels en inglés, ignorando `lifecycle.*`. |

---

## 2. Auditoría CEO — "¿Parece terminado?"

### Veredicto por superficie

**🟢 Visualmente pulido (pero copy en inglés):**
- `tokens.css` (paleta, tipografía, motion, sombras)
- `<Logo>` SVG path oficial (commit `a7ce1b0`)
- Footer global con 4 sub-dominios (commit `8298057`)
- `<Button>`, `<Card>`, `<Field>`, `<Badge>`, `<Tabs>`, `<Dialog>`, `<Drawer>`, `<EmptyState>`, `<Skeleton>`
- `meta tags` y `og-image.svg` apuntando a `app.departify.app`

**🟡 Visualmente OK pero copy inconsistente:**
- `Topbar`, `Sidebar` (navegación bien, search placeholder sí i18n)
- `ExecutiveOfficePage` (i18n razonablemente conectado)
- `TasksPage` (i18n parcialmente conectado, status keys crudas)
- `SettingsPage` (mayormente i18n, hardcoded en some places)

**🔴 Parece demo / sin terminar:**
- `LoginPage` — sin Logo DEPARTIFY (commit previo B-01), toast en inglés
- `OnboardingPage` — 100% inglés hardcoded
- `DashboardPage` — `Welcome back` y todos los KPIs en inglés
- `ChatPage` — sidebar header "Conversations", status "live"/"idle", copy de composer todo en inglés
- `DepartmentsPage` — header "Departments" + filter chips + empty states en inglés
- `TaskDetailPage`, `MemoryFilePage`, `IntegrationsPage`, `AnalyticsPage`, `DocumentsPage`, `CompanyPage`, `OrchestrationDetailPage`, `TimelinePage`, `MarketingOverviewPage` — todas con copy mayoritariamente en inglés
- `MarketplacePage` — empty states y toasts en inglés

---

## 3. Cobertura del catálogo i18n

| Clave | Estado |
|---|---|
| `app.*` | ✅ Completo en ambos idiomas |
| `nav.*` | ✅ Completo |
| `sidebar.*`, `topbar.*` | ✅ Completo |
| `palette.*` | ✅ Completo |
| `notifications.*` | ✅ Completo |
| `login.*` | ✅ Completo |
| `onboarding.*` | ✅ Completo (todo traducido) |
| `office.*` | ✅ Completo |
| `health.*`, `lifecycle.*`, `task.status.*`, `task.*` | ✅ Completo |
| `toast.*` | ⚠️ Parcial — solo dept/health |
| `settings.*` | ✅ Completo |
| `marketplace.*` | ✅ Completo |
| `departments.*` | ⚠️ Falta — solo `marketplace.*` |
| `chat.*` | ⚠️ Falta — necesita crearse |
| `dashboard.*` | ⚠️ Falta — necesita crearse |
| `tasks.*` | ⚠️ Parcial — falta create_dialog descriptions, retry_toast, etc. |
| `documents.*` | ⚠️ Falta |
| `analytics.*` | ⚠️ Falta |
| `company.*` | ⚠️ Falta |
| `integrations.*` | ⚠️ Falta |
| `agents.*` | ⚠️ Falta |
| `common.dismiss`, `common.copy`, `common.copied`, `common.retry`, `common.cancel`, etc. | ✅ Completos (muchos ya están) |

**Conclusión:** el catálogo i18n cubre el 70-80% de lo necesario. Lo que falta es **uso del catálogo** + algunas claves nuevas para pantallas que aún no tienen (`chat.*`, `dashboard.*`, `documents.*`, etc.).

---

## 4. Bugs latentes que afectan a "parecer terminado"

| # | Archivo | Bug |
|---|---|---|
| **B-01** | `src/components/Logo.tsx` en Topbar/Sidebar | ✅ Resuelto en commit `a7ce1b0` (path SVG oficial). |
| **B-02** | `src/components/TaskCard.tsx:63` | `h-4.5 w-4.5` (clase Tailwind inexistente) — el icono del departamento sale sin tamaño definido. CEO lo notaría. |
| **B-03** | `src/pages/SettingsPage.tsx` (Toggle) | `bg-white` en el knob del switch — en light theme no se ve bien. |
| **B-04** | `src/pages/LoginPage.tsx` | Sin `<Logo>` en el header (B-01 del audit previo). |

---

## 4b. P0 ampliados — Continuidad Landing → Portal → DNA (Fase U2)

### P0-01 — Auditoría específica de continuidad visual

**Comparativa lado a lado Landing vs Portal:**

| Elemento | Landing (`departify.app`) | Portal (`app.departify.app`) | Estado |
|---|---|---|---|
| **Logo mark** | SVG path oficial (rect + 2× rect + polygon) en `64×64` rx=14, color `currentColor` (lime via CSS var) | SVG path oficial en `Logo.tsx` (commit `a7ce1b0`), color lime via `var(--accent)` | ✅ Match desde commit `a7ce1b0` |
| **Logo rx ratio** | `rx=14 / 64 = 21.875%` | `rounded-[var(--radius-md)]` = 10px → a 28px sería `10/28 = 35.7%` | ⚠️ **Diferente ratio**. Landing más cuadrado, Portal más redondo. Solución: pasar a `rounded-[14%]` o constante compartida. |
| **Header altura** | `padding: 18px 0` con `text-[1.15rem]` logo → ~72px interno | `h-14` (56px fijo, sin padding extra) | ⚠️ **16px diferencia**. CEO notaría que el header es más bajo. |
| **Header fondo** | `bg-background/40` + `backdrop-blur-md` | `bg-[color:var(--color-bg-0)]/80` + `backdrop-blur` | ⚠️ Opacidades distintas (`/40` vs `/80`). Inconsistencia sutil. |
| **Header sticky z-index** | `z-40` | `z-30` | ⚠️ Diferencia de capas. La Landing está por encima de modales propios, Portal por debajo. Alinear. |
| **Header nav items** | Nav comercial (Departamentos, Cómo funciona, Seguridad, Precios, Recursos) | Sin nav comercial (Topbar solo tiene search + theme + notif + avatar) | ✅ Correcto — el Portal es SaaS, no comercial. **P0-02 se resuelve NO copiando menús sino manteniendo equivalencia visual**. |
| **Logo → home** | Logo apunta a `/` (su propia home) | Logo apunta a `https://departify.app` (Landing) | ✅ Distinto a propósito. CEO hace click → vuelve a la Landing, no al dashboard. |
| **Tipografía** | Inter (sans) + Fraunces (display) | Inter + Fraunces + JetBrains Mono (mono) | ✅ Match. Portal añade mono para datos técnicos. |
| **Motion / easing** | `cubic-bezier(0.32, 0.72, 0, 1)` | `ease-smooth: cubic-bezier(0.32, 0.72, 0, 1)` | ✅ Match. |
| **Espaciado container** | `max-w-[1320px]`, `px-5 sm:px-8` | `max-w-7xl` (1280px), `p-4 md:p-6 lg:p-8` | ⚠️ **40px de diferencia en max-width** + diferencia de padding interno. |
| **Espaciado secciones** | `py-24 sm:py-32` | (no usado) | n/a — el Portal no tiene `<Section>`. |
| **Iconografía** | Lucide-react | Lucide-react | ✅ Match. |
| **CTA primary** | `bg-accent text-[#0a0c08]` con shadow `0_1px_0_rgba(0,0,0,0.1)` | Mismo `bg-accent text-[var(--accent-foreground)]` + shadow | ✅ Match. |

**Veredicto continuidad:** 5/12 match perfecto, 6/12 discrepancias menores que un CEO notaría en la primera comparación, 1/12 distinto a propósito. Las 6 discrepancias son **fáciles de cerrar**:

- Header altura: pasar a `h-16` (64px) + `padding-y: 4px` opcional.
- Header fondo: alinear a `/40` o `/60` (más sutil) — decisión de diseño, no funcional.
- Header z-index: `z-40` en ambos.
- Logo rx: ajustar Logo.tsx para que use el ratio 14/64 ≈ `22%` en cualquier tamaño.
- Container max-width: `max-w-[1320px]` global en lugar de `max-w-7xl` (impacta 26 archivos).
- Section padding: introducir `<Section spacing>` (ya existe pero no se usa) y aplicar `py-24 sm:py-32`.

---

### P0-02 — Header del Portal con mismo "sistema" que Landing

**Lectura:** El usuario no pide copiar menús. Pide que el **header del Portal se sienta parte del mismo sistema visual**.

**Solución:**

- Header altura igual (64px ≈ Landing 72px - 8px del padding interno).
- Header sticky + backdrop-blur con misma opacidad.
- Logo DEPARTIFY **siempre visible** en el header (ya está).
- Cuando el Logo se renderiza, **lo hace con las mismas proporciones que la Landing** (`rx=14/64`).
- Items secundarios del Topbar (search, theme, notif, avatar) mantienen su semántica SaaS.

**No se pide:** replicar los menús comerciales. El Portal sigue siendo SaaS autenticado.

---

### P0-03 — Footer compartido con la Landing

**Footer de la Landing:** wordmark "DEPARTIFY · Business Operating System" + descripción + CTA primary ("Crear mi equipo") + CTA secondary ("Hablar con el equipo") + grid de 3 columnas (Producto · Empresa · Legal) con sub-listas.

**Footer del Portal actual:** wordmark + año + los 4 sub-dominios + "Volver a departify.app →".

**Brechas:**

| Elemento | Landing | Portal actual | Solución |
|---|---|---|---|
| Wordmark | "DEPARTIFY · Business Operating System" en serif Fraunces | ✅ Match | — |
| Descripción | "Equipos de IA especializados que conocen tu empresa, trabajan con tus herramientas y ejecutan tareas bajo tu control." | ❌ No existe | Añadir descripción corta. |
| CTA primary | "Crear mi equipo" | "Volver a departify.app →" (a accent) | Mantener como está — el Portal no necesita CTA comercial. |
| CTA secondary | "Hablar con el equipo" | ❌ No existe | Añadir link a `mailto:?to=...` o `https://departify.app/contacto`. |
| Grid columnas | Producto / Empresa / Legal (10+ links cada una) | ❌ No existe | Para el Portal autenticado, no aplica grid comercial. Pero sí una **navegación entre los 4 sub-dominios del ecosistema** (P0-03 explícito). |

**Solución P0-03:**

- Mantener el wordmark + descripción corta + link "Volver a departify.app".
- Añadir **3 columnas** que reflejen el ecosistema Departify:
  - **Producto** → links a Landing: Departamentos, Cómo funciona, Precios, Recursos.
  - **Empresa** → links a Landing: Seguridad, Empresa.
  - **Ecosistema** → los 4 sub-dominios (departify/app/docs/api).
- Mantener `target="_blank"` en links externos (Landing) — Portal y docs/api son sub-dominios que se abren en nueva pestaña.
- Sin "Legal" como columna separada — los links legales viven en la Landing.

**Esto convierte el footer del Portal en un espejo del footer de la Landing** sin que el Portal tenga que alojar contenido comercial.

---

### P0-04 — Logo oficial propagado a TODAS las superficies

**Estado actual:**

| Superficie | Logo actual | Estado |
|---|---|---|
| Topbar (compact, link a departify.app) | ✅ Path oficial desde `a7ce1b0` | OK |
| Sidebar (compact, link a departify.app) | ✅ Path oficial desde `a7ce1b0` | OK |
| LoginPage | ❌ `KeyRound` icon (candado genérico) | **B-04 pendiente** |
| OnboardingPage | ❌ `Sparkles` icon | **B-02 (nuevo): icono temporal** |
| Favicon (data URI en index.html) | ✅ Path oficial desde `b4dd37b` | OK |
| OpenGraph image (public/og-image.svg) | ✅ Path oficial desde `b4dd37b` | OK |
| Headers de página (cada `pages/X.tsx`) | ⚠️ Icono de área (Store, Building2, Activity…) en cuadrado lime | **B-05 (nuevo)**: cada header tiene su propio "logo temporal" |

**B-05 — Headers de página:** Cada página tiene un `<div class="flex h-12 w-12 … rounded-md">` con un icono Lucide. No es un Logo Departify, pero **compite visualmente con él**. Solución: mantener el icono de área como acento (más pequeño, en `--bg-2` en vez de `--accent-soft`), y añadir `<Logo size={24} variant="compact" />` discreto al lado del título. Esto garantiza que cada header tiene marca DEPARTIFY visible sin perder la identidad del área.

**Inventario de headers de página que necesitan este tratamiento:**
- Dashboard, Departments, DepartmentDetail, Marketplace, Tasks, TaskDetail, Chat, Documents, Agents, Analytics, Integrations, Company, MemoryFile, Timeline, OrchestrationDetail, MarketingOverview, ExecutiveOffice, ExecutiveRoom, Settings, Results = **20 headers**.

**Logo consolidado:** un único `src/components/Logo.tsx` (commit `a7ce1b0`). Es la única implementación. No hay variantes. ✅

---

### P0-05 — Auditoría de todos los enlaces cruzados

**Resultado de grep exhaustivo** sobre `src/`, `index.html`, `public/`, `netlify.toml`:

| URL | Apariciones | Veredicto |
|---|---|---|
| `https://departify.app` | Sidebar, Topbar, ShellLayout, index.html, og-image.svg, netlify.toml (comment) | ✅ Correcto (landing) |
| `https://app.departify.app` | ShellLayout footer, index.html canonical/og, netlify.toml comment, og-image.svg | ✅ Correcto (portal) |
| `https://docs.departify.app` | ShellLayout footer, index.html (comment + og:see_also), og-image.svg | ✅ Correcto (DNA) |
| `https://api.departify.app` | netlify.toml redirect target, ShellLayout footer, og-image.svg | ✅ Correcto (API) |
| `deptify.com` / `deptartify.com` / `deptartify` | **0** | ✅ Cero referencias |
| `localhost` / `127.0.0.1` | Solo `vite.config.ts` (proxy dev) y `sanitizeNext.ts` (seguridad) | ✅ Esperado, fuera de scope |
| `app.deptify.com` / `api.deptify.com` / `docs.deptify.com` | **0** | ✅ Cero |

**Conclusión:** Todos los enlaces apuntan a los 4 sub-dominios oficiales. No quedan referencias antiguas en código fuente. La única excepción es el footer de la Landing y el canonical del DNA, que NO podemos tocar (fuera de scope — `departia` no se modifica).

**Acción adicional menor:** en `og-image.svg` línea 70 hay un literal `departify.app · app.departify.app · docs.departify.app · api.departify.app`. ✅ Correcto, forma parte del ecosistema.

---

### P0-06 — Auditoría de CTAs y tono de copy

**CTAs primary del Portal (muestra):**

| CTA | Pantalla | Idioma | Tono | Match con Landing |
|---|---|---|---|---|
| `Open catalog` | Dashboard | EN | Imperativo genérico | ❌ |
| `Browse departments` | Dashboard | EN | Imperativo | ❌ |
| `New conversation` | Dashboard | EN | Imperativo | ❌ |
| `View all` | Dashboard | EN | Imperativo | ❌ |
| `Hablar con marketing` | Dashboard | ES (mezclado) | Infinitivo coloquial | ⚠️ No match — Landing usa imperativo formal |
| `Configurar` | Dashboard | ES | Infinitivo | ⚠️ |
| `Open office` | Dashboard | EN | Imperativo | ❌ |
| `Connect more` | Dashboard | EN | Imperativo | ❌ |
| `Open queue` | Dashboard | EN | Imperativo | ❌ |
| `All departments` | Dashboard | EN | "Todos los departamentos" en ES | ❌ |
| `Hablar con el equipo` | MarketingOverview | ES | Infinitivo | ⚠️ |
| `Iniciar` | MarketingOverview | ES | Infinitivo | ⚠️ |
| `Configurar` | MarketingOverview | ES | Infinitivo | ⚠️ |
| `Open` | Dashboard | EN | Imperativo | ❌ |
| `Install` | Marketplace | EN | Imperativo | ❌ |
| `Installed` | Marketplace | EN | Status | ❌ |
| `Installing…` | Marketplace | EN | Status | ❌ |
| `Reset filters` | Marketplace/Departments | EN | Imperativo | ❌ |
| `Cancel` | Settings/Documents/DepartmentDetail | EN | Imperativo | ❌ |
| `Save` | DepartmentDetail/Settings | EN | Imperativo | ❌ |
| `Run health check` | DepartmentDetail | EN | Imperativo | ❌ |
| `Configure` | DepartmentDetail | EN | Imperativo | ❌ |
| `Deactivate` | DepartmentDetail | EN | Imperativo | ❌ |
| `Suspend` | DepartmentDetail | EN | Imperativo | ❌ |
| `Reactivate` / `Activate` | DepartmentDetail | EN | Imperativo | ❌ |
| `Resume` | DepartmentDetail | EN | Imperativo | ❌ |
| `Health check` | DepartmentDetail | EN | Imperativo | ❌ |
| `Grant lab license` | DepartmentDetail | EN | Imperativo | ❌ |
| `Upload document` | Documents | EN | Imperativo | ❌ |
| `Delete` | Documents | EN | Imperativo | ❌ |
| `Upload` | Documents | EN | Imperativo | ❌ |
| `Connect` | Integrations | EN | Imperativo | ❌ |
| `Generate key` | Integrations | EN | Imperativo | ❌ |
| `Back to company` | MemoryFile | EN | Imperativo | ❌ |
| `Approve` / `Reject` | Tasks/TaskDetail/Office | EN | Imperativo | ❌ |
| `Cancel` | Tasks | EN | Imperativo | ❌ |
| `Retry` | TaskDetail | EN | Imperativo | ❌ |
| `Save key` | Settings | EN | Imperativo | ❌ |
| `Add provider` | Settings | EN | Imperativo | ❌ |
| `Add a provider` | Settings | EN | Imperativo | ❌ |
| `Sign out` | Settings | EN | Imperativo | ❌ |
| `Regenerate` | CompanyPage | EN | Imperativo | ❌ |
| `Talk to Executive Director` | ExecutiveOffice | EN | Imperativo | ❌ |
| `Start chat` | ExecutiveOffice | EN | Imperativo | ❌ |
| `View all tasks` | ExecutiveOffice | EN | Imperativo | ❌ |
| `Activate` | ExecutiveOffice | EN | Imperativo | ❌ |
| `Manage` | ExecutiveOffice | EN | Imperativo | ❌ |

**CTAs primary de la Landing** (para comparación de tono):

- `Crear mi equipo` → imperativo español, formal, segunda persona.
- `Acceder` → imperativo español.
- `Hablar con el equipo` → infinitivo, formal.
- `Ver el proceso completo` → imperativo español.
- `Probar el panel` → imperativo español.

**Reglas de tono a aplicar (de la Landing):**

1. **Verbo en imperativo español** para acciones directas (`Crear`, `Acceder`, `Ver`, `Probar`, `Hablar`, `Cancelar`, `Guardar`, `Configurar`, `Activar`, `Desactivar`, `Instalar`, `Subir`, `Borrar`, `Añadir`, `Generar`, `Aprobar`, `Rechazar`).
2. **Verbo en infinitivo español** para acciones de proceso (`Hablar con`, `Ver el proceso`).
3. **Nunca inglés** (`Open`, `Save`, `Cancel`, `Install`, `Upload`, `Add`, `Connect`, `Browse`, `Reset`, `Retry`, `Approve`, `Reject`, `Generate`, `Back to`, `View all`, `Talk to`, `Manage`, `Health check`).
4. **Sin mezclas** — un CTA no puede tener ES + EN en la misma frase.

**Acción:** Reemplazar cada CTA con su traducción al español siguiendo la regla anterior. Para status (`Installing…`, `Installed`), usar participios en español (`Instalando…`, `Instalado`).

---

## 5. Plan de remediación (orden para minimizar riesgo)

### Fase A — Idioma por defecto (P0)
**1 commit, ~5 min.**

- `src/i18n/i18n.ts`:
  - `DEFAULT_LOCALE = 'es'`.
  - `detectBrowserLocale()` devuelve `'en'` solo cuando `navigator.language.startsWith('en')`; cualquier otro caso → `'es'`.
- `src/i18n/I18nProvider.tsx`: actualizar comentario de prioridad.

### Fase B — Localización completa (P0)
**~11 commits, ordenados por impacto CEO.**

Cada commit:
1. `const { t } = useI18n();` si falta.
2. Strings hardcoded → `t('...')`.
3. Claves nuevas se añaden al catálogo con ES + EN.
4. `pnpm typecheck` verde.

Orden:
- **B1** LoginPage + OnboardingPage.
- **B2** DashboardPage.
- **B3** ChatPage.
- **B4** DepartmentsPage + DepartmentDetailPage.
- **B5** TasksPage + TaskDetailPage.
- **B6** AgentsPage.
- **B7** AnalyticsPage.
- **B8** DocumentsPage + IntegrationsPage.
- **B9** CompanyPage + MemoryFilePage.
- **B10** TimelinePage + OrchestrationDetailPage + MarketingOverviewPage.
- **B11** SettingsPage (cierra hardcoded + Toggle bug + `nameKey`).

### Fase C — Componentes (P0/P1)
**2-3 commits.**

- C1 — `ActivityFeed`, `Timeline`, `JsonBlock`, `ErrorState`, `AgentCard`, `TaskCard`: hardcoded → i18n.
- C2 — `Dialog`, `Drawer`, `Toaster`: aria-labels → i18n.
- C3 — B-02 (`h-4.5`) + B-03 (Toggle `bg-white`).

### Fase D — Branding y continuidad (P0)
**~4 commits, orden:**

- **D1** — Header unificado: altura (`h-16`), z-index (`z-40`), fondo (`bg-background/40`), backdrop-blur (`md`). Aplicar a Topbar. Cerrar P0-01.
- **D2** — Logo rx ratio: ajustar `Logo.tsx` para que el rounded-square use ratio `14/64` constante (`rounded-[22%]`). Cerrar P0-04 ratios.
- **D3** — Logo en Login + Onboarding: añadir `<Logo size={32} variant="full" />` en LoginPage header; reemplazar `Sparkles` por `<Logo size={28} />` en OnboardingPage header. Cerrar B-04.
- **D4** — Headers de página con marca DEPARTIFY: introducir `<PageHeader>` reutilizable (`<Logo compact>` + icono de área + título + subtítulo + CTA). Migrar las 20 páginas. Cerrar B-05 (nuevo) y P0-04.
- **D5** — Footer del Portal como espejo de la Landing: añadir descripción corta + 3 columnas (Producto, Empresa, Ecosistema). Los links de Producto/Empresa apuntan a la Landing; la columna Ecosistema lista los 4 sub-dominios. Cerrar P0-03.
- **D6** — Container max-width: introducir `mx-auto max-w-[1320px] px-5 sm:px-8` consistente con la Landing. Migrar las páginas que usan `max-w-7xl`. Cerrar P0-01 espaciado.
- **D7** — CTAs y tono (P0-06): tras Fase B, reemplazar verbos en inglés por imperativos/infinitivos españoles (`Open` → `Abrir`, `Save` → `Guardar`, etc.).

### Fase E — Validación final
- `pnpm typecheck` ✅
- `pnpm test` ✅
- `pnpm build` ✅

### Fase F — Commit final + push
- Mensaje: `feat(ux): complete Spanish localization and experience polish`
- Push a `main`.

---

## 6. Estimación

- **Fase A:** 5 min
- **Fase B (11 commits):** ~3-5 h
- **Fase C (3 commits):** ~30 min
- **Fase D (7 commits):** ~2-3 h
- **Fase E + F:** ~5 min

**Total:** ~6-9 horas, ~22-25 commits pequeños.

---

## 7. Referencias antiguas en código

`grep -rE "deptify\.com|deptartify|deptia|app\.deptify"` tras el commit anterior:

```
$ grep -rE "deptify\.com|deptartify|deptia|app\.deptify" \
    --include="*.ts" --include="*.tsx" --include="*.html" \
    --include="*.toml" --include="*.json" --include="*.js" \
    --include="*.css" --include="*.md"
$ # 0 coincidencias
```

**No hay referencias a dominios antiguos en código fuente.** Único superviviente: `opencloud_workspace` (schema del backend) y `opencloud.locale` (storage key interno — fuera de scope).

---

## 8. Criterio de éxito (verificación CEO)

Tras aplicar el plan, el portal debe pasar este test:

1. ✅ El primer load en un navegador `es-ES` muestra Login en español.
2. ✅ El primer load en un navegador `en-US` muestra Login en inglés.
3. ✅ El primer load en un navegador `de-DE` (o cualquier otro) muestra Login en español.
4. ✅ El usuario puede cambiar idioma en Configuración y la elección persiste tras refresh.
5. ✅ Ninguna pantalla tiene mezcla de español + inglés.
6. ✅ Ningún placeholder, tooltip, aria-label, empty state, toast, modal o mensaje de error queda en inglés.
7. ✅ Ningún CTA queda en inglés — todos en imperativo o infinitivo español con tono de la Landing.
8. ✅ El Logo DEPARTIFY aparece en Login, Onboarding, Topbar, Sidebar, headers de página y footer con el mismo path SVG y mismas proporciones.
9. ✅ El Header del Portal tiene la misma altura, fondo y z-index que el Header de la Landing.
10. ✅ El Footer del Portal es un espejo del Footer de la Landing: descripción + 3 columnas (Producto → Landing, Empresa → Landing, Ecosistema → 4 sub-dominios).
11. ✅ Container max-width y espaciado interno del Portal coinciden con los de la Landing.
12. ✅ `pnpm typecheck` + `pnpm test` + `pnpm build` verdes.
13. ✅ Commit único final con el polish completo.
