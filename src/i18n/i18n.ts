/**
 * i18n — single source of truth for all user-facing strings in
 * the DEPARTIFY Client Portal.
 *
 * Design:
 *   - Flat dotted keys (`nav.home`, `login.title`) — easier to grep
 *     and less prone to "where did this string live?" archaeology.
 *   - Two locales today: `en`, `es`. New locales are added by
 *     extending the `LOCALES` tuple and providing a translation
 *     dictionary; nothing else needs to change.
 *   - The translation function falls back to `en` if a key is
 *     missing in the active locale — never throws and never shows
 *     a raw key in production.
 *   - Placeholder substitution: `{name}` style. Used for things like
 *     "Welcome aboard, {email}" or "Loading {count} tasks".
 *
 * Modules that need translations call `useI18n()` (from
 * `./I18nProvider`) and destructure `t`. Pure utilities (`detectLocale`,
 * `t` standalone) are re-exported here for tests and edge cases.
 */

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'es';

/**
 * Browser locale detection.
 *
 *   navigator.language -> "es-ES", "en-US", "es-MX", "pt-BR" …
 *
 * Rule (per product spec — Spanish first, English only when the
 * browser explicitly asks for it):
 *   - "en*"   -> English
 *   - anything else -> Spanish (the DEPARTIFY default).
 *
 * SSR-safe: returns DEFAULT_LOCALE when navigator is unavailable
 * (e.g. during build-time rendering in a non-DOM environment).
 */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const raw = (navigator.language ?? '').toLowerCase();
  if (raw.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

/**
 * Storage key — kept in one place so the I18nProvider and the
 * SettingsPage write/read the exact same key.
 */
export const LOCALE_STORAGE_KEY = 'opencloud.locale';

/**
 * Read the locale that the user has previously persisted. Returns
 * null when nothing is stored or the stored value is not a known
 * locale — callers should fall back to `detectBrowserLocale()` in
 * that case.
 */
export function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && (LOCALES as readonly string[]).includes(stored)) {
      return stored as Locale;
    }
  } catch {
    // localStorage may be unavailable (private mode, locked-down
    // corporate browsers, SSR shims…). Treat as no preference.
  }
  return null;
}

/**
 * Write the locale to localStorage. Safe to call during SSR — it
 * silently no-ops when `window` is undefined.
 */
export function writeStoredLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore
  }
}

// ────────────────────────────────────────────────────────────────────
// Translation catalog
// ────────────────────────────────────────────────────────────────────
//
// Each entry is a tuple of two strings, one per locale. Missing
// translations fall back to English so a half-finished es.json
// never breaks the UI.
//
// Conventions:
//   - Sentence case ("Continue" not "CONTINUE").
//   - No trailing whitespace; the t() function trims anyway.
//   - Use {placeholder} for interpolation. Keep names snake_case.
//   - Common UI vocabulary lives in `common.*` and is shared by every page.
//   - Per-page strings live under `<area>.<page>.<element>`.
//   - Errors / toasts use `feedback.*`.
//
// To add a new locale: add a third entry to every tuple below,
// matching the `en` ordering.
// ────────────────────────────────────────────────────────────────────

export type Entry = readonly [en: string, es: string];
export type Catalog = Record<string, Entry>;

export const catalog: Catalog = {
  // ── Common UI ─────────────────────────────────────────────────
  'common.cancel':           ['Cancel', 'Cancelar'],
  'common.save':             ['Save', 'Guardar'],
  'common.continue':         ['Continue', 'Continuar'],
  'common.back':             ['Back', 'Atrás'],
  'common.close':            ['Close', 'Cerrar'],
  'common.loading':          ['Loading…', 'Cargando…'],
  'common.saving':           ['Saving…', 'Guardando…'],
  'common.retry':            ['Retry', 'Reintentar'],
  'common.search':           ['Search', 'Buscar'],
  'common.dismiss':          ['Dismiss', 'Descartar'],
  'common.delete':           ['Delete', 'Eliminar'],
  'common.confirm':          ['Confirm', 'Confirmar'],
  'common.sign_out':         ['Sign out', 'Cerrar sesión'],
  'common.return_home':      ['Return home', 'Volver al inicio'],
  'common.required':         ['Required', 'Obligatorio'],
  'common.all':              ['All', 'Todo'],
  'common.none':             ['None', 'Ninguno'],
  'common.you':              ['You', 'Tú'],
  'common.settings':         ['Settings', 'Ajustes'],
  'common.theme':            ['Theme', 'Tema'],
  'common.dark':             ['Dark', 'Oscuro'],
  'common.light':            ['Light', 'Claro'],

  // ── Brand / app ───────────────────────────────────────────────
  'app.name':                ['DEPARTIFY', 'DEPARTIFY'],
  'app.tagline':             ['Business Operating System', 'Business Operating System'],
  'app.signin.title':        ['Sign in to DEPARTIFY', 'Inicia sesión en DEPARTIFY'],
  'app.signin.subtitle':     ['Welcome back — your Business Operating System is one click away.',
                              'Bienvenido de nuevo — tu Business Operating System está a un clic.'],
  'app.signup.title':        ['Create your DEPARTIFY account', 'Crea tu cuenta de DEPARTIFY'],
  'app.signup.subtitle':     ['Set up your workspace in under a minute.',
                              'Configura tu espacio de trabajo en menos de un minuto.'],
  'app.signed_in_as':        ['Signed in as {email}', 'Sesión iniciada como {email}'],

  // ── Navigation / sidebar / topbar ────────────────────────────
  'nav.home':                ['Home', 'Inicio'],
  'nav.executive_office':    ['Executive Office', 'Oficina Ejecutiva'],
  'nav.executive_room':      ['Executive Room', 'Sala Ejecutiva'],
  'nav.chat':                ['Chat', 'Chat'],
  'nav.departments':         ['Departments', 'Departamentos'],
  'nav.marketplace':         ['Marketplace', 'Marketplace'],
  'nav.onboarding':          ['Onboarding', 'Configuración inicial'],
  'nav.agents':              ['Agents', 'Agentes'],
  'nav.tasks':               ['Tasks', 'Tareas'],
  'nav.timeline':            ['Timeline', 'Cronología'],
  'nav.results':             ['Results', 'Resultados'],
  'nav.documents':           ['Documents', 'Documentos'],
  'nav.company':             ['Company', 'Empresa'],
  'nav.analytics':           ['Analytics', 'Analítica'],
  'nav.integrations':        ['Integrations', 'Integraciones'],
  'sidebar.search':          ['Search or jump to anywhere…',
                             'Busca o salta a cualquier sitio…'],
  'sidebar.theme_toggle':    ['Toggle theme', 'Cambiar tema'],
  'sidebar.sign_out':       ['Sign out', 'Cerrar sesión'],
  'sidebar.collapse':        ['Collapse sidebar', 'Plegar barra lateral'],
  'topbar.notifications':    ['Notifications', 'Notificaciones'],
  'topbar.commands':         ['Commands', 'Comandos'],
  'topbar.profile':          ['Profile', 'Perfil'],
  'topbar.menu':             ['Open menu', 'Abrir menú'],

  // ── Command palette ──────────────────────────────────────────
  'palette.search_placeholder': ['Search or jump to anywhere…',
                                  'Busca o salta a cualquier sitio…'],
  'palette.no_results':          ['No results for "{query}".',
                                  'Sin resultados para "{query}".'],
  'palette.navigate':            ['navigate', 'navegar'],
  'palette.select':              ['select', 'seleccionar'],
  'palette.group.navigate':      ['Navigate', 'Navegar'],
  'palette.group.create':        ['Create', 'Crear'],
  'palette.group.search':        ['Search', 'Buscar'],
  'palette.group.departments':   ['Departments', 'Departamentos'],
  'palette.group.tasks':         ['Tasks', 'Tareas'],
  'palette.group.conversations': ['Conversations', 'Conversaciones'],
  'palette.action.new_conversation': ['New conversation',
                                       'Nueva conversación'],
  'palette.action.search_documents':  ['Search documents',
                                       'Buscar documentos'],
  'palette.footer.left':        ['navigate', 'navegar'],
  'palette.footer.right':       ['DEPARTIFY · Business Operating System',
                                 'DEPARTIFY · Business Operating System'],

  // ── Notifications panel ─────────────────────────────────────
  'notifications.empty.title': ['You\u2019re all caught up',
                                'Estás al día'],
  'notifications.empty.description': ['Tasks, internal messages and approvals will appear here in real time.',
                                       'Las tareas, mensajes internos y aprobaciones aparecerán aquí en tiempo real.'],
  'notifications.empty.cta':    ['Open tasks', 'Abrir tareas'],

  // ── Login page ───────────────────────────────────────────────
  'login.mode.signin':          ['Sign in', 'Iniciar sesión'],
  'login.mode.signup':          ['Sign up', 'Crear cuenta'],
  'login.field.email':          ['Email', 'Email'],
  'login.field.password':       ['Password', 'Contraseña'],
  'login.field.full_name':      ['Full name', 'Nombre completo'],
  'login.field.password_hint':  ['At least 8 characters', 'Mínimo 8 caracteres'],
  'login.email_placeholder':    ['name@company.com', 'nombre@empresa.com'],
  'login.full_name_placeholder':['Ada Lovelace', 'Ada Lovelace'],
  'login.button.signin':        ['Sign in', 'Iniciar sesión'],
  'login.button.signup':        ['Create account', 'Crear cuenta'],
  'login.button.signing_in':    ['Signing in…', 'Iniciando sesión…'],
  'login.button.creating':      ['Creating account…', 'Creando cuenta…'],
  'login.error.invalid':        ['Sign-in failed', 'Error al iniciar sesión'],
  'login.success.signin':       ['Signed in', 'Sesión iniciada'],
  'login.success.signin_desc':  ['Loading your Business Operating System…',
                                 'Cargando tu Sistema Operativo Empresarial…'],
  'login.success.signup':       ['Account created', 'Cuenta creada'],
  'login.secure.title':         ['Secure session', 'Sesión segura'],
  'login.secure.description':   ['The session cookie is HttpOnly and HMAC-signed by the middleware. We never store your credentials in this app.',
                                 'La cookie de sesión es HttpOnly y está firmada con HMAC por el middleware. Nunca guardamos tus credenciales en esta app.'],
  'login.loop.title':           ['Loop detected.', 'Bucle detectado.'],
  'login.loop.description':     ['The destination resolved to the login screen — you will be sent to the home page after authentication instead.',
                                 'El destino resolvió a la pantalla de inicio de sesión — serás enviado a la página principal después de autenticarte.'],
  'login.destination':          ['Destination after sign-in:', 'Destino tras iniciar sesión:'],

  // ── Settings page ───────────────────────────────────────────
  'settings.title':             ['Settings', 'Ajustes'],
  'settings.subtitle':          ['Personal preferences and security. Org-wide controls live on the Company page.',
                                 'Preferencias personales y seguridad. Los controles de organización están en la página Empresa.'],
  'settings.profile.title':     ['Profile', 'Perfil'],
  'settings.profile.member':    ['member', 'miembro'],
  'settings.appearance.title':  ['Appearance', 'Apariencia'],
  'settings.appearance.subtitle':['Switch between dark and light, set language',
                                  'Cambia entre oscuro y claro, define el idioma'],
  'settings.notifications.title': ['Notifications', 'Notificaciones'],
  'settings.notifications.inapp':['In-app notifications', 'Notificaciones en la app'],
  'settings.notifications.email':['Email notifications', 'Notificaciones por email'],
  'settings.notifications.weekly':['Weekly digest', 'Resumen semanal'],
  'settings.ai_providers.title':['AI Providers (BYOK)', 'Proveedores de IA (BYOK)'],
  'settings.ai_providers.subtitle':['Bring your own API keys — we never store them in plaintext',
                                    'Trae tus propias claves API — nunca las guardamos en texto plano'],
  'settings.ai_providers.add':   ['Add provider', 'Añadir proveedor'],
  'settings.ai_providers.key_placeholder': ['Enter API key', 'Introduce la clave API'],
  'settings.ai_providers.last_used':  ['Last used', 'Último uso'],
  'settings.ai_providers.mask':       ['Mask key', 'Ocultar clave'],
  'settings.ai_providers.reveal':     ['Reveal key', 'Mostrar clave'],
  'settings.ai_providers.empty.title': ['No AI providers configured yet.',
                                         'Aún no hay proveedores de IA configurados.'],
  'settings.ai_providers.empty.description': ['Add your first provider key to let departments make autonomous requests.',
                                               'Añade tu primera clave de proveedor para que los departamentos hagan solicitudes autónomas.'],
  'settings.ai_providers.empty.cta': ['Add a provider', 'Añadir un proveedor'],
  'settings.security.title':    ['Security', 'Seguridad'],
  'settings.security.subtitle':['Session and access', 'Sesión y acceso'],
  'settings.signout_error':     ['Could not sign out', 'No se pudo cerrar la sesión'],
  'settings.language.label_en': ['English', 'Inglés'],
  'settings.language.label_es': ['Spanish', 'Español'],
  'settings.language.saved':    ['Preferences saved', 'Preferencias guardadas'],
  'settings.language.saved_desc': ['Your language preference is now active across the portal.',
                                    'Tu preferencia de idioma ya está activa en todo el portal.'],
  'settings.save_failed':       ['Could not save preferences', 'No se pudieron guardar las preferencias'],
  'settings.section.saved':     ['Configuration saved.', 'Configuración guardada.'],

  // ── Onboarding page ──────────────────────────────────────────
  'onboarding.title':           ['Let\u2019s set up your workspace',
                                'Vamos a configurar tu espacio de trabajo'],
  'onboarding.subtitle':        ['Five quick questions so the Executive Director knows your business. You can edit everything later from the Company page.',
                                 'Cinco preguntas rápidas para que el Director Ejecutivo conozca tu negocio. Podrás editarlo todo luego desde la página Empresa.'],
  'onboarding.field.name':      ['Company name', 'Nombre de la empresa'],
  'onboarding.field.name_ph':   ['e.g. Acme Industries', 'p. ej. Acme Industries'],
  'onboarding.field.website':   ['Website', 'Sitio web'],
  'onboarding.field.website_ph':['https://example.com', 'https://ejemplo.com'],
  'onboarding.field.website_hint': ['We\u2019ll start by just saving the URL — automatic enrichment of your company profile arrives in the next version.',
                                     'Empezaremos solo guardando la URL — el enriquecimiento automático de tu perfil de empresa llegará en la siguiente versión.'],
  'onboarding.field.sector':    ['Sector', 'Sector'],
  'onboarding.field.sector_ph': ['Pick or type your sector', 'Elige o escribe tu sector'],
  'onboarding.field.teamsize':  ['Team size', 'Tamaño del equipo'],
  'onboarding.teamsize.justme': ['Just me', 'Solo yo'],
  'onboarding.teamsize.2-10':   ['2–10', '2–10'],
  'onboarding.teamsize.11-50':  ['11–50', '11–50'],
  'onboarding.teamsize.51-200': ['51–200', '51–200'],
  'onboarding.teamsize.201':    ['201+', '201+'],
  'onboarding.field.objective': ['Primary objective', 'Objetivo principal'],
  'onboarding.objective.customers':  ['Get more customers', 'Conseguir más clientes'],
  'onboarding.objective.customers_desc': ['Lead generation and sales pipeline',
                                            'Generación de leads y pipeline de ventas'],
  'onboarding.objective.marketing':   ['Marketing', 'Marketing'],
  'onboarding.objective.marketing_desc': ['Brand awareness and campaigns',
                                             'Notoriedad de marca y campañas'],
  'onboarding.objective.seo':         ['SEO', 'SEO'],
  'onboarding.objective.seo_desc':     ['Organic search traffic and rankings',
                                         'Tráfico orgánico y posicionamiento'],
  'onboarding.objective.automation':   ['Automate processes', 'Automatizar procesos'],
  'onboarding.objective.automation_desc': ['Internal workflows and tooling',
                                            'Flujos internos y herramientas'],
  'onboarding.objective.software':     ['Build internal software', 'Crear software interno'],
  'onboarding.objective.software_desc':   ['Custom apps for the team',
                                              'Aplicaciones a medida para el equipo'],
  'onboarding.objective.other':        ['Other', 'Otro'],
  'onboarding.objective.other_desc':    ['Something else entirely',
                                            'Otra cosa distinta'],
  'onboarding.workspace_notice': ['Your workspace, organisation and owner profile are created automatically when you submit. Nothing leaves the platform — everything is encrypted at rest.',
                                   'Tu espacio de trabajo, organización y perfil de propietario se crean automáticamente al enviar. Nada sale de la plataforma — todo está cifrado en reposo.'],
  'onboarding.submit':          ['Open my Business OS', 'Abrir mi Business OS'],
  'onboarding.submitting':      ['Saving workspace…', 'Guardando espacio de trabajo…'],
  'onboarding.error.title':     ['Couldn\u2019t save your profile',
                                 'No se pudo guardar tu perfil'],
  'onboarding.error.retry':     ['Dismiss', 'Descartar'],
  'onboarding.error.provisioning': ['Your workspace is not yet provisioned. Refresh in a few seconds — the platform is still setting up your account.',
                                      'Tu espacio de trabajo aún no está listo. Refresca en unos segundos — la plataforma aún está configurando tu cuenta.'],
  'onboarding.welcome.title':   ['Welcome aboard', 'Bienvenido a bordo'],
  'onboarding.welcome.desc':    ['Loading your Business Operating System…',
                                 'Cargando tu Sistema Operativo Empresarial…'],
  'onboarding.footer.invite':    ['Already part of an existing workspace? Ask your admin to invite you instead.',
                                  '¿Ya formas parte de un espacio de trabajo existente? Pide a tu administrador que te invite.'],
  'onboarding.footer.data':      ['All data stays on your private infrastructure.',
                                  'Todos los datos permanecen en tu infraestructura privada.'],
  'onboarding.footer.cta':       ['One minute. Five questions. Done.',
                                  'Un minuto. Cinco preguntas. Listo.'],

  // ── Executive Office ─────────────────────────────────────────
  'office.header.title':        ['Executive Office', 'Oficina Ejecutiva'],
  'office.header.subtitle':     ['Business Operating System command center. Monitor health, review priorities, and coordinate every department from a single view.',
                                 'Centro de mando del Sistema Operativo Empresarial. Supervisa la salud, revisa prioridades y coordina cada departamento desde una sola vista.'],
  'office.last_updated':       ['Last updated {when}', 'Última actualización: {when}'],
  'office.kpi.tasks_running':    ['Tasks running', 'Tareas en curso'],
  'office.kpi.completed_today': ['Completed today', 'Completadas hoy'],
  'office.kpi.failed_today':     ['Failed today', 'Fallidas hoy'],
  'office.kpi.pending_tasks':    ['Pending tasks', 'Tareas pendientes'],
  'office.health.score':         ['Business Health Score', 'Índice de Salud del Negocio'],
  'office.health.gateway_up':    ['Gateway online', 'Gateway conectado'],
  'office.health.gateway_down':  ['Gateway offline', 'Gateway desconectado'],
  'health.status.healthy':        ['Operativo', 'Operativo'],
  'health.status.degraded':       ['Atención requerida', 'Atención requerida'],
  'health.status.unhealthy':      ['Incidencia', 'Incidencia'],
  'health.status.unknown':        ['Sin información', 'Sin información'],
  'lifecycle.active':             ['Activo', 'Activo'],
  'lifecycle.available':          ['Disponible', 'Disponible'],
  'lifecycle.licensed':           ['Licenciado', 'Licenciado'],
  'lifecycle.activating':         ['Activando', 'Activando'],
  'lifecycle.suspended':           ['Suspendido', 'Suspendido'],
  'lifecycle.error':              ['Con errores', 'Con errores'],
  'lifecycle.deactivating':       ['Desactivando', 'Desactivando'],
  'lifecycle.inactive':           ['Inactivo', 'Inactivo'],
  'lifecycle.installed':          ['Instalado', 'Instalado'],
  'task.status.queued':           ['En cola', 'En cola'],
  'task.status.assigned':         ['Asignada', 'Asignada'],
  'task.status.running':          ['En curso', 'En curso'],
  'task.status.waiting_approval': ['Esperando aprobación', 'Esperando aprobación'],
  'task.status.completed':        ['Completada', 'Completada'],
  'task.status.failed':           ['Con error', 'Con error'],
  'task.status.cancelled':        ['Cancelada', 'Cancelada'],
  'task.status.expired':          ['Expirada', 'Expirada'],
  'task.status.ready':            ['Lista', 'Lista'],
  'task.status.paused':           ['Pausada', 'Pausada'],
  'toast.dept.resumed':            ['Departamento reactivado', 'Departamento reactivado'],
  'toast.dept.resume_failed':      ['No se pudo reactivar', 'No se pudo reactivar'],
  'toast.dept.license_granted':    ['Licencia concedida', 'Licencia concedida'],
  'toast.dept.license_granted_desc': ['Licencia de prueba aplicada a {name}.', 'Licencia de prueba aplicada a {name}.'],
  'toast.dept.license_failed':     ['No se pudo conceder la licencia', 'No se pudo conceder la licencia'],
  'toast.health.title':            ['Estado del departamento', 'Estado del departamento'],
  'toast.health.error':            ['No se pudo comprobar el estado', 'No se pudo comprobar el estado'],
  'health.lifecycle.title':        ['Estado operativo', 'Estado operativo'],
  'health.health.title':           ['Salud', 'Salud'],
  'office.health.score_help':    ['Composite of gateway uptime, department health and task success rate.',
                                  'Combinado entre tiempo activo del gateway, salud de departamentos y tasa de éxito de tareas.'],
  'office.section.priorities':   ['Today\u2019s priorities', 'Prioridades de hoy'],
  'office.section.decisions':    ['Pending your decision', 'Pendientes de tu decisión'],
  'office.section.risks':        ['Risks & issues', 'Riesgos e incidencias'],
  'office.section.opportunities':['Opportunities', 'Oportunidades'],
  'office.section.timeline':     ['Executive timeline', 'Cronología ejecutiva'],
  'office.section.activity':     ['Recent activity', 'Actividad reciente'],
  'office.empty.priorities.title':   ['Nothing scheduled for today',
                                       'Nada programado para hoy'],
  'office.empty.priorities.desc':    ['New tasks will appear here as the Executive Director identifies work.',
                                        'Las nuevas tareas aparecerán aquí a medida que el Director Ejecutivo identifique trabajo.'],
  'office.empty.priorities.cta':      ['View all tasks', 'Ver todas las tareas'],
  'office.empty.decisions.title':     ['No pending decisions',
                                       'No hay decisiones pendientes'],
  'office.empty.decisions.desc':      ['Approvals will surface here as departments submit results.',
                                        'Las aprobaciones aparecerán aquí cuando los departamentos envíen resultados.'],
  'office.empty.risks.title':         ['All systems nominal',
                                       'Todos los sistemas en orden'],
  'office.empty.risks.desc':          ['No unhealthy departments or failed tasks detected.',
                                        'No se detectan departamentos con problemas ni tareas fallidas.'],
  'office.empty.opportunities.title': ['All departments activated',
                                       'Todos los departamentos activados'],
  'office.empty.opportunities.desc':  ['You\u2019re running the full Business Operating System.',
                                        'Estás ejecutando el Sistema Operativo Empresarial completo.'],
  'office.empty.timeline.title':     ['No timeline events yet',
                                       'Aún no hay eventos en la cronología'],
  'office.empty.timeline.desc':      ['Events from task completions, health checks and messages will appear here.',
                                        'Los eventos de tareas completadas, comprobaciones de salud y mensajes aparecerán aquí.'],
  'office.executive_director.title': ['Executive Director', 'Director Ejecutivo'],
  'office.executive_director.desc':  ['Always-on strategic coordinator',
                                        'Coordinador estratégico siempre activo'],
  'office.executive_director.cta1':   ['Start chat', 'Iniciar chat'],
  'office.executive_director.cta2':   ['Executive Room', 'Sala Ejecutiva'],
  'office.pulse.title':             ['Pulse', 'Pulso'],
  'office.pulse.events':            ['events', 'eventos'],
  'office.pulse.tasks':             ['tasks', 'tareas'],
  'office.pulse.departments':       ['departments', 'departamentos'],
  'office.pulse.empty':             ['No activity yet', 'Aún no hay actividad'],
  'office.pulse.empty_desc':        ['Once departments start working you\u2019ll see the pulse here.',
                                      'Cuando los departamentos empiecen a trabajar verás el pulso aquí.'],
  'office.memory.title':           ['Corporate memory', 'Memoria corporativa'],
  'office.memory.empty.title':      ['No memory files yet', 'Aún no hay archivos de memoria'],
  'office.memory.empty.desc':       ['The Executive Director will generate these as your company evolves.',
                                       'El Director Ejecutivo los generará a medida que tu empresa evolucione.'],
  'office.memory.manage':           ['Manage', 'Gestionar'],
  'office.company_health.title':    ['Company health', 'Salud de la empresa'],
  'office.company_health.gateway':  ['Gateway', 'Gateway'],
  'office.company_health.supabase': ['Supabase', 'Supabase'],
  'office.company_health.active_depts': ['Departments active', 'Departamentos activos'],
  'office.company_health.active_orchestrations': ['Active orchestrations', 'Orquestaciones activas'],
  'office.dept_summary.title':      ['Department summary', 'Resumen de departamentos'],
  'office.dept_summary.all':        ['All departments', 'Todos los departamentos'],
  'office.dept_summary.active':     ['active', 'activo'],
  'office.dept_summary.available':  ['available', 'disponible'],
  'office.dept_summary.last_updated': ['Last updated {when}', 'Actualizado {when}'],
  'office.unhealthy.title':         ['{name} is unhealthy', '{name} no está saludable'],
  'office.unhealthy.task_failed':   ['Task "{title}" failed', 'Tarea "{title}" falló'],
  'office.loop_detected':           ['Loop detected', 'Bucle detectado'],
  'office.activate':                ['Activate', 'Activar'],
  'office.talk_to_director':        ['Talk to Executive Director', 'Hablar con el Director Ejecutivo'],

  // ── Marketplace ──────────────────────────────────────────────
  'marketplace.header.title':     ['Marketplace', 'Marketplace'],
  'marketplace.header.subtitle':  ['Browse and install department apps for your Business Operating System.',
                                   'Explora e instala aplicaciones de departamento para tu Sistema Operativo Empresarial.'],
  'marketplace.active_count':     ['{active} active · {available} available',
                                   '{active} activos · {available} disponibles'],
  'marketplace.search.placeholder': ['Search apps, capabilities or descriptions…',
                                      'Busca apps, capacidades o descripciones…'],
  'marketplace.search.aria':       ['Search marketplace', 'Buscar en marketplace'],
  'marketplace.filter.all':        ['All categories', 'Todas las categorías'],
  'marketplace.empty.title':      ['No apps match', 'No hay apps que coincidan'],
  'marketplace.empty.desc':       ['Try a different search or remove filters.',
                                  'Prueba con otra búsqueda o quita filtros.'],
  'marketplace.empty.cta':         ['Reset filters', 'Restablecer filtros'],
  'marketplace.action.install':    ['Install', 'Instalar'],
  'marketplace.action.installing': ['Installing…', 'Instalando…'],
  'marketplace.action.installed':  ['Installed', 'Instalado'],
  'marketplace.action.open':       ['Open', 'Abrir'],
  'marketplace.action.activating': ['Installing…', 'Instalando…'],
  'marketplace.toast.installed':   ['Department installed', 'Departamento instalado'],
  'marketplace.toast.installed_desc': ['{name} is now active.', '{name} ya está activo.'],
  'marketplace.toast.failed':      ['Installation failed', 'La instalación falló'],
  'marketplace.hint.title1':       ['What is a department app?', '¿Qué es una app de departamento?'],
  'marketplace.hint.desc1':        ['A bundle of agent capabilities, prompts and policies ready to work for your company.',
                                   'Un paquete de capacidades, prompts y políticas listo para trabajar en tu empresa.'],
  'marketplace.hint.title2':       ['How do I install one?', '¿Cómo instalo una?'],
  'marketplace.hint.desc2':        ['Click Install. We provision the workspace, register the manager agent and run the first health check.',
                                   'Pulsa Instalar. Aprovisionamos el espacio, registramos el agente y ejecutamos la primera comprobación de salud.'],
  'marketplace.hint.title3':       ['Can I remove apps?', '¿Puedo eliminar apps?'],
  'marketplace.hint.desc3':        ['Yes. Open any department page and press Deactivate. Data is preserved.',
                                   'Sí. Abre la página del departamento y pulsa Desactivar. Los datos se conservan.'],

  // ── Departments page ─────────────────────────────────────────
  'departments.header.title':    ['Departments', 'Departamentos'],
  'departments.header.subtitle': ['Installed department apps', 'Apps de departamento instaladas'],
  'departments.empty.title':     ['No departments installed yet',
                                  'Aún no hay departamentos instalados'],
  'departments.empty.desc':      ['Activate the first department from the Marketplace.',
                                  'Activa el primer departamento desde el Marketplace.'],
  'departments.empty.cta':       ['Browse marketplace', 'Explorar marketplace'],

  // ── Tasks page ───────────────────────────────────────────────
  'tasks.header.title':          ['Tasks', 'Tareas'],
  'tasks.header.subtitle':       ['Internal queue', 'Cola interna'],
  'tasks.empty.title':           ['No tasks yet', 'Aún no hay tareas'],
  'tasks.empty.desc':            ['As departments accept work, tasks will appear here.',
                                 'Cuando los equipos acepten trabajo, las tareas aparecerán aquí.'],
  'tasks.new':                   ['New task', 'Nueva tarea'],
  'tasks.filter':                ['Filter', 'Filtrar'],
  'tasks.all_departments':       ['All teams', 'Todos los equipos'],
  'tasks.status.all':            ['All', 'Todo'],
  'tasks.create_first':          ['Create the first task', 'Crear la primera tarea'],
  'tasks.approve':               ['Approve', 'Aprobar'],
  'tasks.reject':                ['Reject', 'Rechazar'],
  'tasks.cancel':                ['Cancel', 'Cancelar'],
  'tasks.retry':                 ['Retry', 'Reintentar'],
  'tasks.cancelled_toast':       ['Task cancelled', 'Tarea cancelada'],
  'tasks.cancel_failed':         ['Cancel failed', 'No se pudo cancelar'],
  'tasks.retry_toast':           ['Task re-queued', 'Tarea reencolada'],
  'tasks.retry_failed':          ['Retry failed', 'No se pudo reintentar'],
  'tasks.approved_toast':        ['Approved', 'Aprobado'],
  'tasks.rejected_toast':        ['Rejected', 'Rechazado'],
  'tasks.decision_failed':       ['Decision failed', 'No se pudo registrar la decisión'],
  'tasks.create_dialog.title':   ['Create a task', 'Crear una tarea'],
  'tasks.create_dialog.desc':    ['Delegate work to any department — they will execute through their manager agent.',
                                 'Delega trabajo a cualquier departamento: lo ejecutará a través de su manager.'],
  'tasks.create.department':     ['Department', 'Departamento'],
  'tasks.create.department_placeholder': ['Select a department…', 'Selecciona un departamento…'],
  'tasks.create.title_label':    ['Title', 'Título'],
  'tasks.create.title_placeholder': ['What needs to happen?', '¿Qué tiene que ocurrir?'],
  'tasks.create.description_label': ['Description', 'Descripción'],
  'tasks.create.description_placeholder': ['Add the context, links or steps…', 'Añade contexto, enlaces o pasos…'],
  'tasks.create.priority_label': ['Priority', 'Prioridad'],
  'tasks.create.required_toast': ['Department and title are required', 'Departamento y título son obligatorios'],
  'tasks.create.success_toast':  ['Task created', 'Tarea creada'],
  'tasks.create.failed_toast':   ['Could not create task', 'No se pudo crear la tarea'],
  'tasks.create.submit':         ['Create', 'Crear'],
  'tasks.create.dialog_cancel':  ['Cancel', 'Cancelar'],

  'results.header.title':         ['Results', 'Resultados'],
  'results.header.subtitle':      ['Library of reports, completed tasks, memory files and uploaded documents.',
                                  'Biblioteca de informes, tareas completadas, archivos de memoria y documentos subidos.'],
  'results.tab.tasks':            ['Tasks', 'Tareas'],
  'results.tab.memory':           ['Memory', 'Memoria'],
  'results.tab.documents':        ['Documents', 'Documentos'],
  'results.tasks.empty.title':    ['No completed tasks yet', 'Aún no hay tareas completadas'],
  'results.tasks.empty.desc':     ['As departments complete work, their outputs appear here.',
                                  'Cuando los departamentos terminen trabajo, sus resultados aparecerán aquí.'],
  'results.memory.empty.title':   ['No memory files yet', 'Aún no hay archivos de memoria'],
  'results.memory.empty.desc':    ['Generate corporate memory from the Company page to start populating this library.',
                                  'Genera la memoria corporativa desde la página Empresa para empezar a llenar esta biblioteca.'],
  'results.memory.empty.action':  ['Open company', 'Abrir empresa'],
  'results.documents.empty.title':['No documents yet', 'Aún no hay documentos'],
  'results.documents.title':      ['Generated documents', 'Documentos generados'],
  'results.documents.subtitle':   ['Outputs from completed tasks', 'Resultados de tareas completadas'],
  'common.open':                  ['Open', 'Abrir'],

  // ── Toaster feedback ─────────────────────────────────────────
  'feedback.signed_in':          ['Signed in', 'Sesión iniciada'],
  'feedback.account_created':    ['Account created', 'Cuenta creada'],
  'feedback.loading_bos':        ['Loading your Business Operating System…',
                                  'Cargando tu Sistema Operativo Empresarial…'],
  'feedback.saved':              ['Saved', 'Guardado'],
  'feedback.delete_failed':      ['Could not delete', 'No se pudo eliminar'],
  'feedback.error':              ['Something went wrong', 'Algo salió mal'],
  'feedback.copied':             ['Copied', 'Copiado'],

  // ── Sprint 1 — Customer Zero ──────────────────────────────
  'activity.empty':                ['No activity yet.', 'Aún no hay actividad.'],
  'error.title':                   ['Could not load this content', 'No se pudo cargar este contenido'],
  'error.description':             ['Try again or come back later.', 'Inténtalo de nuevo o vuelve más tarde.'],
  'common.copy_json':              ['Copy JSON', 'Copiar JSON'],
  'common.all_categories':         ['All categories', 'Todas las categorías'],

  'dashboard.hero.eyebrow':        ['What do you want to achieve today?', '¿Qué quieres conseguir hoy?'],
  'dashboard.hero.title':          ['Tell your company what you need and we will get started.',
                                    'Dile a tu empresa qué necesitas y empezaremos.'],
  'dashboard.hero.subtitle_ok':    ['Your company is connected and ready to work.',
                                    'Tu empresa está conectada y lista para trabajar.'],
  'dashboard.hero.subtitle_down':  ['We can\'t reach your company. Check the connection.',
                                    'No podemos conectar con tu empresa. Revisa la conexión.'],
  'dashboard.cta.ask':             ['Ask your company', 'Pedir algo a tu empresa'],
  'dashboard.cta.activate':        ['Activate a team', 'Activar un equipo'],
  'dashboard.quick.title':         ['Quick actions', 'Acciones rápidas'],
  'dashboard.quick.view_all':      ['See all', 'Ver todas'],
  'dashboard.dept_activity.title': ['What your teams are doing', 'Actividad de Departamentos'],
  'dashboard.dept_activity.sub':   ['Live status from your active teams',
                                    'Estado en vivo de tus equipos activos'],
  'dashboard.dept_activity.empty.title': ['Activate your first team', 'Activa tu primer equipo'],
  'dashboard.dept_activity.empty.desc':  ['Pick a team and we will start working for your company.',
                                           'Elige un equipo y empezaremos a trabajar para tu empresa.'],
  'dashboard.dept_card.tasks':     ['{n} tasks in progress', '{n} tareas en curso'],

  'actions.growth':                ['Get more customers', 'Conseguir más clientes'],
  'actions.meeting':               ['Prepare a meeting', 'Preparar una reunión'],
  'actions.inbox':                 ['Reply to emails', 'Responder correos'],
  'actions.campaign':              ['Create a campaign', 'Crear una campaña'],
  'actions.offer':                 ['Prepare an offer', 'Preparar una oferta'],
  'actions.growth_desc':           ['Find leads and bring them to your company.',
                                    'Detecta leads y tráelos a tu empresa.'],
  'actions.meeting_desc':          ['Get a clear agenda and talking points in one place.',
                                    'Una agenda clara y puntos clave en un solo lugar.'],
  'actions.inbox_desc':            ['Sort and respond to your pending emails.',
                                    'Ordena y responde tus correos pendientes.'],
  'actions.campaign_desc':         ['Design a campaign ready to publish.',
                                    'Diseña una campaña lista para publicar.'],
  'actions.offer_desc':            ['Build a tailored offer for a real lead.',
                                    'Crea una oferta a medida para un lead real.'],

  'chat.header.title':             ['Conversations', 'Conversaciones'],
  'chat.header.new':               ['New conversation', 'Nueva conversación'],
  'chat.empty.title':              ['No conversations yet', 'Aún no hay conversaciones'],
  'chat.delete.confirm':          ['Delete this conversation?', '¿Borrar esta conversación?'],
  'chat.status.streaming':         ['streaming…', 'transmitiendo…'],
  'chat.status.ready':             ['ready', 'listo'],
  'chat.status.live':              ['live', 'en vivo'],
  'chat.status.idle':              ['idle', 'en espera'],
  'chat.start.title':              ['Start a conversation', 'Empieza una conversación'],
  'chat.start.desc':               ['Talk to {name} about goals, plans, reports and approvals.',
                                    'Habla con {name} sobre objetivos, planes, informes y aprobaciones.'],
  'chat.start.suggestion.weekly':  ['Summarise what my departments did this week',
                                    'Resúmeme lo que han hecho mis departamentos esta semana'],
  'chat.start.suggestion.launch':   ['Draft a plan to launch the new pricing page',
                                    'Borrador de plan para lanzar la nueva página de precios'],
  'chat.start.suggestion.approve': ['Approve the open tasks waiting for me',
                                    'Aprueba las tareas pendientes que me esperan'],
  'chat.start.suggestion.memory':   ['Show me the latest corporate memory files',
                                    'Muéstrame los últimos archivos de memoria corporativa'],
  'chat.composer.placeholder':     ['Message {name}…', 'Escribe a {name}…'],
  'chat.composer.hint':            ['Enter to send · Shift+Enter for newline',
                                    'Intro para enviar · Mayús+Intro para nueva línea'],
  'chat.message.thinking':         ['thinking…', 'pensando…'],
  'chat.message.sources':          ['Sources used', 'Fuentes utilizadas'],
  'chat.jump_latest':              ['Jump to latest', 'Ir al último'],

  'departments.search.placeholder':['Search teams, capabilities or examples…',
                                    'Busca equipos, capacidades o ejemplos…'],
  'departments.search.label':      ['Search departments', 'Buscar departamentos'],
  'departments.detail.recent_tasks':     ['Recent tasks', 'Tareas recientes'],
  'departments.detail.no_tasks':          ['No tasks yet', 'Aún no hay tareas'],
  'departments.detail.internal_activity':['Internal activity', 'Actividad interna'],
  'departments.detail.internal_sub':      ['Live messages from this team',
                                           'Mensajes en vivo de este equipo'],
  'departments.detail.health_title':      ['Last health check', 'Última comprobación'],
  'departments.detail.health_sub':        ['Detailed checks from the most recent run',
                                           'Comprobaciones detalladas del último ciclo'],
  'departments.detail.no_health':         ['No health check run yet',
                                           'Aún no se ha comprobado la salud'],
  'departments.detail.manager_sub':       ['Lead agent coordinating this team',
                                           'Agente principal que coordina este equipo'],
  'departments.detail.health.cta':        ['Run health check', 'Comprobar salud'],
  'departments.detail.activate':          ['Activate', 'Activar'],
  'departments.detail.reactivate':        ['Reactivate', 'Reactivar'],
  'departments.detail.deactivate':        ['Deactivate', 'Desactivar'],
  'departments.detail.suspend':           ['Suspend', 'Suspender'],
  'departments.detail.resume':            ['Resume', 'Reanudar'],
  'departments.detail.configure':         ['Configure', 'Configurar'],
  'departments.detail.license':           ['Grant lab license', 'Conceder licencia de prueba'],
  'departments.detail.toast.activated':    ['Team activated', 'Equipo activado'],
  'departments.detail.toast.activated_desc':['{name} is now working for your company.',
                                             '{name} ya está trabajando para tu empresa.'],
  'departments.detail.toast.activate_failed':['Could not activate team', 'No se pudo activar el equipo'],
  'departments.detail.toast.deactivated':  ['Team deactivated', 'Equipo desactivado'],
  'departments.detail.toast.deactivate_failed':['Could not deactivate', 'No se pudo desactivar'],
  'departments.detail.toast.suspended':   ['Team suspended', 'Equipo suspendido'],
  'departments.detail.toast.suspend_failed':['Could not suspend', 'No se pudo suspender'],

  'marketplace.installed':         ['Active', 'Activo'],
  'marketplace.installing':        ['Activating…', 'Activando…'],
  'marketplace.install_ok':        ['Team activated', 'Equipo activado'],
  'marketplace.install_ok_desc':   ['{name} is now active.', '{name} ya está activo.'],
  'marketplace.install_failed':    ['Could not activate', 'No se pudo activar'],
  'marketplace.hint.what.title':   ['What is a team?', '¿Qué es un equipo?'],
  'marketplace.hint.what.desc':    ['A bundle of capabilities, prompts and policies ready to work for your company.',
                                    'Un conjunto de capacidades, instrucciones y políticas listas para trabajar para ti.'],
  'marketplace.hint.how.title':    ['How do I activate one?', '¿Cómo activo uno?'],
  'marketplace.hint.how.desc':     ['Click Activate. We provision the workspace, register the lead agent and run the first health check.',
                                    'Pulsa Activar. Provisionamos el espacio, registramos al responsable y lanzamos la primera comprobación.'],
  'marketplace.hint.remove.title': ['Can I remove a team?', '¿Puedo quitar un equipo?'],
  'marketplace.hint.remove.desc':  ['Yes. Open any team page and deactivate it. Data is preserved.',
                                    'Sí. Abre la página del equipo y desactívalo. Los datos se conservan.'],

  'agents.search.placeholder':     ['Search by agent id, team or capability…',
                                    'Busca por agente, equipo o capacidad…'],
  'agents.empty.title':            ['No agents match', 'Ningún agente coincide'],
  'agents.empty.desc':             ['Adjust your search or filters.', 'Ajusta tu búsqueda o filtros.'],

  'analytics.kpi.total':           ['Total tasks', 'Tareas totales'],
  'analytics.kpi.completion':      ['Completion', 'Finalización'],
  'analytics.kpi.messages':        ['Internal messages', 'Mensajes internos'],
  'analytics.kpi.latency':         ['Average latency', 'Latencia media'],
  'analytics.tasks_by_team':       ['Tasks by team', 'Tareas por equipo'],
  'analytics.tasks_by_team_sub':   ['Distribution across active and inactive teams',
                                    'Distribución entre equipos activos e inactivos'],
  'analytics.messages_type':      ['Message types', 'Tipos de mensaje'],
  'analytics.messages_type_sub':   ['How your teams communicate', 'Cómo se comunican tus equipos'],
  'analytics.system':              ['System', 'Sistema'],
  'analytics.system_sub':          ['Gateway and database reachability',
                                    'Conectividad del gateway y la base de datos'],
  'analytics.no_data':             ['No data yet', 'Aún no hay datos'],

  'documents.upload.cta':          ['Upload document', 'Subir documento'],
  'documents.upload.title':        ['Upload document', 'Subir documento'],
  'documents.upload.drop':         ['Drop a file or click to select',
                                    'Suelta un archivo o haz clic para seleccionar'],
  'documents.empty.title':         ['No documents yet', 'Aún no hay documentos'],
  'documents.toast.uploaded':      ['Document uploaded', 'Documento subido'],
  'documents.toast.upload_failed': ['Upload failed', 'Error al subir'],
  'documents.toast.deleted':       ['Document deleted', 'Documento eliminado'],
  'documents.toast.delete_failed': ['Delete failed', 'Error al eliminar'],
  'documents.confirm_delete':      ['Delete {name}?', '¿Eliminar {name}?'],

  'integrations.header.subtitle':  ['Connect external services. Available soon.',
                                    'Conecta servicios externos. Disponible pronto.'],
  'integrations.api_keys':         ['API keys', 'Claves API'],
  'integrations.api_keys_sub':     ['Manage programmatic access to your workspace',
                                    'Gestiona el acceso programático a tu espacio'],
  'integrations.no_keys':          ['No keys generated yet', 'Aún no se han generado claves'],
  'integrations.generate':         ['Generate key', 'Generar clave'],

  'company.empty.title':           ['No company profile yet', 'Aún no hay perfil de empresa'],
  'company.empty.desc':            ['Create your company profile to start personalising your teams.',
                                    'Crea el perfil de tu empresa para empezar a personalizar tus equipos.'],
  'company.no_description':        ['No description set yet.', 'Aún no hay descripción.'],
  'company.brand_placeholder':     ['brand', 'marca'],
  'company.sector_placeholder':    ['sector', 'sector'],
  'company.toast.updated':         ['Company updated', 'Empresa actualizada'],
  'company.toast.update_failed':   ['Update failed', 'Error al actualizar'],
  'company.regenerate':           ['Regenerate', 'Regenerar'],
  'company.toast.regenerated':     ['Memory regenerated', 'Memoria regenerada'],
  'company.memory.version':        ['v{version} · updated {when} ({absolute})',
                                   'v{version} · actualizada {when} ({absolute})'],

  'memory.not_found.title':        ['Memory file not found', 'Archivo de memoria no encontrado'],
  'memory.not_found.desc':         ['No file with key "{key}" exists for this company.',
                                    'No existe ningún archivo con la clave "{key}" para esta empresa.'],
  'memory.back_to_company':        ['Back to company', 'Volver a la empresa'],
  'memory.corporate':              ['corporate memory', 'memoria corporativa'],
  'memory.file_key':               ['File key:', 'Clave del archivo:'],

  'timeline.header.subtitle':      ['Everything that has happened across your teams.',
                                    'Todo lo que ha ocurrido en tus equipos.'],
  'timeline.loading':              ['Loading timeline…', 'Cargando cronología…'],

  'orchestration.not_specified':   ['Orchestration not specified', 'Orquestación no especificada'],
  'orchestration.missing_id':      ['Missing id.', 'Falta el id.'],
  'orchestration.loading':        ['Loading orchestration…', 'Cargando orquestación…'],

  'marketing.open_team':           ['Talk to the team', 'Hablar con el equipo'],
  'marketing.configure':           ['Configure', 'Configurar'],
  'marketing.status.active':       ['active', 'activo'],

  'office.cta.open':               ['Open office', 'Abrir oficina'],
  'office.cta.talk':               ['Talk to Executive Director', 'Hablar con el Director Ejecutivo'],
  'office.cta.activate':           ['Activate', 'Activar'],
  'office.cta.manage':             ['Manage', 'Gestionar'],
  'office.cta.all_teams':          ['All teams', 'Todos los equipos'],
  'office.cta.view_tasks':         ['View all tasks', 'Ver todas las tareas'],

  'megamenu.title':                ['Teams for your company', 'Equipos para tu empresa'],
  'megamenu.featured':             ['Top', 'Top'],
  'megamenu.founder.title':        ['Founder Edition', 'Founder Edition'],
  'megamenu.founder.desc':         ['Direct guidance from the DEPARTIFY team for your first 30 days.',
                                    'Acompañamiento directo del equipo DEPARTIFY durante tus primeros 30 días.'],
  'megamenu.usecases.title':       ['Use cases', 'Casos de uso'],
  'megamenu.usecases.desc':        ['Companies like yours are already using DEPARTIFY.',
                                    'Empresas como la tuya ya están usando DEPARTIFY.'],
  'megamenu.coming.title':         ['Coming soon', 'Próximamente'],
  'megamenu.coming.desc':          ['Three new teams this quarter.',
                                    'Tres equipos nuevos este trimestre.'],
  'megamenu.view_all.title':       ['See every team', 'Ver todos los equipos'],
  'megamenu.view_all.desc':        ['Compare what each one delivers and start when you want.',
                                    'Compara qué entrega cada uno y empieza cuando quieras.'],

  'settings.profile.info':         ['Information tied to your account', 'Información de tu cuenta'],
  'settings.notifications.intro':  ['Choose how the portal reaches you',
                                    'Cómo quieres que el portal te contacte'],
  'settings.ai_providers.how':     ['How BYOK works', 'Cómo funciona BYOK'],
  'settings.ai_providers.how_desc':['Your key is sent directly to the provider. We never store it in plaintext.',
                                    'Tu clave se envía directamente al proveedor. Nunca la guardamos en texto plano.'],
  'settings.ai_providers.saved_toast': ['{name} key saved', 'Clave de {name} guardada'],
  'settings.language.current_es':  ['Language set to Spanish.', 'Idioma configurado en español.'],
  'settings.language.current_en':  ['Language set to English.', 'Language set to English.'],

};

// ────────────────────────────────────────────────────────────────────
// Translation function
// ────────────────────────────────────────────────────────────────────

/**
 * Look up a translation. Returns the active locale's string, or
 * the English fallback if the key is missing there, or the key
 * itself as a last resort (so a typo in the catalog shows up in the
 * UI rather than throwing).
 *
 * Variables are interpolated as `{name}` placeholders.
 */
export function t(
  key: string,
  locale: Locale,
  vars?: Record<string, string | number>,
  fallback?: string,
): string {
  const entry = catalog[key];
  const raw = entry ? entry[locale === 'es' ? 1 : 0] : undefined;
  const fromCatalog = entry ? entry[0] : undefined;
  const template = raw ?? fromCatalog ?? fallback ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const value = vars[k];
    return value === undefined || value === null ? `{${k}}` : String(value);
  });
}

/**
 * Convenience helper for callers that have a plain string of English
 * (e.g. an enum value) and want to translate it through the catalog.
 * Returns the input verbatim if no entry is found.
 */
export function translateEnum(value: string, locale: Locale): string {
  return catalog[value] ? t(value, locale) : value;
}