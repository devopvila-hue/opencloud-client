# BUSINESS BRAIN INITIALIZATION — EXPERIENCE DESIGN

> Codename: EL PRIMER WOW
> Repo: `/tmp/opencloud-client`
> Status: Documento de diseño. **Sin código aún.** Validación Founder antes de implementar.

---

## 1. Filosofía

**Apple vende tranquilidad. Departify vende criterio.**

El usuario nunca debe sentir que está rellenando formularios.
Debe sentir que alguien está comprendiendo su empresa.

El Business Brain no es un asistente obediente.
Es un Director General Digital con criterio.

Si el empresario propone algo poco lógico:
NO decir siempre que sí.

"Podemos hacerlo.
Pero si fuera mi empresa empezaría por otro sitio.
Mi recomendación es resolver primero este problema.
La decisión final siempre es tuya."

---

## 2. Modelo de datos del Business Brain

### 2.1 Persistencia (lo que ya existe)

`Company` (tabla existente) — fuente de verdad:
- Identidad: `name`, `brand`, `domain`, `country`, `language`
- Actividad: `sector`, `employees`, `description`, `services`, `products`, `clients`
- Posicionamiento: `value_proposition`, `mission`, `vision`, `values`
- Dirección: `goals`
- Contacto: `phone`, `email`, `address`, `social_networks`
- Onboarding: `onboarding_status`, `onboarding_completed_at`

### 2.2 Lo que añadimos (estado del Brain, derivado)

```
BrainSnapshot (frontend-only, no persistir todavía)
├── company: Identidad detectada
├── market: Sector + competidores + tamaño de mercado
├── processes: Procesos internos mencionados
├── tools: Herramientas stack (Google Workspace, HubSpot, etc.)
├── objectives: Objetivos del trimestre
├── priorities: Qué departamento le preocupa más
├── painPoints: Tareas que odia / procesos repetitivos
├── signals: Marcas de progreso (barras) — NUNCA porcentajes falsos
└── recommendedDepartments: Lista priorizada con justificación
```

`signals` se deriva de la conversación, no de un % inventado:
- **Empresa** — completa cuando: nombre + web + país + empleados
- **Mercado** — completa cuando: sector detectado + al menos 1 competidor/cliente
- **Procesos** — completa cuando: ≥ 1 proceso descrito
- **Herramientas** — completa cuando: ≥ 1 herramienta confirmada
- **Objetivos** — completa cuando: ≥ 1 objetivo del trimestre
- **Prioridades** — completa cuando: ≥ 1 prioridad explícita

El bloque visual muestra barras que se "llenan" cuando el cerebro tiene datos para esa dimensión. **Nunca números falsos**, solo estados: vacío / parcial / completo.

### 2.3 Recomendación de departamentos (con criterio)

El cerebro **NO recomienda todos los departamentos**. Recomienda 1-3 con justificación:

```
recommendation = {
  primary: { department, reason },        // máximo impacto
  secondary: { department, reason },      // complementario
  avoid: [{ department, reason }],        // NO empezar por aquí
  rationale: "Hoy invertiría toda mi energía en {primary}. {secondary} lo haría en cuanto {primary} esté rodado. {avoid} me parece prematuro porque {motivo}."
}
```

Reglas de priorización:
- **Si dolor de tiempo** explícito → departamento que más tiempo recupera (ej. Marketing, Operaciones).
- **Si objetivo es captar clientes** → Growth + Marketing coordinados.
- **Si objetivo es escala/calidad** → Operaciones + Analytics.
- **Si todo está verde** → recomienda empezar por el que tiene ROI medible en <30 días.
- **NUNCA** recomienda 5+ departamentos a la vez (eso destruye la confianza).

---

## 3. Flujo completo (6 fases)

### FASE 1 — Bienvenida
**Objetivo:** Recoger lo mínimo para empezar a pensar.
**Duración objetivo:** < 30 segundos.

Pantalla única. Tono cercano.

**Campos (4, todos requeridos):**
1. Nombre de la empresa
2. Página web (URL completa)
3. País (selector con banderas + búsqueda)
4. Número aproximado de empleados (5 botones: 1 / 2-10 / 11-50 / 51-200 / 200+)

**Lo que NO hay:**
- ❌ Sector (lo detectamos nosotros)
- ❌ Sector dropdown de 10 opciones
- ❌ Objetivo principal (lo hablamos después)
- ❌ Logo / colores / branding técnico

**CTA:** "Continuar" (no "Enviar", no "Guardar").

**Tras pulsar Continuar:**
- POST `/api/v1/companies` con `{ name, domain, country, employees, onboarding_status: 'in_progress' }`
- Navega a Fase 2 SIN mostrar loading bloqueante (cambio de ruta animado, 400 ms).

---

### FASE 2 — Análisis en vivo (la magia)
**Objetivo:** El cerebro analiza la web pública de la empresa mientras el usuario ve.
**Duración objetivo:** 8-15 segundos percibidos.

Pantalla completa con fondo animado sutil. NO es un spinner. Es **un proceso visible**.

**Layout:**
```
┌────────────────────────────────────────────┐
│                                            │
│  Conociendo tu empresa...                  │
│                                            │
│  ┌─ Inteligencia ─────────────────────┐    │
│  │ ✓ Analizando tu web                │    │
│  │ ✓ Detectando tu sector             │    │
│  │ ✓ Entendiendo qué vendes           │    │
│  │ ✓ Identificando tu propuesta       │    │
│  │ ✓ Buscando presencia digital       │    │
│  │ ✓ Preparando tu Business Brain     │    │
│  └────────────────────────────────────┘    │
│                                            │
│  Mientras tanto, tu Business Brain se      │
│  construye en silencio.                    │
│                                            │
│  [animación sutil: orbe que gira +         │
│   palabras que aparecen letra a letra]     │
│                                            │
└────────────────────────────────────────────┘
```

**Cada línea se activa con un ✓ cuando su sub-tarea termina.**
Duración realista: 1-2 s entre líneas. Última línea se queda visible 2-3 s para que no parezca que la pantalla "salta" a Fase 3.

**Backend (lo que el cerebro hace mientras):**
1. Fetch del HTML del dominio + análisis del title, meta description, H1/H2.
2. Lookup en una tabla de patrones sectoriales (palabras clave → sector).
3. Extracción de servicios/productos de los textos de la home.
4. Detección de propuesta de valor (primer párrafo > 200 caracteres).
5. Lookup de presencia digital (LinkedIn company, Twitter/X, etc. si los encuentra en el HTML o robots.txt).
6. Construcción inicial del BrainSnapshot.

**Realismo:** si el fetch falla (dominio caído, sin DNS), el cerebro sigue con análisis heurístico + marca un "?" en lugar de "✓" en la línea correspondiente y **lo explica al final**.

**Si tarda más de 15 s**, una línea adicional aparece: "Esto está tardando más de lo habitual. Dame un momento más." (humaniza el tiempo, no ansiedad).

---

### FASE 3 — Conversación (lo más importante)
**Objetivo:** Que el cerebro piense como el empresario. NO encuesta. Conversación.

**Pantalla:** Chat con un único interlocutor a la izquierda ("Business Brain"). El usuario escribe abajo.

**Apertura (escrita por el cerebro, no por el sistema):**

> He aprendido bastante sobre tu empresa.
> Pero todavía necesito pensar como tú.
> No quiero adivinar.
> Quiero comprender cómo tomas decisiones.

**Preguntas — máximo 6, una por turno (NO 20), en este orden:**

1. **"¿Qué tarea te roba más tiempo cada semana?"**
   → captura painPoints[0]
   → el cerebro reformula su hipótesis en tiempo real

2. **"¿Qué proceso odias hacer y harías que otro hiciese por ti?"**
   → captura painPoints[1] + signals.processes++

3. **"¿Qué herramienta utilizáis para trabajar a diario?"**
   → opciones: Google Workspace / Microsoft 365 / Otro
   → captura tools.primary
   → **Si "Otro"**: "¿Cuál?" (texto libre, sin fricción)

4. **"¿Qué objetivo quieres conseguir este trimestre?"**
   → texto libre (el empresario habla como quiera)
   → captura objectives[0]
   → **El cerebro extrae palabras clave** y reformula: "Entiendo. ¿Quieres decir captar 30 clientes o facturar X?"

5. **"¿Qué departamento te preocupa más ahora mismo?"**
   → captura priorities[0]

6. **"¿Qué significa para ti que este proyecto sea un éxito?"**
   → captura successDefinition (no se persiste, se usa para afinar la recomendación final)

**Reglas críticas:**
- UNA pregunta por turno. NUNCA lista.
- Si el empresario se sale del tema, el cerebro sigue su hilo (no le obliga a volver).
- Cada respuesta debe **mejorar el Brain visible** (panel lateral que se actualiza).
- Si el empresario responde "no sé", el cerebro ofrece un ejemplo concreto para aterrizar: "Por ejemplo: ¿cerrar 10 ventas más al mes? ¿dejar de actualizar el Excel de inventarios?"
- El botón "Saltar" siempre está disponible para preguntas opcionales (5 y 6).
- **Máximo absoluto:** 8 turnos (incluyendo reformulaciones). El empresario debe sentir avance, no examen.

**Panel lateral (visible durante toda la Fase 3):**
```
Construyendo tu Business Brain

Empresa    ████████  (completa)
Mercado    ██████    (detectado)
Procesos   ████      (parcial)
Herramientas ██      (detectado)
Objetivos  ████      (en curso)
Prioridades ██      (parcial)
```

Las barras se **llenan** cuando el cerebro tiene datos suficientes para esa dimensión. **Nunca porcentajes literales** — son barras conceptuales que comunican progreso.

---

### FASE 4 — Integraciones (con justificación, no por pedir)
**Objetivo:** Que el empresario entienda QUÉ valor aporta cada conexión.

**Apertura del cerebro:**

> Para ayudarte mejor necesito conocer cómo trabaja tu empresa.
> No te voy a pedir que conectes nada por conectar.
> Cada conexión debe aportarte algo claro.

**Lista de integraciones mostradas — máximo 4-5 relevantes según sector detectado:**

```
Google Workspace        → entender tus documentos
SharePoint              → comprender procesos internos
HubSpot                 → conocer a tus clientes
Slack                   → detectar bloqueos del equipo
Microsoft 365           → conectar tu correo y calendario
```

**Cada tarjeta tiene:**
- Icono
- Título
- Beneficio en UNA línea (no "funcionalidades técnicas")
- Estado: Conectado / Pendiente / No me interesa

**Regla:** el botón "Continuar al chat" **no requiere tener conexiones activas**. El empresario puede entrar al chat con 0 conexiones. El cerebro será explícito: "Empezaremos con lo que ya sé de ti. Las conexiones las añadiremos cuando las necesitemos."

---

### FASE 5 — Diagnóstico (la propuesta con criterio)
**Objetivo:** El cerebro muestra su primera propuesta. **NO recomienda todos los departamentos.**

**Pantalla:**

```
He terminado.

Ya conozco bastante bien tu empresa.
Ya conozco tus procesos.
Ya conozco las herramientas con las que trabajáis.
Ya conozco vuestros objetivos.

Ahora puedo ayudarte con criterio.

He encontrado varias oportunidades. Te las priorizo:

┌─────────────────────────────────────────────────┐
│ 1. Marketing                                    │
│    Creo que aquí puedes recuperar más tiempo.   │
│    Tu plan actual parece disperso.              │
│                                                  │
│ 2. Growth                                       │
│    Detecto margen importante.                    │
│    Tu sector tiene oportunidades de canal.      │
│                                                  │
│ 3. Operaciones                                  │
│    Hay procesos repetitivos que se pueden        │
│    automatizar.                                   │
└─────────────────────────────────────────────────┘

(NO recomiendo activar Finanzas ni RR.HH. todavía —
 porque hoy bloquearían tu atención sin retorno medible.)

La decisión final siempre es tuya.
```

**Botones:** "Empezar por Marketing" / "Hablar con el Director General primero" / "Cambiar la recomendación".

**Tono:** respetuoso, directo, **nunca dice "te equivocas"**. Si el empresario insiste en activar RR.HH., el cerebro responde: "De acuerdo. Lo preparamos. Empezaré por entender cómo gestionas hoy las altas y bajas."

---

### FASE 6 — WOW (primer mensaje del chat principal)
**Objetivo:** El primer mensaje del chat principal demuestra que el cerebro ya sabe.

**Mensaje (escrito por el cerebro, no por la app):**

```
Buenos días.

He terminado la primera versión de tu Business Brain.

Ya conozco:
✓ Tu empresa
✓ Tu mercado
✓ Tus procesos
✓ Tus herramientas
✓ Tus objetivos

Además, mientras analizaba tu empresa he detectado varios
puntos que merecen atención.

Hoy te propondría empezar por Marketing y Growth.

Creo que es donde puedes recuperar más tiempo y generar
más impacto.

También he detectado que todavía no hemos conectado
Google Workspace. Eso me impedirá entender parte de vuestra
documentación interna.

Mi recomendación sería:
1. Conectar Google Workspace.
2. Activar Marketing.
3. Activar Growth.

Por supuesto, la decisión final es tuya.

¿Con cuál quieres que empecemos?
```

**Este mensaje es el momento WOW.** No debe parecer un chatbot. Debe parecer el nuevo Director General Digital.

---

## 4. Estados visuales (loading, error, éxito)

### 4.1 Loading en Fase 2
- Animación: orbe central + palabras que aparecen letra a letra.
- Líneas que se completan: ✓ con sonido sutil (opcional, off por defecto).
- Sin spinners bloqueantes.
- Sin progress bars con %.

### 4.2 Error en análisis web (Fase 2)
- Si el fetch de la web falla: la línea "Analizando tu web" muestra "?" y el cerebro explica: "No he podido leer tu web (puede que esté caída o detrás de un login). Seguiré con lo que tengo."
- El proceso continúa. La Fase 3 arranca igualmente.

### 4.3 Error en chat (Fase 3)
- Si el LLM tarda >8 s: aparece "Estoy pensando…" en el input box. No spinner.
- Si falla: "Mi conexión falló un momento. ¿Puedes repetir tu respuesta?" — sin alarmar.

### 4.4 Éxito
- Fase 6: pequeña animación de "Bienvenido al panel" (fade + slide).
- Toast sutil: "Tu Business Brain está listo".

---

## 5. Modelo de interacción

### 5.1 Roles
- **Usuario** = empresario (CEO, fundador, gerente).
- **Interlocutor** = Business Brain (representado por un único avatar "Atlas" o nombre interno).
- **Sistema** = invisible (no habla, no aparece en copy).

### 5.2 Lenguaje del Brain
- Primera persona: "He aprendido", "Creo que", "Mi recomendación".
- Tono: Director General de confianza. Directo pero respetuoso.
- **Nunca** dice: "como modelo de lenguaje", "como IA", "puedo equivocarme", "estoy aquí para ayudarte".
- **Siempre** justifica: "Porque X desbloqueará Y".

### 5.3 Lo que el Brain NO hace
- No pregunta por curiosidad.
- No pregunta lo que ya sabe.
- No repite preguntas.
- No dice "gracias" (no es un chatbot).
- No dice "perfecto" (no es coach de vida).
- No dice "entendido" sin reformular.

### 5.4 Lo que el Brain SÍ hace
- Reformula lo que entendió: "Entiendo. ¿Quieres decir que…?"
- Aterriza ideas vagas con ejemplos: "¿Te refieres a algo como…?"
- Tiene criterio: "Si fuera mi empresa…"
- Acepta la decisión del empresario siempre.

---

## 6. Responsive (mobile-first)

| Vista | Layout |
|---|---|
| **Mobile (<640px)** | 1 columna. Inputs full-width. Panel lateral del Brain se colapsa a un botón flotante que abre bottom-sheet. Chat full-screen. |
| **Tablet (640-1024px)** | 2 columnas ligeras. Brain panel arriba del chat (no al lado). |
| **Desktop (>1024px)** | Chat 60% + Brain panel 40%. Side-by-side. |

---

## 7. Accesibilidad

- WCAG 2.2 AA mínimo.
- Focus visible en todos los inputs.
- Chat soporta teclado (Enter envía, Shift+Enter salto de línea).
- Panel del Brain anuncia cambios con `aria-live="polite"`.
- Contraste mínimo 4.5:1 en texto.
- Sin animaciones > 5 s sin `prefers-reduced-motion`.

---

## 8. Métricas de éxito

Si la experiencia está bien diseñada, veremos:

1. **Time-to-Fase 3 < 60 s** para ≥ 80% de usuarios.
2. **Abandono entre Fase 1 → Fase 3 < 15%** (vs 35% formulario tradicional).
3. **≥ 70% de empresarios llegan a Fase 6** (vs 45% onboarding clásico).
4. **Mensaje "no sé" en preguntas < 10%** (el cerebro aterriza bien).
5. **NPS post-Fase 6 > 40** (medido al final del primer chat).
6. **≥ 60% de usuarios activan al menos 1 departamento recomendado** en los primeros 7 días.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Fetch de web falla | Cerebro sigue con análisis heurístico + explica el "?" |
| Chat se alarga > 8 turnos | Cap duro en 8 turnos + botón "Saltar" en preguntas 5-6 |
| Empresario se sale del tema | El cerebro sigue su hilo (no le obliga a volver) |
| Sector no detectado | El cerebro pregunta al final del chat: "Una cosa más: ¿a qué se dedica tu empresa?" |
| Empresario recomienda 5 departamentos | El cerebro puede reducir a 3 con justificación, aceptando la decisión final |
| Análisis tarda > 15 s | Línea adicional "Esto está tardando más de lo habitual. Dame un momento más." |
| Usuario en mobile no ve el panel del Brain | Bottom-sheet flotante |
| Usuario abandona antes de Fase 6 | Persistir snapshot en `localStorage` para retomar donde lo dejó |

---

## 10. Lo que NO construyo en este sprint

- ❌ Backend de análisis web real (heurística stub por ahora; integración con servicio externo en sprint siguiente).
- ❌ Multi-idioma (ES solamente en esta V1).
- ❌ Persistencia del BrainSnapshot en backend (localStorage en V1).
- ❌ Reanálisis continuo (solo se ejecuta una vez al finalizar Fase 1).
- ❌ Editor visual del Brain (read-only en V1).

---

## 11. Validación Founder

**¿Este flujo hace que un empresario piense: "Por fin alguien entiende realmente mi negocio"?**

- **Fase 1** es 4 campos (< 30 s) → no es formulario pesado. ✅
- **Fase 2** muestra que el cerebro TRABAJA → demuestra inteligencia. ✅
- **Fase 3** es conversación, no encuesta → genera confianza. ✅
- **Panel lateral** evoluciona visiblemente → el empresario ve progreso. ✅
- **Fase 5** dice "NO recomiendo Finanzas ni RR.HH." → demuestra criterio. ✅
- **Fase 6** abre el chat con un mensaje que YA sabe → momento WOW real. ✅

**Conclusión:** SÍ. El flujo está diseñado para generar ese momento.

---

## Próximo paso

Si este diseño se aprueba, implementaré en `/tmp/opencloud-client`:
1. Refactor de `OnboardingPage.tsx` → `BusinessBrainInit/` con 6 sub-pantallas.
2. `BrainSnapshot` context (React Context + localStorage).
3. `ChatPage.tsx` actualizado para arrancar con el mensaje WOW cuando `onboarding_status === 'completed' && brain_exists`.
4. i18n keys nuevas (es-ES).
5. Validación Playwright del recorrido completo.

**Sin tocar:**
- Branding (logo, SVG, wordmark).
- Sistema de diseño (tokens, colores, tipografías).
- Backend API existente.
- Portal /admin.