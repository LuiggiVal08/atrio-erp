# Implementation Plan: Frontend UI — Interfaz de Alta Densidad ODALX Atrio

**Branch**: `feat/frontend-ui` | **Date**: 2026-07-01 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-b-frontend/spec.md`

## Summary

Single-page application de alta densidad para el ERP modular ODALX Atrio bajo el paradigma "Todo es un documento con estados". Layout global (sidebar 240px + header + canvas con scroll interno), representación visual de máquina de estados finitos (FSM) mediante badges interactivos, grillas virtualizadas para +10k registros, módulo POS con atajos de teclado y operación offline (IndexedDB), y sistema multi-tema (Premium Dark / Nordic Light / Obsidian Emerald). Construido con React 19 + Vite 6 + Tailwind CSS v4 + HeroUI/Sileo/Lucide/Recharts.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19

**Primary Dependencies**: Vite 6 (build/bundling), Tailwind CSS v4 (estilos), HeroUI (UI Kit), Sileo (notificaciones), Lucide React (iconos), Recharts (gráficos), TanStack Query v5 (estado servidor), Zustand 5 (estado UI), `@tanstack/react-virtual` (virtualización), `react-phone-number-input` + `libphonenumber-js` (teléfonos)

**Storage**: IndexedDB (offline POS), API REST (datos persistentes vía backend NestJS/Prisma/PostgreSQL 16)

**Testing**: Vitest (unit), Playwright (E2E)

**Target Platform**: Web (Chrome/Firefox/Edge modernos), Nginx como proxy inverso

**Project Type**: SPA web app (frontend de ERP modular)

**Performance Goals**: Grillas virtualizadas +10k registros sin degradación, transacciones POS <3s, navegación entre módulos <1s

**Constraints**: <200ms p95 para navegación, operación offline POS sin pérdida de datos, scroll interno independiente preservando headers fijos, sidebar dinámica por permisos de tenant

**Scale/Scope**: 7 módulos (Inventory, Sales/POS, Purchasing, Cash, CRM, Localization, HR), ~50 pantallas, multi-tenant SaaS

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Status |
|-----------|-----------|--------|
| I. Domain-Driven Modules & Plug-in Architecture | Frontend feature modules (`src/modules/{inventory,sales,purchases,cash}/`) mirror backend domain modules. Sidebar loads dynamically by tenant permissions. | ✅ PASS |
| II. Document-Driven State, Immutability & Event Impact | FSM visualization via badges/timelines reflects backend state transitions. Optimistic updates with rollback. No structural violations. | ✅ PASS |
| III. Test-First & Data Integrity | Vitest for unit, Playwright for E2E. TDD required per Constitution. | ✅ PASS |
| IV. Localization & Multi-Currency Engine | Localization module handles IGTF/IVA rules. Multi-currency display through exchange rate service. i18n with ES/EN key-based translations. | ✅ PASS |
| V. Multi-Tenant Isolation & Local Infrastructure | All API calls scoped by tenant context. Sidebar modules filtered by tenant provisioning. | ✅ PASS |
| VI. Internationalization (i18n) — Multi-Language from Day One | Translation files (ES/EN) in `src/core/i18n/`. Key-based system, no hardcoded strings. | ✅ PASS |
| UI/UX Design Token Standardization | Premium Dark as default theme via CSS variables. Nordic Light and Obsidian Emerald as alternatives. | ✅ PASS |
| Security & Compliance | RBAC enforced at route level via dynamic loading. `data-theme` segregation, no data leakage. | ✅ PASS |

**GATE RESULT**: PASS — All principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/004-b-frontend/
├── plan.md              # This file (/speckit.plan command output)
├── spec.md              # Feature specification
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/
│   └── integration-spec.md  # Phase 1 output (HeroUI/Sileo/Recharts integration contract)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
apps/web/
├── src/
│   ├── core/
│   │   ├── components/        # UI Kit Atómico (Inputs, Tables, Modals)
│   │   ├── hooks/             # useAuth, useTenant, useDocumentState, etc.
│   │   ├── store/             # Zustand global (Theme state, Sidebar)
│   │   ├── services/          # Toast service, API client
│   │   ├── i18n/              # Translation files (ES/EN)
│   │   └── styles/            # themes.css, base design tokens
│   ├── modules/
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── store/
│   │   │   ├── views/
│   │   │   └── index.ts
│   │   ├── sales/
│   │   ├── purchases/
│   │   └── cash/
│   ├── routes/                 # Dynamic router by tenant permissions
│   ├── App.tsx                 # Providers: Theme, QueryClient, Toaster
│   └── main.tsx                # Bootstrapper
├── tests/
│   ├── unit/
│   └── e2e/                    # Playwright
├── Dockerfile
├── nginx.conf
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

**Structure Decision**: Feature-based modules inside `src/modules/*/` with shared Core UI Kit in `src/core/`. Routes loaded dynamically based on tenant permission matrix. This mirrors the hexagonal backend architecture at the frontend level.

## Complexity Tracking

*Intentionally empty — Constitution Check passed without violations.*

## Design Decisions (from Clarify Session)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| POS offline stock conflict | Last-write-wins | Server accepts latest timestamp; stock puede ir a negativo, se reconcilia manualmente vía ajuste de inventario |
| Locale selection | Browser `navigator.language` + tenant override | Detecta idioma del navegador al primer ingreso, tenant puede sobreescribir, persiste por usuario |
| Timeline data source | Incrustado en payload del documento (`document.timeline[]`) | Un solo request, timeline es inmutable, TanStack Query lo cachea automáticamente |
