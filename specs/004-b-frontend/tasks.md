# Tasks: Frontend UI — Interfaz de Alta Densidad ODALX Atrio

**Input**: Design documents from `/specs/004-b-frontend/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: TDD mandatory per Constitution Principle III — tests MUST be written and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format

- `[P]`: Can run in parallel (different files, no dependencies)
- `[US#]`: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

All paths are relative to `apps/web/` per plan.md project structure.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, configuration files.

- [x] T001 Initialize Vite 6 + React 19 + TypeScript 5.x project with `pnpm create vite` in `apps/web/`
- [x] T002 [P] Install and configure Tailwind CSS v4 with `@tailwindcss/vite` plugin in `apps/web/vite.config.ts`
- [x] T003 [P] Install core dependencies: HeroUI, Sileo, Lucide React, TanStack Query v5, Zustand 5, `@tanstack/react-virtual`, `react-phone-number-input`, `libphonenumber-js`, Recharts
- [x] T004 [P] Create directory structure per plan.md: `src/core/{components,hooks,store,services,i18n,styles}/`, `src/modules/{inventory,sales,purchases,cash}/`, `src/routes/`, `tests/{unit,e2e}/`
- [x] T005 [P] Configure Vitest in `apps/web/vite.config.ts` with React Testing Library setup
- [x] T006 [P] Configure Playwright in `apps/web/playwright.config.ts`
- [x] T007 [P] Create `apps/web/.env.example` with `VITE_API_URL`, `VITE_TENANT_ID` variables

**Checkpoint**: Project boots with `pnpm dev`, HMR works, Tailwind styles render.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Core Styles & Theme System

- [x] T008 [P] Create multi-theme CSS in `src/core/styles/themes.css` with `@theme` tokens and `data-theme` attribute selectors for Premium Dark, Nordic Light, Obsidian Emerald
- [x] T009 [P] Create `src/core/store/theme-store.ts` (Zustand) — `current: ThemeId`, `setTheme()`, persist to localStorage

### Layout Shell

- [x] T010 [P] Create `src/core/components/Layout.tsx` — flexbox shell: Sidebar (240px) + Header + Canvas with independent scroll per plan.md FR-001/FR-004
- [x] T011 [P] Create `src/core/components/Sidebar.tsx` — dynamic module list from `SidebarStore`, collapse toggle, active state highlight per FR-002
- [x] T012 [P] Create `src/core/components/Header.tsx` — breadcrumbs synced to router, tenant/branch selector, global command palette trigger per FR-003
- [x] T013 [P] Create `src/core/store/sidebar-store.ts` (Zustand) — `modules: ModuleEntry[]`, `activeModule`, `toggleCollapse`
- [x] T014 [P] Create `src/core/store/header-store.ts` (Zustand) — `breadcrumbs`, `tenantName`, `branchName`

### FSM Visual Components

- [x] T015 [P] Create `src/core/components/DocumentStateBadge.tsx` — interactive badge with color per status (gray/cobalt/emerald/crimson/violet/amber), human label, allowed actions dropdown per FR-005/FR-006
- [x] T016 [P] Create `src/core/components/DocumentTimeline.tsx` — collapsible timeline of state transitions with timestamps, reads data from `document.timeline[]` per FR-007

### VirtualGrid

- [x] T017 [P] Create `src/core/components/VirtualGrid.tsx` — `@tanstack/react-virtual` based grid with sortable columns, fixed headers, row virtualization, empty state, loading skeleton per `data-model.md` section 3 and FR-008

### i18n & Routing

- [x] T018 [P] Create `src/core/i18n/es.ts` and `src/core/i18n/en.ts` — key-based translation files for `common`, `sidebar`, `document`, and module-scoped keys per Constitution Principle VI
- [x] T019 [P] Create `src/core/hooks/useI18n.ts` — returns `t(key)` function, detects locale via `navigator.language` with tenant override, persists per user
- [x] T020 [P] Create `src/core/services/api-client.ts` — TanStack Query `QueryClient` with 5min stale time, tenant-aware key prefix, error interceptor for toasts

### Toast & Notification Service

- [x] T021 [P] Create `src/core/services/toast-service.ts` — `sileo.promise()` wrapper for async mutations with loading/success/error states per `contracts/integration-spec.md` section 2.2
- [x] T022 [P] Create `src/core/components/AppProvider.tsx` — wraps `Toaster` (Sileo) + `QueryClientProvider` + theme initialization per `contracts/integration-spec.md` section 2.1

### Dynamic Routing

- [x] T023 Create `src/routes/AppRoutes.tsx` — `React.lazy()` per module, `Suspense` with fallback, permission guard that checks module permissions before rendering route
- [x] T024 Create `src/main.tsx` — bootstrapper with `AppProvider` + `AppRoutes`
- [x] T025 Create `src/App.tsx` — `AppProvider` → `Layout` → `AppRoutes` composition

**Checkpoint**: Layout renders with theme, sidebar, header; i18n translates; Sileo toasts work; routes load dynamically by permissions.

---

## Phase 3: User Story 1 — Módulo de Inventario (P1) 🎯 MVP

**Goal**: Virtualized inventory Kardex grid with FIFO cost layer display and document FSM (DRAFT→APPROVED→PAID/CANCELLED).

**Independent Test**: Inventory list renders 10,000+ SKUs without DOM degradation; state badge interactively transitions on approve action.

### Tests for User Story 1 ⚠️ (TDD — write first, expect failure)

- [x] T026 [P] [US1] Unit test for inventory store (add item, update quantity, approve) in `tests/unit/inventory/inventory-store.spec.ts`
- [x] T027 [P] [US1] Unit test for VirtualGrid rendering with 10k mock rows without crash in `tests/unit/core/VirtualGrid.spec.tsx`
- [x] T028 [P] [US1] Unit test for DocumentStateBadge status color mapping in `tests/unit/core/DocumentStateBadge.spec.tsx`

### Implementation for User Story 1

- [x] T029 [P] [US1] Create `src/modules/inventory/store/inventory-store.ts` (Zustand) — product list, filters, sort, pagination state
- [x] T030 [P] [US1] Create `src/modules/inventory/hooks/useInventoryList.ts` (TanStack Query) — fetch products with pagination, `queryKey: ['inventory', tenantId]`
- [x] T031 [P] [US1] Create `src/modules/inventory/components/KardexRow.tsx` — single row with SKU, name, cost layers, stock quantity, DocumentStateBadge
- [x] T032 [US1] Create `src/modules/inventory/views/InventoryListView.tsx` — VirtualGrid with KardexRow columns, sort by name/SKU/stock, infinite scroll
- [x] T033 [US1] Create `src/modules/inventory/views/InventoryFormView.tsx` — form for DRAFT adjustment with DocumentTimeline, submit triggers approve action
- [x] T034 [US1] Create `src/modules/inventory/index.ts` — export routes, register module entries for sidebar

**Checkpoint**: Inventory module navigable from sidebar, grid virtualized, FSM badge transitions on approve/cancel. MVP demoable.

---

## Phase 4: User Story 2 — Módulo de Ventas / POS (P1)

**Goal**: High-density POS terminal with keyboard shortcuts (F8/F10), auto-focus search, offline IndexedDB fallback.

**Independent Test**: Complete POS transaction in <3s using only keyboard; disconnect network, complete transaction, restore — data syncs.

### Tests for User Story 2 ⚠️ (TDD)

- [x] T035 [P] [US2] Unit test for POS store (add/remove item, calculate totals, set payment) in `tests/unit/sales/pos-store.spec.ts`
- [x] T036 [P] [US2] Unit test for offline IndexedDB queue (save, load, mark synced) in `tests/unit/sales/offline-queue.spec.ts`
- [x] T037 [P] [US2] Integration test for POS keyboard shortcuts (F8 opens payment, F10 emits invoice) in `tests/unit/sales/pos-keyboard.spec.tsx`

### Implementation for User Story 2

- [x] T038 [P] [US2] Create `src/modules/sales/store/pos-store.ts` (Zustand) — cart items, totals, payment method, offline flag per `data-model.md` section 4
- [x] T039 [P] [US2] Create `src/modules/sales/services/offline-queue.ts` — IndexedDB CRUD for `OfflineTransaction`, sync on connectivity restore per FR-010, last-write-wins conflict resolution on sync
- [x] T040 [P] [US2] Create `src/modules/sales/components/ProductSearch.tsx` — auto-focused search input, query with TanStack Query, result dropdown per FR-009
- [x] T041 [P] [US2] Create `src/modules/sales/components/CartView.tsx` — current cart items list, line total, subtotal, discount, total with DocumentStateBadge
- [x] T042 [P] [US2] Create `src/modules/sales/components/PaymentSelector.tsx` — F8-triggered modal for cash/card/transfer/mixed, confirm button
- [x] T043 [US2] Create `src/modules/sales/views/POSTerminalView.tsx` — composable terminal: ProductSearch + CartView + PaymentSelector, auto-focus management, F8/F10 handlers
- [x] T044 [US2] Create `src/modules/sales/index.ts` — export routes, register POS route

**Checkpoint**: POS loads, keyboard-only transaction works, offline queue stores and syncs.

---

## Phase 5: User Story 3 — Módulo de Compras (P2)

**Goal**: Purchase order list and form with FSM timeline (DRAFT→APPROVED→RECEIVED→PAID), nationalization cost distribution.

**Independent Test**: Purchase order renders with state badge, timeline shows transitions, cost distribution form calculates in real time.

### Tests for User Story 3 ⚠️ (TDD)

- [x] T045 [P] [US3] Unit test for purchase order store (create, approve, receive) in `tests/unit/purchases/purchase-store.spec.ts`

### Implementation for User Story 3

- [x] T046 [P] [US3] Create `src/modules/purchases/hooks/usePurchaseOrders.ts` (TanStack Query) — fetch/approve/receive purchase orders
- [x] T047 [P] [US3] Create `src/modules/purchases/components/PurchaseTimeline.tsx` — DocumentTimeline wrapper for purchase-specific status flow
- [x] T048 [US3] Create `src/modules/purchases/views/PurchaseOrderListView.tsx` — VirtualGrid with order columns, status badge per HU-03
- [x] T049 [US3] Create `src/modules/purchases/views/PurchaseOrderFormView.tsx` — order form with nationalization cost distribution calculator, DocumentTimeline
- [x] T050 [US3] Create `src/modules/purchases/index.ts` — export routes

**Checkpoint**: Purchase orders list/form renders, cost distribution calculates in real time.

---

## Phase 6: User Story 4 — Módulo de Caja y Tesorería (P2)

**Goal**: Cash register audit flow with POS blocking, expected vs counted reconciliation, difference document.

**Independent Test**: Start audit → POS blocks → enter counted amounts → approve → POS unblocks, difference shown.

### Tests for User Story 4 ⚠️ (TDD)

- [x] T051 [P] [US4] Unit test for cash audit store (start, enter counted, approve, calculate difference) in `tests/unit/cash/cash-audit-store.spec.ts`

### Implementation for User Story 4

- [x] T052 [P] [US4] Create `src/modules/cash/store/cash-audit-store.ts` (Zustand) — expected/counted amounts, difference, status per `data-model.md` section 6
- [x] T053 [P] [US4] Create `src/modules/cash/components/AuditFormView.tsx` — counted cash/card/transfer inputs with real-time difference display
- [x] T054 [P] [US4] Create `src/modules/cash/components/CashDashboard.tsx` — movement summary with internal scroll, FSM badge per HU-04
- [x] T055 [US4] Create `src/modules/cash/views/CashAuditView.tsx` — composes AuditFormView, triggers POS block via event, approves/rejects
- [x] T056 [US4] Create `src/modules/cash/index.ts` — export routes

**Checkpoint**: Audit flow complete, POS blocks/unblocks correctly, difference document renders.

---

## Phase 7: User Story 5 — CRM / Ficha de Crédito (P3)

**Goal**: Consolidated third-party profile with credit limit control, automatic alert on credit exceed.

**Independent Test**: Open third-party profile → credit alert shows when balance > limit → transaction blocks.

### Tests for User Story 5 ⚠️ (TDD)

- [x] T057 [P] [US5] Unit test for credit alert logic (`currentBalance > creditLimit` triggers alert state) in `tests/unit/crm/credit-alert.spec.ts`

### Implementation for User Story 5

- [x] T058 [P] [US5] Create `src/modules/inventory/hooks/useFichaTercero.ts` (TanStack Query) — fetch third-party profile with transactions
- [x] T059 [P] [US5] Create `src/modules/inventory/components/CreditAlertBanner.tsx` — auto-shown banner when credit exceeded, blocks new transactions per FR-012
- [x] T060 [US5] Create `src/modules/inventory/views/FichaTerceroView.tsx` — consolidated profile: balance, credit limit, transaction history grid per HU-05

**Checkpoint**: Third-party profile renders, credit alert triggers and dismisses correctly.

---

## Phase 8: User Story 6 — Localización Fiscal (P3)

**Goal**: Tax retention configuration (IGTF, IVA), multi-currency exchange rate display in header.

**Independent Test**: Configure tax rate → rate applies to documents; exchange rate displays in header.

### Tests for User Story 6 ⚠️ (TDD)

- [x] T061 [P] [US6] Unit test for fiscal config form (add tax rule, calculate rate) in `tests/unit/localization/fiscal-config.spec.ts`

### Implementation for User Story 6

- [x] T062 [P] [US6] Create `src/modules/inventory/hooks/useFiscalConfig.ts` (TanStack Query) — fetch/update tax rules, retention rules, exchange rates
- [x] T063 [P] [US6] Create `src/modules/inventory/components/ExchangeRateDisplay.tsx` — header component showing current exchange rate per HU-06
- [x] T064 [US6] Create `src/modules/inventory/views/FiscalConfigView.tsx` — form for IGTF/IVA rates per `data-model.md` section 7

**Checkpoint**: Tax rules configurable, exchange rate visible in header.

---

## Phase 9: User Story 7 — Empleados / Nómina (P3)

**Goal**: Employee profile with role/permission mapping by branch, associated document visibility.

**Independent Test**: Employee list renders, role assignment saves, associated documents show.

### Tests for User Story 7 ⚠️ (TDD)

- [x] T065 [P] [US7] Unit test for employee store (create, assign role, filter by branch) in `tests/unit/hr/employee-store.spec.ts`

### Implementation for User Story 7

- [x] T066 [P] [US7] Create `src/modules/inventory/hooks/useEmployees.ts` (TanStack Query) — fetch employees by branch
- [x] T067 [US7] Create `src/modules/inventory/views/EmployeeListView.tsx` — employee grid with branch filter, role badges per HU-07
- [x] T068 [US7] Create `src/modules/inventory/views/EmployeeFormView.tsx` — employee profile with role assignment, associated documents list

**Checkpoint**: Employee list/form renders, roles assignable by branch.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T069 [P] Add `@tanstack/react-virtual` `overscan` tuning for consistent 60fps in large grids
- [x] T070 [P] Add optimistic update rollback for all TanStack Query mutations with toast error feedback
- [x] T071 [P] Add keyboard navigation (Tab/Enter/Escape) across all form views and grids
- [x] T072 [P] Add loading skeletons for all lazy-loaded module routes (Suspense fallback)
- [x] T073 [P] Add empty state components for all list views with CTA suggestions
- [x] T074 [P] Add error boundaries per module to prevent full-app crash
- [x] T075 [P] Run quickstart.md validation scenarios (VS-01 through VS-10)
- [x] T076 [P] Accessibility audit: focus indicators, aria-labels, color contrast per HeroUI guidelines
- [x] T077 [P] Bundle analysis: verify lazy-loaded chunks < 50KB per module, Lucide tree-shaking effective

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3+)**:
  - US1 (Inventory, P1): Depends on Phase 2 — no story dependencies
  - US2 (POS, P1): Depends on Phase 2 — shares VirtualGrid + DocumentStateBadge from Foundation, no story dependency on US1
  - US3 (Purchasing, P2): Depends on Phase 2 — shares FSM components
  - US4 (Cash, P2): Depends on Phase 2 — accesses POS store for block flag
  - US5 (CRM, P3): Depends on Phase 2 — shares VirtualGrid
  - US6 (Localization, P3): Depends on Phase 2 — shares Header for exchange rate
  - US7 (HR, P3): Depends on Phase 2 — shares VirtualGrid
- **Polish (Phase 10)**: Depends on all desired user stories complete

### User Story Dependencies

| Story | Priority | Depends On | Blocks |
|-------|----------|-----------|--------|
| US1 - Inventory | P1 | Phase 2 | None |
| US2 - POS/Sales | P1 | Phase 2 | US4 (CashAudit blocks POS) |
| US3 - Purchasing | P2 | Phase 2 | None |
| US4 - Cash | P2 | Phase 2 | None (reads POS store) |
| US5 - CRM | P3 | Phase 2 | None |
| US6 - Localization | P3 | Phase 2 | None |
| US7 - HR | P3 | Phase 2 | None |

### Parallel Opportunities

- All Phase 1 Setup tasks marked [P] can run in parallel
- All Phase 2 Foundational tasks marked [P] can run in parallel
- Once Phase 2 completes: US1 and US2 can start in parallel (both P1)
- All tests for a user story marked [P] can run in parallel
- Components within a story marked [P] can run in parallel
- Stories 3-7 (P2/P3) can be worked on in parallel after P1 stories

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD)
- Zustand store before hooks
- Hooks before component views
- Components before module index/route export
- Story complete before moving to next priority

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (TDD):
Task: "Unit test for inventory store in tests/unit/inventory/inventory-store.spec.ts"
Task: "Unit test for VirtualGrid in tests/unit/core/VirtualGrid.spec.tsx"
Task: "Unit test for DocumentStateBadge in tests/unit/core/DocumentStateBadge.spec.tsx"

# Launch all components for User Story 1 together:
Task: "Create inventory store in src/modules/inventory/store/inventory-store.ts"
Task: "Create useInventoryList hooks in src/modules/inventory/hooks/useInventoryList.ts"
Task: "Create KardexRow in src/modules/inventory/components/KardexRow.tsx"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T025) — CRITICAL blocks all stories
3. Complete Phase 3: User Story 1 — Inventory (T026-T034)
4. **STOP and VALIDATE**: Run quickstart.md VS-01 (Layout), VS-03 (FSM Badge), VS-04 (VirtualGrid)
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready (Layout, theme, i18n, routing, toast, FSM, VirtualGrid)
2. Add US1 (Inventory) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (POS) → Test independently → Deploy/Demo
4. Add US3 (Purchasing) + US4 (Cash) → Test independently → Deploy/Demo
5. Add US5 (CRM) + US6 (Localization) + US7 (HR) → Test independently → Deploy/Demo
6. Phase 10 (Polish) → Final audit, performance tuning

### Parallel Team Strategy

With multiple developers:

1. **Team completes Phase 1 + Phase 2 together** (foundation)
2. **Once Foundation done**:
   - Developer A: US1 (Inventory) + US5 (CRM) + US6 (Localization)
   - Developer B: US2 (POS) + US4 (Cash)
   - Developer C: US3 (Purchasing) + US7 (HR)
3. **Phase 10**: Team completes polish tasks in parallel

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- TDD: verify tests fail (red) before implementing (green)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths relative to `apps/web/`
