# OPENCloud Client Portal — Business Operating System

> **Business Operating System** for AI departments. A premium SaaS workspace where every customer coordinates their team of AI departments through a single Executive Director.

**Phase 7** — Migrated to a standalone repository, restyled with the DEPT.IA visual language, and repositioned as a Business Operating System. Ready for Netlify deployment.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 6 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Data | TanStack Query 5 |
| Motion | Framer Motion (spring + smooth easing) |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Testing | Vitest + Testing Library + jsdom |
| Deployment | Netlify |

## Design System

Adopted from the DEPT.IA visual language:

- **Dark-first** theme (`#080908` → `#1b1f1b`) with light mode support
- **Lime accent** (`#d8ff62`) with near-black foreground
- **Fraunces** (display) + **Geist/Inter** (sans) + **JetBrains Mono** (mono)
- **Glassmorphism** panels with `backdrop-blur`
- **12-column grid** layouts with `Container` and `Section` primitives
- **Smooth + spring** easings (`cubic-bezier(0.32, 0.72, 0, 1)` / `cubic-bezier(0.34, 1.56, 0.64, 1)`)
- **Department-specific** accent colors (Revenue, Operations, People, Customer, Compliance, Governance)

## Positioning

| Old | New |
|---|---|
| AI Departments | Business Operating System |
| AI Agents | Department Apps |
| Department Manager | Department Director |

The **Executive Office** is the central hub. The **Executive Director** is the sole interface for business conversations — it delegates internally to department apps.

## Pages

### Core
- **Home** (`/`) — Dashboard with KPIs, activity feed, department health
- **Executive Office** (`/executive-office`) — Central hub: business health, executive summary, timeline, KPIs, activity, memory, pending approvals
- **Executive Room** (`/executive-room`) — Live multi-department view with orchestrations, bus messages, bottlenecks
- **Chat** (`/chat/:id`) — ChatGPT-style conversation with streaming SSE
- **Departments** (`/departments`) — Catalog of installed department apps
- **Department Detail** (`/departments/:id`) — Lifecycle, health, tasks, managers, config
- **Marketplace** (`/marketplace`) — Browse and install department apps
- **Agents** (`/agents`) — All AI workers across departments

### Library
- **Tasks** (`/tasks`) — Internal task queue with filtering
- **Results** (`/results`) — Library of completed outputs, memory files, documents
- **Documents** (`/documents`) — File uploads with base64 encoding
- **Timeline** (`/timeline`) — Chronological event stream
- **Orchestrations** (`/orchestrations/:id`) — Multi-department workflow detail

### Admin
- **Company** (`/company`) — Profile, branding, corporate memory
- **Analytics** (`/analytics`) — Usage and consumption metrics
- **Integrations** (`/integrations`) — External service connectors
- **Settings** (`/settings`) — Theme, language, notifications, security

## Getting Started

```bash
# Install dependencies
npm install

# Development server
npm run dev
# → http://localhost:5173

# The portal proxies /api/v1/* to the OPENCloud middleware
# In production on Netlify, configure your build environment
```

## Building for Production

```bash
npm run build
```

Output is in `dist/` — ready for Netlify:

```
dist/index.html                   1.12 kB │ gzip: 0.50 kB
dist/assets/index-*.css            8.28 kB │ gzip: 2.21 kB
dist/assets/index-*.js           459.88 kB │ gzip: 122.03 kB
...
```

## Testing

```bash
npm test          # run all tests
npm run typecheck # TypeScript strict check
```

**73/73 tests passing** across 16 test files.

## Deployment

### Netlify

1. Create a new site on Netlify
2. Connect the `devopvila-hue/opencloud-client` repository
3. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Add environment variables in Site Settings → Environment Variables
5. The `_redirects` file handles SPA fallback automatically

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| (none) | No | The portal uses same-origin cookies for auth. In production, `/api/*` is served by the middleware on the same domain. |

## Architecture

```
┌──────────────────────────────────────────┐
│  OPENCloud Client Portal (this repo)      │
│  React 19 · Vite 6 · Tailwind v4          │
│  ─ Presentation Layer ─                   │
│  • 22 pages (14 core + 8 library/admin)   │
│  • 17+ reusable components                │
│  • 5 hooks + utilities                    │
│  • Complete design system                 │
└───────────────────┬───────────────────────┘
                    │  Same-origin cookies
                    │  /api/v1/* (REST + SSE)
                    ▼
┌──────────────────────────────────────────┐
│  OPENCloud Middleware                      │
│  Fastify 5 · /api/v1/*                    │
│  • Auth, conversations SSE                │
│  • Department Core (lifecycle, tasks)      │
│  • Orchestration (Orchestrator, Bus)       │
│  • Executive Director routing              │
└──────────────┬────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│  OpenClaw Gateway + Supabase             │
│  127.0.0.1:18789 · db.supabase.co:5432   │
└──────────────────────────────────────────┘
```

## License

Private — OPENCloud Platform.
