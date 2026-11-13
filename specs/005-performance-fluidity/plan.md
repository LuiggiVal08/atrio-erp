# Implementation Plan: Performance & Fluidity — Carga de datos y percepción de velocidad

**Branch**: `feat/performance-fluidity` | **Date**: 2026-11-13 | **Spec**: N/A (plan derivado de sesión de diagnóstico)

**Input**: Diagnóstico de fluidez del frontend realizado el 2026-11-13 sobre `apps/web/`.

## Summary

Reducir la fricción percibida al navegar y cargar datos en el SPA. Hoy cada navegación paga **dos fases de espera** (descarga del chunk lazy del módulo → spinner, luego las queries de la vista → segundo spinner), los estados de carga son **spinners que reemplazan contenido** (saltos de layout), y el **dashboard dispara 5 requests en paralelo** cada uno con su propio pop-in. El plan ataca la percepción (skeletons con forma del layout final, datos previos conservados, animación de entrada de datos) y la arquitectura de carga (eliminar el espejo Zustand, consulta coordinada del dashboard, render e infra). No incluye prefetching.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19

**Primary Dependencies**: Vite 6, TanStack Query v5, Zustand 5, `@tanstack/react-virtual`, Recharts, framer-motion (ya presente)

**Storage**: N/A (frontend; API REST NestJS/Prisma)

**Testing**: Vitest (unit, Testing Library), Playwright (E2E)

**Target Platform**: Web (Chrome/Firefox/Edge), Nginx proxy inverso

**Project Type**: SPA web app

**Performance Goals**: navegación entre módulos <200ms p95; transacciones POS <3s; grillas +10k sin degradación

**Constraints**: sin cambios de arquitectura de módulos; sin nuevas dependencias de formularios; POS keyboard-first intacto

**Scale/Scope**: 7 módulos, ~50 pantallas, multi-tenant SaaS

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Assessment | Status |
|-----------|-----------|--------|
| I. Domain-Driven Modules & Plug-in Architecture | Cambios localizados en `core/` y hooks de módulos; sin alterar fronteras de dominio. | ✅ PASS |
| II. Document-Driven State, Immutability & Event Impact | No se tocan máquinas de estado ni documentos; solo capa de presentación/carga. | ✅ PASS |
| III. Test-First & Data Integrity | TDD: tests de hooks/componentes (skeletons, keepPreviousData, count-up) antes de implementar. | ✅ PASS |
| IV. Localization & Multi-Currency Engine | El count-up respeta `Intl.NumberFormat`/locale ya usado. | ✅ PASS |
| V. Multi-Tenant Isolation & Local Infrastructure | Query keys siguen scoping por tenant existente. | ✅ PASS |
| VI. Internationalization (i18n) | Skeletons y textos usan claves i18n existentes; no hay strings nuevos hardcodeados. | ✅ PASS |
| UI/UX Design Token Standardization | Skeletons/animaciones usan tokens de tema existentes. | ✅ PASS |

**GATE RESULT**: PASS — Sin violaciones.

## Project Structure

### Documentation (this feature)

```text
specs/005-performance-fluidity/
├── plan.md              # Este archivo
└── tasks.md             # Lista de tareas
```

### Source Code (repository root)

```text
apps/web/
├── index.html                                  # font-display=swap
├── src/
│   ├── core/
│   │   ├── components/
│   │   │   ├── Skeleton.tsx                    # NUEVO — primitivos de skeleton
│   │   │   ├── TableSkeleton.tsx               # NUEVO
│   │   │   ├── CardSkeleton.tsx                # NUEVO
│   │   │   ├── ModuleSkeleton.tsx              # MOD — layout en vez de spinner
│   │   │   ├── VirtualGrid.tsx                 # MOD — filas skeleton
│   │   │   └── AnimatedNumber.tsx / AnimatedBar.tsx  # NUEVO — entrada de datos
│   │   ├── hooks/
│   │   │   └── useCountUp.ts                   # NUEVO
│   │   └── lib/
│   │       └── query-defaults.ts               # NUEVO — staleTime por tipo de dato
│   ├── shared/
│   │   └── hooks/                              # MOD — keepPreviousData + staleTime
│   └── modules/
│       ├── inventory/
│       │   ├── hooks/useInventoryList.ts       # MOD — quitar espejo Zustand
│       │   ├── store/inventory-store.ts        # MOD — reducir a UI state
│       │   └── components/InventorySummaryCards.tsx  # MOD — barras animadas
│       └── reports/
│           ├── hooks/useDashboard.ts           # MOD — consulta coordinada
│           ├── views/DashboardView.tsx         # MOD — skeleton único por sección
│           └── components/{KpiCard,SalesTrendChart,TopProductsChart}.tsx  # MOD — animación
├── tests/unit/                                 # NUEVO/MOD — tests de hooks y componentes
└── nginx.conf                                  # opcional gzip_static/brotli
```

**Structure Decision**: Todo vive dentro de `apps/web/` (y config Nginx). No se crean módulos backend nuevos; la consolidación del dashboard es **consulta coordinada en el cliente** (`useQueries`).

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Consolidación del dashboard | `useQueries` coordinado (cliente) | Sin módulo backend nuevo; un estado de carga agregado, un skeleton por sección |
| Datos previos al paginar/filtrar | `placeholderData: keepPreviousData` | Evita vaciar la grilla y el salto de layout en cada cambio |
| `staleTime` por tipo | Mapa central de defaults | Referencia = largo/Infinity; transaccional = corto |
| Estado de carga del inventario | Derivar de `useQuery` (quitar espejo Zustand) | Elimina doble fuente de verdad y renders extra |
| Animación de entrada de datos | `framer-motion` + `useCountUp` | Sin dependencias nuevas; respeta `prefers-reduced-motion` |
| Animar solo en primera carga | Guardar `isPending` vs `isFetching` | Refetch/polling no debe reanimar ni resetear UI |
| Dashboard: request agregado | Rechazado | El usuario pidió expresamente consulta coordinada, sin módulo nuevo |
| Prefetch (datos/chunks al hover) | Fuera de alcance | Excluido por decisión del usuario |
| Formularios (`@tanstack/react-form`) | Fuera de alcance | Workstream separado (`specs/005-form-architecture/`) |
| Capa `shared/ws` | Sin consumidores | No hay refetch storm; decidir eliminar o documentar como código muerto |

## Priorities / Phases

- **P1 — Percepción de velocidad**: skeletons con forma de layout, `keepPreviousData`, `staleTime` por tipo, `useDeferredValue` en búsquedas, animación de entrada de datos (count-up / barras).
- **P2 — Arquitectura de carga**: quitar espejo Zustand de `useInventoryList`; dashboard con `useQueries` coordinado.
- **P3 — Render**: `React.memo`, virtualizar desde ~50 filas, montaje diferido bajo el fold, invalidaciones específicas.
- **P4 — Infra**: `display=swap` en fuentes, Nginx gzip_static/Brotli opcional, revisar polling.

## Complexity Tracking

*Sin violaciones a la constitución — no aplica.*

## Verification

- `npm run typecheck`, `npm test`, `npm run test:e2e` en `apps/web`.
- Playwright keyboard de POS deben permanecer verdes.
- Métricas objetivo: navegación <200ms p95; POS <3s.

## Risks

- **Convivencia `isPending`/`isFetching`**: migrar vistas sin introducir spinners en refetch.
- **Polling (cash 10s/30s, reports)**: puede reanimar/parpadear si no se distingue del estado inicial.
- **Invalidaciones amplias** (`['inventory']`, `['employees']`): refetch en cascada; endurecer keys.
