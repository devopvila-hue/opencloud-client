# PRODUCT_UNIFICATION_AUDIT

**Fecha:** 2026-08-03
**Scope:** Auditoría de los 4 puntos de entrada del ecosistema DEPARTIFY
**Producto bajo control:** `opencloud-client` (este repositorio)
**Producto de referencia (no modificable):** `departia` (landing pública en `departify.app`)

---

## 1. Inventario de puntos de entrada

| Punto | URL | Estado | Stack | Repo | Modificable |
|---|---|---|---|---|---|
| **Landing** | `https://departify.app` | ✅ 200 OK | Next.js (RSC) | `departia` | ❌ NO |
| **Portal** | `https://app.departify.app` | ✅ 200 OK (Netlify edge) | Vite + React 19 SPA | `opencloud-client` | ✅ SÍ (este) |
| **DNA** | `https://docs.departify.app` | ⚠️ Apunta a `docs.deptartify.com` (typo histórico) | SPA React (single page, contenido en JS) | (externo) | ❌ NO |
| **API** | `https://api.departify.app` | ❌ DNS no resuelve / 0 bytes | — | (backend externo) | ❌ NO |

**Conclusión clave:** Solo el Portal está bajo nuestro control. La auditoría del Logo, header y footer se hace contra el código de la **Landing** (que sí es público y de solo lectura para nosotros). El DNA no expone HTML estático y el API no responde, así que sus observaciones son incompletas.

---

## 2. Inventario de URLs públicas — estado actual

### 2.1 En el Portal (`opencloud-client`)

Tras los commits previos (`96e057b`, `a56672f`, `475f8e4`), en código fuente **no queda ninguna referencia antigua**. La única referencia residual al nombre interno "opencloud" está en storage keys locales:

- `localStorage['opencloud.locale']` — clave de i18n (interno, nunca visible al usuario, decisión explícita previa: no romper compat).
- `opencloud_workspace` en `schemas.ts` — viene del backend, no es URL.

### 2.2 En la Landing (`departia`)

🚨 **Inconsistencias graves detectadas (no modificables por nosotros):**

| # | Ubicación | Valor actual | Esperado | Impacto |
|---|---|---|---|---|
| L-01 | `<link rel="canonical">` | `https://deptify.com` | `https://departify.app` | SEO apunta al dominio antiguo |
| L-02 | `<meta og:url>` | `https://deptify.com` | `https://departify.app` | Open Graph apunta al dominio antiguo |
| L-03 | `<link rel="canonical">` (otros href) | `href="https://deptify.com"` (al menos un anchor) | `https://departify.app` | Link roto hacia dominio inexistente |
| L-04 | `/favicon.svg` `aria-label` y `<title>` | `"Nexus"` | `"DEPARTIFY"` | Favicon anuncia marca equivocada |
| L-05 | CTAs `/registro` y `/acceso` | Rutas internas de la propia landing | Deberían apuntar a `https://app.departify.app/login` y `/register` | Doble sistema de auth; el usuario no llega al portal real |

**Estas observaciones se documentan pero NO se corrigen** — el usuario dejó explícito que `departia` solo sirve como referencia. Si en algún momento el equipo quiere unificar, estos son los puntos a tocar.

### 2.3 En el DNA (`docs.departify.app`)

🚨 El HTML estático servido expone referencias rotas:

| # | Ubicación | Valor actual | Esperado |
|---|---|---|---|
| D-01 | `<link rel="canonical">` | `https://docs.deptartify.com/` | `https://docs.departify.app/` |
| D-02 | `<meta description>` | `"Deptartify DNA — …"` | `"DEPARTIFY DNA — …"` |
| D-03 | `<link rel="icon">` | `/brand/logo/deptartify.jpg` (JPG obsoleto) | SVG con la D oficial |
| D-04 | `og:title`, `og:description`, `twitter:title` | `"Deptartify DNA"`, `"Manual oficial de Deptartify"` | `"DEPARTIFY DNA"`, etc. |

**No se modifica** — fuera de scope.

### 2.4 En el API (`api.departify.app`)

🚨 **No responde** (DNS probablemente). No auditable desde aquí. Se asume que está operativo detrás de la pasarela del middleware (los smoke tests del portal usan `/api/v1/*` y se mockean en test).

---

## 3. Auditoría visual — comparativa lado a lado

### 3.1 Logo (P0)

| Punto de entrada | Logo actual | Patrón |
|---|---|---|
| **Landing** | SVG inline con `<path>` real: rect 64×64 rx=14 + dos barras verticales + polígono diagonal. Wordmark "DEPARTIFY" + tagline "Business Operating System". | **OFICIAL** |
| **Portal** | SVG inline con `<text font-family="Georgia,serif">D</text>` dentro de un rect lime rx=6. | **NO COINCIDE** con el patrón oficial |
| **Favicon Portal** | Mismo SVG `<text>D</text>` data URI | **NO COINCIDE** |
| **DNA** | (No inspeccionable, SPA) | — |
| **Footer Landing** | Una "mini-marca" de 4 cuadrantes (2×2 grid con accent/foreground) + wordmark "DEPARTIFY. Business Operating System" en serif | Distinto del header (variante footer) |

**Brecha:** El logo del Portal se ve diferente del logo de la Landing. El usuario va a notar el cambio visual cuando pase de `departify.app` → `app.departify.app`.

**Acción (Portal, modificable):**
- Reemplazar el SVG `<text>D</text>` por el path real (`<rect>` + dos barras + `<polygon>`).
- Usar la misma forma en Topbar, Sidebar, favicon y `index.html`.
- Footer del Portal debe usar la variante "footer" (4 cuadrantes) si vamos a añadir footer, o al menos el wordmark "DEPARTIFY · Business Operating System" en serif.

### 3.2 Favicon (P0)

| Punto | Favicon |
|---|---|
| Landing | `/favicon.svg` — rect 32×32 rx=7 fondo `#101214` + barras blancas. (Title dice "Nexus", bug.) |
| Portal (producción) | SVG data URI en `index.html` — rect lime + `<text>D</text>` |

**Brecha:** Diferente paleta y diferente patrón.

**Acción:** el favicon del Portal pasa al patrón oficial (fondo dark, foreground lime/white). Background `#101214` (igual que landing), foreground `#d8ff62` (lime accent DEPARTIFY).

### 3.3 Tipografía (P1)

| Punto | Sans | Display | Mono |
|---|---|---|---|
| Landing | Inter (via rsms.me) | Fraunces (Google Fonts) | font-mono (probablemente Geist Mono o sistema) |
| Portal | Inter (via rsms.me) + Geist fallback | Fraunces (Google Fonts) | JetBrains Mono (Google Fonts) |

**Coincidencia:** ✅ Mismo stack. El Portal ya consume `rsms.me/inter/inter.css` y `Google Fonts Fraunces` (ver `index.html`).

### 3.4 Paleta (P1)

| Color | Landing (clases Tailwind v4 detectadas) | Portal (`tokens.css`) | Coincide |
|---|---|---|---|
| Background | `var(--background)` `#080908` | `--background: #080908` | ✅ |
| Surface | `#0c0e0a`, `#101210`, `#1b1f1b` | `--background-elevated: #101210`, `--surface: #151815`, `--surface-soft: #1b1f1b` | ⚠️ Variantes distintas pero dentro de la misma familia oscura |
| Foreground | `#f2f0e9` | `--foreground: #f2f0e9` | ✅ |
| Muted | `#c2c4bc`, `#989b94` | `--muted-foreground: #c2c4bc`, `--muted: #989b94` | ✅ |
| Accent (lime) | `#d8ff62` | `--accent: #d8ff62` | ✅ |
| Accent fg | `#0a0c08` | `--accent-foreground: #0a0c08` | ✅ |
| Accent soft | `rgba(216, 255, 98, 0.14)` | `--accent-soft: rgba(216, 255, 98, 0.14)` | ✅ |
| Success | `var(--success)` (verde) | `--success: #7ce5a3` | ✅ |
| Danger | `var(--danger)` (rosa) | `--danger: #ff6961` | ✅ |
| Warning | `var(--warning)` (ámbar) | `--warning: #ffbd59` | ✅ |

**Conclusión:** La paleta base coincide perfectamente. **No se requiere cambio de tokens**.

### 3.5 Spacing y containers (P1)

| Punto | Container | Section padding |
|---|---|---|
| Landing | `max-w-[1320px]`, `px-5 sm:px-8` | `py-24 sm:py-32` |
| Portal | `max-w-7xl` (= 1280px), `p-4 md:p-6 lg:p-8` (en páginas) | Sin `<Section>` aplicado de momento |

**Brecha menor:** El Portal usa `max-w-7xl` (1280px) en páginas internas. La Landing usa `max-w-[1320px]`. Diferencia de 40px apenas visible. Decisión: **no migrar** — `max-w-7xl` es estándar y suficiente.

### 3.6 Header / navegación (P0)

| Punto | Header | Nav items |
|---|---|---|
| **Landing** | Logo + nav comercial + Acceder (ghost) + Crear mi equipo (primary) | Departamentos · Cómo funciona · Seguridad · Precios · Recursos |
| **Portal** | Logo + search trigger (⌘K) + theme toggle + notifications + user menu | SaaS interno (Sidebar separada) |

**Brecha:** La Landing tiene un menú comercial horizontal. El Portal tiene un Topbar minimalista (search + theme + notif + avatar) y Sidebar con nav SaaS.

**Análisis:** Esto es correcto y NO se debe unificar:
- La Landing es comercial → debe mostrar Departamentos/Precios/Recursos.
- El Portal es SaaS autenticado → no debe mostrar el menú comercial encima (rompe la inmersión).
- Lo que SÍ se unifica es: el **logo**, la **altura del Topbar** (14 = 56px en Portal; en Landing el header es ~64px — diferencia de 8px), el **botón "Acceder"** que en la Landing apunta a `/acceso` (interno) y debería apuntar a `https://app.departify.app/login` (pero no podemos tocar la Landing).

**Acción (Portal):**
- El Topbar ya tiene el `<Logo>` integrado con link a `departify.app`. ✅
- La altura `h-14` (56px) está OK; en la Landing es similar. No se cambia.
- La Sidebar tiene el `<Logo>` integrado con link a `departify.app`. ✅
- **No tocar la estructura** — solo asegurar que ambos Logos rendericen idénticos.

### 3.7 Footer (P1)

| Punto | Footer |
|---|---|
| **Landing** | Sí existe: wordmark + descripción + CTAs + grid 3-col (Producto · Empresa · Legal) |
| **Portal** | No existe footer dedicado (solo el indicador de salud "Gateway connected" en la Sidebar) |

**Brecha:** El Portal no tiene footer. La Landing sí. Para el usuario que viene de la Landing, el Portal "termina" sin cierre de marca.

**Decisión (Portal):** **Añadir footer mínimo global** en `ShellLayout`:
- Wordmark "DEPARTIFY · Business Operating System"
- Año dinámico
- Link "Volver a departify.app"
- Sin CTAs comerciales (Portal autenticado ≠ Landing comercial)

### 3.8 Motion (P2)

| Punto | Easing |
|---|---|
| Landing | `cubic-bezier(0.32, 0.72, 0, 1)` smooth, `cubic-bezier(0.34, 1.56, 0.64, 1)` spring |
| Portal | `ease-smooth: cubic-bezier(0.32, 0.72, 0, 1)`, `ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)` |

**Coincidencia:** ✅ Easing idéntico. Ya consolidado en `src/design-system/motion.ts` y en `tokens.css`.

### 3.9 Iconografía (P2)

| Punto | Set |
|---|---|
| Landing | Lucide-react |
| Portal | Lucide-react |

**Coincidencia:** ✅ Mismo set. Sin acción.

### 3.10 Copy (P1)

| Punto | Idioma | Longitud headlines |
|---|---|---|
| Landing | Español (es-ES) | Medias ("DEPARTIFY. Business Operating System") |
| Portal | Español + inglés hardcoded en muchas pantallas | Variables |

**Brecha:** El Portal tiene copy mezclado. **Esto ya fue auditado en el informe anterior** (72 incidencias). Para esta fase de unificación **no se traducen** strings — la Fase 2 del usuario ya está planeada como "traducción completa al español" posterior. Solo se asegura que el copy de marca visible esté en español:
- `<title>` ✅ "DEPARTIFY — Business Operating System"
- `<meta description>` ⚠️ inglés ("your Business Operating System for AI departments")
- OG title/description: ⚠️ faltan
- Canonical: ⚠️ falta

### 3.11 CTA y enlaces cruzados (P0)

| Punto | CTA Login | CTA Register | Volver |
|---|---|---|---|
| Landing | `/acceso` (interno) | `/registro` (interno) | n/a |
| Portal | `/login` (interno) | `/register` → `/login?mode=signup` | Logo → `https://departify.app` |

**Brecha:** Las CTAs de la Landing no apuntan al Portal. Es un problema **de la Landing** que no podemos arreglar desde aquí.

**Acción (Portal):**
- Confirmar que `/login` y `/register` siguen siendo las rutas oficiales tras la integración. ✅ (ya están)
- Confirmar que el logo del Portal apunta a `departify.app`. ✅ (ya está)
- **No modificar el portal** para forzar redirección desde las rutas de la Landing — fuera de scope.

---

## 4. Diferencias — clasificación

### 🔴 P0 (deben resolverse en esta fase)

| # | Punto | Diferencia | Acción |
|---|---|---|---|
| **U-01** | Logo (Portal) | SVG `<text>D</text>` no coincide con el path real de la Landing | Sustituir por el SVG con rect + barras + polígono |
| **U-02** | Favicon (Portal) | Diferente paleta y patrón | Usar mismo path con colores invertidos (dark bg + lime fg) |
| **U-03** | `index.html` description | Copy en inglés | Reescribir en español |
| **U-04** | `index.html` meta tags | Faltan `og:*`, `twitter:*`, `canonical`, `robots` | Añadir set completo apuntando a `app.departify.app` |
| **U-05** | `index.html` title | "DEPARTIFY — Business Operating System" OK, pero sin `og:title` separado | Añadir `og:title` y `og:description` |

### 🟡 P1 (importantes pero no bloqueantes)

| # | Punto | Diferencia | Acción |
|---|---|---|---|
| U-06 | Footer (Portal) | No existe footer | Añadir footer mínimo global en `ShellLayout` |
| U-07 | Logo sizing (Portal) | 28px en Topbar/Sidebar, no responsive | Aceptable, sin acción |
| U-08 | Navigation commercial en Portal | La Landing tiene menú comercial, el Portal no | Correcto, sin acción — el Portal es SaaS autenticado |

### 🟢 P2 (observaciones, no bloqueantes)

| # | Punto | Diferencia | Acción |
|---|---|---|---|
| U-09 | Container max-width | 1280px vs 1320px | Sin acción — apenas visible |
| U-10 | Surface variants | Tokens tienen más niveles que la Landing | Sin acción — el Portal necesita más granularidad para densidad SaaS |
| U-11 | `navItems.badge` no se renderiza en Sidebar | Prop huérfana | Documentado en audit previo |
| U-12 | Copy hardcoded en inglés | Pendiente de traducción Fase 2 | Documentado en audit previo |
| U-13 | Landing tiene bugs propios (canonical, og:url, favicon title) | `<link>` a dominio antiguo | NO se toca — fuera de scope |
| U-14 | DNA no auditable (SPA + sin HTML público) | n/a | Documentado |
| U-15 | API `api.departify.app` no responde | DNS no resuelve | Documentado, no es responsabilidad del portal |

---

## 5. Plan de unificación (acciones a aplicar)

### Fase 2-3: Logo, Favicon, Branding consistency

**A. Sustituir el SVG del Logo** (`src/components/Logo.tsx`):

Cambiar de `<text>D</text>` (Georgia) al patrón oficial de la Landing:
```svg
<rect width="64" height="64" rx="14" fill="currentColor"/>
<g fill="var(--background, #080908)">
  <rect x="15" y="14" width="6" height="36"/>
  <rect x="43" y="14" width="6" height="36"/>
  <polygon points="15,14 21,14 49,50 43,50"/>
</g>
```

A escala 32×32 con `rx=7` para compact (Topbar, Sidebar) y mantener el mismo path. Para el favicon, invertir colores (fondo `#101214`, foreground `#d8ff62`).

**B. Favicon del index.html**:

Reemplazar el data URI por el SVG path real con paleta invertida. Mantener `image/svg+xml` para que NO se pida `/favicon.ico` por separado.

### Fase 4: Meta tags y URLs

**C. `index.html`: añadir meta tags completos** apuntando a `https://app.departify.app`:

- `<title>` → ya está bien, OK.
- `<meta name="description">` → español.
- `<meta name="robots" content="index, follow">` → añadir.
- `<link rel="canonical" href="https://app.departify.app/">` → añadir.
- Open Graph: `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:locale`, `og:image`.
- Twitter Card: `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`.

**D. `vite.config.ts`**: añadir `<link rel="preconnect">` no necesario, ya cubierto.

**E. `package.json`**: ya está en `opencloud-client` (nombre interno, no afecta al usuario).

### Fase 5: Diferencias visuales residuales

**F. Footer mínimo global** (`ShellLayout.tsx`):

Añadir `<footer>` debajo de `<main>` con:
- Wordmark "DEPARTIFY · Business Operating System" (variant serif, igual que el header).
- Año dinámico.
- Link "Volver a departify.app".
- Sin grid de columnas (no es comercial).

**G. Verificar Logo en todos los sitios críticos**:

- Topbar ✅ (commit `475f8e4`)
- Sidebar ✅ (commit `475f8e4`)
- Login — pendiente (B-01 del audit previo)
- Onboarding — pendiente (B-02 del audit previo)
- Favicon — pendiente (U-02)
- Footer nuevo — pendiente (F)

---

## 6. Lista de cambios aplicados (post-implementación)

> Esta sección se actualiza tras aplicar los commits.

_(se completa al final)_

---

## 7. Referencias eliminadas

> Se actualiza tras `grep` final.

_(se completa al final)_

---

## 8. Confirmación final

> Se actualiza tras typecheck/test/build verde y push a main.

_(se completa al final)_
