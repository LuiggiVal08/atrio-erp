# Tasks: Performance & Fluidity — Carga de datos y percepción de velocidad

**Input**: Design documents from `/specs/005-performance-fluidity/`

**Prerequisites**: plan.md

**Tests**: TDD mandatory per Constitution Principle III — tests MUST be written and FAIL before implementation.

**Organization**: Tasks grouped by priority/user story for independent delivery.

## Format

- `[P]`: Can run in parallel (different files, no dependencies)
- `[US#]`: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/web/` per plan.md.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Primitivos y utilidades reutilizables que consumen las user stories.

- [x] T001 Create `src/core/components/Skeleton.tsx` — primitivo base (rect/line/circle) con shimmer y tokens de tema
- [x] T002 [P] Create `src/core/components/TableSkeleton.tsx` — N filas skeleton parametrizadas por columnas/`rowHeight`
- [x] T003 [P] Create `src/core/components/CardSkeleton.tsx` — skeleton de tarjeta (KPI/resumen)
- [x] T004 [P] Create `src/core/lib/query-defaults.ts` — mapa central de `staleTime` por tipo (referencia vs transaccional) y helper `refQueryOptions()`/`txQueryOptions()`
- [x] T005 [P] Create `src/core/hooks/useCountUp.ts` — animación 0→valor con `framer-motion`, respeta `useReducedMotion`
- [x] T006 [P] Create `src/core/components/AnimatedNumber.tsx` y `src/core/components/AnimatedBar.tsx` — envoltorios de entrada de datos

**Checkpoint**: Primitivos renderizan en Storybook/tests y no rompen build.

---

## Phase 2: User Story 1 — Percepción de velocidad (Priority: P1) 🎯 MVP

**Goal**: Eliminar saltos de layout y pop-in; conservar datos previos al paginar/filtrar; animar entrada de datos solo en primera carga.

**Independent Test**: Navegar entre módulos y paginar/filtrar: sin spinner de pantalla completa, sin salto de layout, datos previos visibles, números/barras animan una sola vez.

### Tests for User Story 1 ⚠️

- [x] T007 [P] [US1] Unit test de `Skeleton`/`TableSkeleton` render en `tests/unit/core/Skeleton.spec.tsx`
- [x] T008 [P] [US1] Unit test de `useCountUp` (0→valor, caso `prefers-reduced-motion`) en `tests/unit/core/useCountUp.spec.ts`

### Implementation for User Story 1

- [x] T009 [US1] `src/core/components/ModuleSkeleton.tsx` — reemplazar spinner central por skeleton de layout (header + toolbar + filas)
- [ ] T010 [US1] (DIFERIDO: archivo con WIP de otro agente) `src/core/components/VirtualGrid.tsx:86` — reemplazar spinner por N filas skeleton según `rowHeight`/viewport
- [x] T011 [P] [US1] Añadir `placeholderData: keepPreviousData` en `src/shared/hooks/{useClients,useVendors,useCategories,useWarehouses,useCashRegisters,usePaymentMethods}.ts`
- [ ] T012 [P] [US1] (PENDIENTE) Añadir `placeholderData: keepPreviousData` en hooks de módulo: inventory, sales, purchases, cash, payroll, users/rbac
- [x] T013 [US1] Aplicar `staleTime` por tipo vía `query-defaults.ts` en datos de referencia (taxes, categories, warehouses, payment methods, branches, currency rates, roles/permissions)
- [ ] T014 [US1] (DIFERIDO: vistas con WIP de otro agente) `useDeferredValue` en inputs de búsqueda/filtro (inventory, clients, vendors, purchases, users)
- [x] T015 [US1] `AnimatedNumber` en `src/modules/reports/components/KpiCard.tsx`
- [x] T016 [US1] `AnimatedBar` en `src/modules/inventory/components/InventorySummaryCards.tsx` (health, valuación, cobertura)
- [x] T017 [US1] Fijar `animationDuration`/`isAnimationActive` en `SalesTrendChart.tsx` y `TopProductsChart.tsx`
- [ ] T018 [US1] (DIFERIDO: vistas con WIP de otro agente) Distinguir `isPending` (skeleton) de `isFetching` (sin spinner) en las vistas migradas; animar solo en primera carga

**Checkpoint**: Navegación y paginación sin saltos ni spinners de pantalla completa.

---

## Phase 3: User Story 2 — Arquitectura de carga (Priority: P2)

**Goal**: Eliminar el espejo Zustand del inventario y coordinar la carga del dashboard.

**Independent Test**: El inventario usa la query como única fuente; el dashboard muestra un skeleton por sección y resuelve con estado de carga agregado.

### Tests for User Story 2 ⚠️

- [ ] T019 [P] [US2] Unit test de `useInventoryList` (sin side-effects en `queryFn`) en `tests/unit/modules/inventory/useInventoryList.spec.ts`

### Implementation for User Story 2

- [ ] T020 [US2] `src/modules/inventory/hooks/useInventoryList.ts` — quitar `setProducts`/`setLoading` del `queryFn`; retornar `data`/`isPending`/`isFetching`
- [ ] T021 [US2] `src/modules/inventory/store/inventory-store.ts` — reducir a UI state (filter/sort/page/pageSize) sin `products`/`loading`/`total`
- [ ] T022 [US2] Actualizar consumidores del store: `InventoryListView.tsx`, `PurchaseOrderFormView.tsx` (usar `data` de la query)
- [ ] T023 [US2] `src/modules/reports/views/DashboardView.tsx` — cargar con `useQueries` coordinado (summary + trend + products + low-stock) y un skeleton por sección

**Checkpoint**: Inventario con fuente única; dashboard con carga coordinada sin módulo backend nuevo.

---

## Phase 4: User Story 3 — Render (Priority: P3)

**Goal**: Reducir trabajo de render y refetch innecesario.

**Independent Test**: Listas largas scrollan fluido; secciones bajo el fold no montan hasta ser visibles; invalidaciones no disparan refetch en cascada.

### Implementation for User Story 3

- [ ] T024 [P] [US3] `React.memo` en filas/tarjetas pesadas (`KardexRow.tsx` y componentes de tarjeta equivalentes)
- [ ] T025 [US3] `src/core/components/VirtualGrid.tsx` — bajar umbral de virtualización de >100 a ~50 filas
- [ ] T026 [US3] Montaje diferido con `IntersectionObserver` en secciones del dashboard
- [ ] T027 [US3] Revisar invalidaciones amplias (`['inventory']`, `['employees']`) → keys específicas para evitar refetch en cascada

**Checkpoint**: Sin degradación al hacer scroll ni refetch innecesario.

---

## Phase 5: User Story 4 — Infra (Priority: P4)

**Goal**: Cerrar detalles de carga de fuentes, compresión y polling.

**Independent Test**: Sin FOIT al cargar; assets servidos comprimidos; polling no resetea la UI.

### Implementation for User Story 4

- [ ] T028 [P] [US4] `index.html` — añadir `&display=swap` al `<link>` de Google Fonts
- [ ] T029 [P] [US4] `nginx/default.conf` — evaluar `gzip_static`/Brotli (gzip ya activo)
- [ ] T030 [US4] Polling (cash detail 10s, cash registers 30s, reports): usar `isFetching`, no resetear UI
- [ ] T031 [P] [US4] `src/shared/ws/*` — eliminar o documentar como código muerto (sin consumidores)

**Checkpoint**: Carga inicial y refetch en background sin parpadeos.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T032 Run `npm run typecheck && npm test && npm run test:e2e` en `apps/web`; verificar Playwright keyboard de POS intactos
- [ ] T033 Actualizar `AGENTS.md` con convenciones: `isPending` vs `isFetching`, mapa de `staleTime`, skeletons obligatorios en listas

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: sin dependencias.
- **US1 (Phase 2)**: depende de Setup (T001–T006).
- **US2 (Phase 3)**: independiente de US1 (puede ir en paralelo).
- **US3 (Phase 4)**: depende de US2 (T025 comparte `VirtualGrid`).
- **US4 (Phase 5)**: independiente.
- **Polish (Phase 6)**: al cierre.

## Parallel Opportunities

- T002–T006 (primitivos) en paralelo.
- T011/T012 (keepPreviousData por módulo) en paralelo por archivo.
- US1 y US2 pueden ejecutarse en paralelo por equipos distintos.

## Notes

- No crear módulos backend nuevos (decisión del usuario: consulta coordinada).
- No introducir dependencias nuevas (framer-motion ya está).
- Prefetch y formularios quedan fuera de este workstream.
