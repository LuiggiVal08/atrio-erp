# Tasks: Core Architecture & Domain Modules

**Input**: Design documents from `specs/003-core-architecture/`

**Prerequisites**: plan.md, spec.md (user stories), research.md, data-model.md, contracts/rest-api.md

**Tests**: Test tasks are included per Constitution Principle III (TDD mandatory).

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create module skeletons, Prisma schema changes, ModuleEnabledGuard.

**Note**: This phase assumes 001-core-foundations and 002-document-engine are already implemented.

- [X] T001 [P] Update Prisma schema: add `enabledModules` to Tenant, `locale` to User, and all new entities (ProductCategory, Product, Warehouse, Stock, StockMovement, Client, Vendor, LocalizationTax, CurrencyRate, CashRegister, PaymentMethod, CashMovement, SalesOrder, SalesInvoice, PurchaseOrder, AuditLog) in `apps/api/prisma/schema.prisma`
- [X] T002 [P] Create `ModuleEnabledGuard` in `apps/api/src/common/guards/module-enabled.guard.ts` (reads `enabledModules` from JWT, checks against module metadata set by `@RequireModule()` decorator)
- [X] T003 [P] Create `RequireModule` decorator in `apps/api/src/common/guards/require-module.decorator.ts`
- [X] T004 [P] Create `AuditService` (writable) in `apps/api/src/common/audit/audit.service.ts` for programmatic audit log writes from non-REST contexts
- [X] T005 [P] Create migration `20260620000000_add_core_architecture/migration.sql` in `apps/api/prisma/migrations/` with all new tables and indexes

**Checkpoint**: Infrastructure ready — module skeletons can now be created.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create all 6 module directory structures and register them in the application.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 [P] Create `modules/inventory/` directory structure (`domain/`, `application/`, `infrastructure/`) in `apps/api/src/modules/`
- [X] T007 [P] Create `modules/client-vendor/` directory structure in `apps/api/src/modules/`
- [X] T008 [P] Create `modules/localization/` directory structure in `apps/api/src/modules/`
- [X] T009 [P] Create `modules/cash-payments/` directory structure in `apps/api/src/modules/`
- [X] T010 [P] Create `modules/sales/` directory structure in `apps/api/src/modules/`
- [X] T011 [P] Create `modules/purchasing/` directory structure in `apps/api/src/modules/`
- [X] T012 [P] Create `apps/web/src/i18n/es.json` and `apps/web/src/i18n/en.json` with module-keyed structure
- [X] T013 Register all 6 new modules in `apps/api/src/app.module.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Tenant Module Activation (P1) 🎯 MVP

**Goal**: Super-admin de tenant puede activar/desactivar módulos. Backend rechaza requests a módulos desactivados con 403.

**Independent Test**: Crear tenant sin módulo "inventory", intentar GET /inventory/products → 403. Activar módulo, reintentar → 200.

### Tests for User Story 1

- [X] T014 [P] [US1] Unit test for `ModuleEnabledGuard` in `tests/unit/common/module-enabled.guard.spec.ts`
- [X] T015 [P] [US1] Unit test for `RequireModule` decorator in `tests/unit/common/require-module.decorator.spec.ts`
- [X] T016 [US1] Contract test for `PATCH /tenants/{tenantId}/modules` in `tests/contract/tenant-modules.spec.ts`
- [X] T017 [US1] Integration test for module activation + 403 enforcement in `tests/integration/module-activation.spec.ts`

### Implementation for User Story 1

- [X] T018 [P] [US1] Create `TenantModuleService` (extend existing tenant service) with `getEnabledModules()`, `setEnabledModules()` in `apps/api/src/modules/tenant/application/tenant-module.service.ts`
- [X] T019 [P] [US1] Create tenant module endpoints (GET/PATCH /tenants/{tenantId}/modules) in `apps/api/src/modules/tenant/infrastructure/tenant.controller.ts`
- [X] T020 [P] [US1] Add `JwtPayload.enabledModules` population on login in `apps/api/src/common/auth/jwt.strategy.ts`
- [X] T021 [US1] Wire `ModuleEnabledGuard` + `@RequireModule('inventory')` decorator to inventory controller endpoints in `apps/api/src/modules/inventory/infrastructure/`

**Checkpoint**: US1 fully functional — tenant module toggle + 403 enforcement working.

---

## Phase 4: User Story 2 — Product & Inventory Management (P1) 🎯 MVP

**Goal**: Usuario de inventario gestiona categorías, productos, almacenes y stock con soft-delete.

**Independent Test**: Crear categoría → crear producto en esa categoría → verificar stock inicial en 0 → ajustar stock → verificar movimiento registrado → soft-delete producto → verificar que no aparece en listado pero existe en BD.

### Tests for User Story 2

- [X] T022 [P] [US2] Unit test for `ProductCategory` entity in `tests/unit/inventory/product-category.entity.spec.ts`
- [X] T023 [P] [US2] Unit test for `Product` entity (sku unique, soft-delete) in `tests/unit/inventory/product.entity.spec.ts`
- [X] T023b [P] [US2] Unit test for `ProductCategoryService` in `tests/unit/inventory/product-category.service.spec.ts`
- [X] T023c [P] [US2] Unit test for `ProductService` in `tests/unit/inventory/product.service.spec.ts`
- [X] T023d [P] [US2] Unit test for `WarehouseService` in `tests/unit/inventory/warehouse.service.spec.ts`
- [X] T024 [P] [US2] Unit test for `StockService` (movements, balance) in `tests/unit/inventory/stock.service.spec.ts`
- [X] T025 [P] [US2] Contract test for product CRUD endpoints in `tests/contract/inventory/products.spec.ts`
- [X] T026 [P] [US2] Contract test for stock adjust + movements in `tests/contract/inventory/stock.spec.ts`

### Implementation for User Story 2

- [X] T027 [P] [US2] Create `ProductCategory` entity in `apps/api/src/modules/inventory/domain/product-category.entity.ts`
- [X] T028 [P] [US2] Create `Product` entity in `apps/api/src/modules/inventory/domain/product.entity.ts`
- [X] T029 [P] [US2] Create `Warehouse` entity in `apps/api/src/modules/inventory/domain/warehouse.entity.ts`
- [X] T030 [P] [US2] Create `Stock` entity in `apps/api/src/modules/inventory/domain/stock.entity.ts`
- [X] T031 [P] [US2] Create `StockMovement` entity in `apps/api/src/modules/inventory/domain/stock-movement.entity.ts`
- [X] T032 [P] [US2] Create `InventoryRepository` interface in `apps/api/src/modules/inventory/domain/inventory.repository.interface.ts`
- [X] T033 [P] [US2] Create `ProductCategoryService` in `apps/api/src/modules/inventory/application/product-category.service.ts`
- [X] T034 [P] [US2] Create `ProductService` (CRUD, soft-delete) in `apps/api/src/modules/inventory/application/product.service.ts`
- [X] T035 [P] [US2] Create `WarehouseService` in `apps/api/src/modules/inventory/application/warehouse.service.ts`
- [X] T036 [P] [US2] Create `StockService` (adjust, get balance, list movements) in `apps/api/src/modules/inventory/application/stock.service.ts`
- [X] T037 [US2] Create `PrismaInventoryRepository` in `apps/api/src/modules/inventory/infrastructure/prisma-inventory.repository.ts`
- [X] T038 [US2] Create `InventoryController` with all CRUD endpoints + `@RequireModule('inventory')` in `apps/api/src/modules/inventory/infrastructure/inventory.controller.ts`
- [X] T039 [US2] Wire `InventoryModule` in `apps/api/src/modules/inventory/inventory.module.ts`

**Checkpoint**: US1 + US2 functional — products, categories, warehouses, stock management working.

---

## Phase 5: User Story 3 — Client & Vendor Registry (P1) 🎯 MVP

**Goal**: Usuario registra clientes y proveedores con documento fiscal único por tenant, soft-delete.

**Independent Test**: Crear cliente con RIF → crear segundo con mismo RIF → error. Soft-delete cliente → verificar oculto pero existe.

### Tests for User Story 3

- [X] T040 [P] [US3] Unit test for `Client` entity (unique documentId) in `tests/unit/client-vendor/client.entity.spec.ts`
- [X] T041 [P] [US3] Unit test for `Vendor` entity in `tests/unit/client-vendor/vendor.entity.spec.ts`
- [X] T042 [P] [US3] Contract test for client CRUD endpoints in `tests/contract/client-vendor/clients.spec.ts`
- [X] T043 [P] [US3] Contract test for vendor CRUD endpoints in `tests/contract/client-vendor/vendors.spec.ts`
- [X] T043b [P] [US3] Unit test for `ClientService` in `tests/unit/client-vendor/client.service.spec.ts`
- [X] T043c [P] [US3] Unit test for `VendorService` in `tests/unit/client-vendor/vendor.service.spec.ts`

### Implementation for User Story 3

- [X] T044 [P] [US3] Create `Client` entity in `apps/api/src/modules/client-vendor/domain/client.entity.ts`
- [X] T045 [P] [US3] Create `Vendor` entity in `apps/api/src/modules/client-vendor/domain/vendor.entity.ts`
- [X] T046 [P] [US3] Create `ClientVendorRepository` interface in `apps/api/src/modules/client-vendor/domain/client-vendor.repository.interface.ts`
- [X] T047 [P] [US3] Create `ClientService` in `apps/api/src/modules/client-vendor/application/client.service.ts`
- [X] T048 [P] [US3] Create `VendorService` in `apps/api/src/modules/client-vendor/application/vendor.service.ts`
- [X] T049 [US3] Create `PrismaClientVendorRepository` in `apps/api/src/modules/client-vendor/infrastructure/prisma-client-vendor.repository.ts`
- [X] T050 [US3] Create `ClientVendorController` with CRUD endpoints + `@RequireModule('client-vendor')` in `apps/api/src/modules/client-vendor/infrastructure/client-vendor.controller.ts`
- [X] T051 [US3] Wire `ClientVendorModule` in `apps/api/src/modules/client-vendor/client-vendor.module.ts`

**Checkpoint**: US1 + US2 + US3 functional — master data complete.

---

## Phase 6: User Story 4 — Localization Engine (P2)

**Goal**: Administrador configura impuestos y tasas de cambio. Productos pueden tener impuesto asignado.

**Independent Test**: Crear impuesto IVA 16%. Crear tasa USD→VES 89.50. Asignar impuesto a producto. Verificar que el tipo de cambio se fija al aprobar un documento.

### Tests for User Story 4

- [X] T052 [P] [US4] Unit test for `LocalizationTax` entity in `tests/unit/localization/localization-tax.entity.spec.ts`
- [X] T053 [P] [US4] Unit test for `CurrencyRate` entity (unique per date) in `tests/unit/localization/currency-rate.entity.spec.ts`
- [X] T054 [P] [US4] Unit test for `CurrencyRateService.getRateAtDate()` in `tests/unit/localization/currency-rate.service.spec.ts`
- [X] T055 [P] [US4] Contract test for tax CRUD endpoints in `tests/contract/localization/taxes.spec.ts`
- [X] T056 [P] [US4] Contract test for currency rate CRUD endpoints in `tests/contract/localization/currency-rates.spec.ts`
- [X] T054b [P] [US4] Unit test for `LocalizationTaxService` in `tests/unit/localization/localization-tax.service.spec.ts`

### Implementation for User Story 4

- [X] T057 [P] [US4] Create `LocalizationTax` entity in `apps/api/src/modules/localization/domain/localization-tax.entity.ts`
- [X] T058 [P] [US4] Create `CurrencyRate` entity in `apps/api/src/modules/localization/domain/currency-rate.entity.ts`
- [X] T059 [P] [US4] Create `LocalizationRepository` interface in `apps/api/src/modules/localization/domain/localization.repository.interface.ts`
- [X] T060 [P] [US4] Create `LocalizationTaxService` in `apps/api/src/modules/localization/application/localization-tax.service.ts`
- [X] T061 [P] [US4] Create `CurrencyRateService` in `apps/api/src/modules/localization/application/currency-rate.service.ts`
- [X] T062 [US4] Create `PrismaLocalizationRepository` in `apps/api/src/modules/localization/infrastructure/prisma-localization.repository.ts`
- [X] T063 [US4] Create `LocalizationController` with CRUD endpoints + `@RequireModule('localization')` in `apps/api/src/modules/localization/infrastructure/localization.controller.ts`
- [X] T064 [US4] Wire `LocalizationModule` in `apps/api/src/modules/localization/localization.module.ts`

**Checkpoint**: US1-US4 functional — taxes and currency rates configurable.

---

## Phase 7: User Story 5 — Cash & Payment Methods (P2)

**Goal**: Usuario de caja configura cajas y métodos de pago, registra movimientos con validación de balance.

**Independent Test**: Crear caja con balance 0. Crear método de pago. Registrar ingreso de $500. Intentar egreso de $600 → error. Registrar egreso de $300 → ok.

### Tests for User Story 5

- [X] T065 [P] [US5] Unit test for `CashRegister` entity in `tests/unit/cash-payments/cash-register.entity.spec.ts`
- [X] T066 [P] [US5] Unit test for `CashMovement` validation (balance check) in `tests/unit/cash-payments/cash-movement.service.spec.ts`
- [X] T067 [P] [US5] Contract test for cash register CRUD in `tests/contract/cash-payments/registers.spec.ts`
- [X] T068 [P] [US5] Contract test for cash movements in `tests/contract/cash-payments/movements.spec.ts`
- [X] T066b [P] [US5] Unit test for `CashRegisterService` in `tests/unit/cash-payments/cash-register.service.spec.ts`

### Implementation for User Story 5

- [X] T069 [P] [US5] Create `CashRegister` entity in `apps/api/src/modules/cash-payments/domain/cash-register.entity.ts`
- [X] T070 [P] [US5] Create `PaymentMethod` entity in `apps/api/src/modules/cash-payments/domain/payment-method.entity.ts`
- [X] T071 [P] [US5] Create `CashMovement` entity in `apps/api/src/modules/cash-payments/domain/cash-movement.entity.ts`
- [X] T072 [P] [US5] Create `CashPaymentsRepository` interface in `apps/api/src/modules/cash-payments/domain/cash-payments.repository.interface.ts`
- [X] T073 [P] [US5] Create `CashRegisterService` in `apps/api/src/modules/cash-payments/application/cash-register.service.ts`
- [X] T074 [P] [US5] Create `CashMovementService` (with balance validation) in `apps/api/src/modules/cash-payments/application/cash-movement.service.ts`
- [X] T075 [US5] Create `PrismaCashPaymentsRepository` in `apps/api/src/modules/cash-payments/infrastructure/prisma-cash-payments.repository.ts`
- [X] T076 [US5] Create `CashPaymentsController` with CRUD endpoints + `@RequireModule('cash-payments')` in `apps/api/src/modules/cash-payments/infrastructure/cash-payments.controller.ts`
- [X] T077 [US5] Wire `CashPaymentsModule` in `apps/api/src/modules/cash-payments/cash-payments.module.ts`

**Checkpoint**: US1-US5 functional — cash registers and payment methods working.

---

## Phase 8: User Story 6 — Sales Flow (Orders → Invoices) (P2)

**Goal**: Vendedor crea cotizaciones/pedidos, los convierte en facturas. Al aprobar la factura, descuenta stock y registra cuenta por cobrar.

**Dependencies**: Requires US2 (products), US3 (clients), US4 (taxes), 002-document-engine.

**Independent Test**: Crear cotización → convertir a pedido → crear factura desde pedido → aprobar factura → verificar stock descontado.

### Tests for User Story 6

- [X] T078 [P] [US6] Unit test for `SalesOrderService` in `tests/unit/sales/sales-order.service.spec.ts`
- [X] T079 [P] [US6] Unit test for `SalesInvoiceService` in `tests/unit/sales/sales-invoice.service.spec.ts`
- [X] T080 [P] [US6] Contract test for quote → order → invoice flow in `tests/contract/sales/sales-flow.spec.ts`
- [X] T081 [P] [US6] Integration test for stock deduction on invoice approval in `tests/integration/events/stock-events.spec.ts`

### Implementation for User Story 6

- [X] T082 [P] [US6] Create `SalesOrder` entity in `apps/api/src/modules/sales/domain/sales-order.entity.ts`
- [X] T083 [P] [US6] Create `SalesInvoice` entity in `apps/api/src/modules/sales/domain/sales-invoice.entity.ts`
- [X] T084 [P] [US6] Create `SalesRepository` interface in `apps/api/src/modules/sales/domain/sales.repository.interface.ts`
- [X] T085 [P] [US6] Create `SalesOrderService` in `apps/api/src/modules/sales/application/sales-order.service.ts`
- [X] T086 [P] [US6] Create `SalesInvoiceService` (with approve) in `apps/api/src/modules/sales/application/sales-invoice.service.ts`
- [X] T087 [US6] Create `PrismaSalesRepository` in `apps/api/src/modules/sales/infrastructure/prisma-sales.repository.ts`
- [X] T088 [US6] Create `SalesController` with quote/order/invoice endpoints + `@RequireModule('sales')` in `apps/api/src/modules/sales/infrastructure/sales.controller.ts`
- [X] T089 [US6] Wire `SalesModule` in `apps/api/src/modules/sales/sales.module.ts`

**Checkpoint**: US1-US6 functional — sales flow complete with stock impact.

---

## Phase 9: User Story 7 — Purchasing Flow (P2)

**Goal**: Comprador crea órdenes de compra, recibe productos (parcialmente), stock incrementa automáticamente.

**Dependencies**: Requires US2 (products), US3 (vendors), US4 (taxes), 002-document-engine.

**Independent Test**: Crear OC → aprobar → recibir parcialmente 3 de 10 → verificar stock en +3 → recibir resto → verificar estado "received".

### Tests for User Story 7

- [X] T090 [P] [US7] Unit test for `PurchaseOrderService` in `tests/unit/purchasing/purchase-order.service.spec.ts`
- [X] T091 [P] [US7] Unit test for partial receive in `tests/unit/purchasing/purchase-receive.service.spec.ts`
- [X] T092 [P] [US7] Contract test for purchase order CRUD + receive in `tests/contract/purchasing/purchase-orders.spec.ts`
- [X] T093 [P] [US7] Integration test for stock increment on receive in `tests/integration/events/stock-events.spec.ts`

### Implementation for User Story 7

- [X] T094 [P] [US7] Create `PurchaseOrder` entity in `apps/api/src/modules/purchasing/domain/purchase-order.entity.ts`
- [X] T095 [P] [US7] Create `PurchasingRepository` interface in `apps/api/src/modules/purchasing/domain/purchasing.repository.interface.ts`
- [X] T096 [P] [US7] Create `PurchaseOrderService` in `apps/api/src/modules/purchasing/application/purchase-order.service.ts`
- [X] T097 [US7] Create `PrismaPurchasingRepository` in `apps/api/src/modules/purchasing/infrastructure/prisma-purchasing.repository.ts`
- [X] T098 [US7] Create `PurchasingController` + `@RequireModule('purchasing')` in `apps/api/src/modules/purchasing/infrastructure/purchasing.controller.ts`
- [X] T099 [US7] Wire `PurchasingModule` in `apps/api/src/modules/purchasing/purchasing.module.ts`

**Checkpoint**: US1-US7 functional — purchasing flow complete with partial receive.

---

## Phase 10: User Story 8 — Cross-Module Event Bus (P2)

**Goal**: El Document Engine emite eventos de dominio. Inventory y Cash & Payments los consumen para impacto automático.

**Dependencies**: Requires 002-document-engine, US6 (sales invoice approval), US7 (purchase receipt).

**Independent Test**: Aprobar factura de venta → verificar que stock se descuenta automáticamente. Recibir OC → verificar que stock se incrementa.

### Tests for User Story 8

- [X] T100 [P] [US8] Unit test for `EventBusService` (emission + persistence) in `tests/unit/document-engine/event-bus.service.spec.ts`
- [X] T101 [P] [US8] Unit test for stock deduction event handler in `tests/unit/inventory/stock-event-handler.spec.ts`
- [X] T102 [P] [US8] Integration test for full event chain (approve → stock deducted) in `tests/integration/events/stock-events.spec.ts`

### Implementation for User Story 8

- [X] T103 [P] [US8] Create `EventBusService` (wrapper around `@nestjs/event-emitter` with persistence) in `apps/api/src/modules/document-engine/infrastructure/event-bus.service.ts`
- [X] T104 [P] [US8] Create `StockEventHandler` (listens `document.approved` with type `sales_invoice`, deducts stock) in `apps/api/src/modules/inventory/application/stock-event-handler.ts`
- [X] T105 [P] [US8] Create `CashMovementEventHandler` (listens `document.paid`, registers cash movement) in `apps/api/src/modules/cash-payments/application/cash-movement-event-handler.ts`
- [X] T106 [P] [US8] Create `PurchaseReceiveEventHandler` (listens `document.received`, increments stock) in `apps/api/src/modules/purchasing/application/purchase-receive-event-handler.ts`
- [X] T107 [US8] Wire event handlers in their respective modules and register listeners in `apps/api/src/modules/`

**Checkpoint**: US1-US8 functional — event-driven cross-module impact working.

---

## Phase 11: User Story 9 — Audit Logging (P2)

**Goal**: Toda mutación en datos core queda registrada en `audit_logs` con who/what/when, before/after.

**Independent Test**: Crear producto → verificar audit_log con action "product.create" y after = producto. Modificar → action "product.update" con before/after.

### Tests for User Story 9

- [X] T108 [P] [US9] Unit test for `AuditService` in `tests/unit/common/audit.service.spec.ts`
- [X] T109 [P] [US9] Contract test for `GET /admin/audit-logs` in `tests/contract/audit-logs.spec.ts`
- [X] T110 [P] [US9] Integration test for automatic audit on product/client CRUD in `tests/integration/audit/auto-audit.spec.ts`

### Implementation for User Story 9

- [X] T111 [P] [US9] Implement `AuditService.log()` with before/after JSON serialization in `apps/api/src/common/audit/audit.service.ts`
- [X] T112 [P] [US9] Integrate `AuditInterceptor` across all new module controllers (or extend existing global audit interceptor) in `apps/api/src/common/audit/audit.interceptor.ts`
- [X] T113 [P] [US9] Create `AuditController` with `GET /admin/audit-logs` (filterable by action, entityType, date range) in `apps/api/src/common/audit/audit.controller.ts`

**Checkpoint**: US1-US9 functional — audit trail automatic on all mutations.

---

## Phase 12: User Story 10 — User Locale Preference (P3)

**Goal**: Usuario selecciona idioma (español/inglés). Frontend consume archivos JSON key-based sin strings hardcodeadas.

**Independent Test**: Cambiar locale a "en" → JWT rotado con locale → frontend muestra textos en inglés.

### Tests for User Story 10

- [X] T114 [P] [US10] Unit test for locale update in user service in `tests/unit/user/locale.service.spec.ts`
- [X] T115 [P] [US10] Contract test for `PATCH /users/me/locale` in `tests/contract/user/locale.spec.ts`

### Implementation for User Story 10

- [X] T116 [P] [US10] Add `locale` field to JWT payload in `apps/api/src/common/auth/jwt.strategy.ts`
- [X] T117 [P] [US10] Create `PATCH /users/me/locale` endpoint in existing user controller in `apps/api/src/modules/user/infrastructure/user.controller.ts`
- [X] T118 [P] [US10] Create `apps/web/src/i18n/es.json` with module-keyed translations (empty structure ready for content)
- [X] T119 [P] [US10] Create `apps/web/src/i18n/en.json` with module-keyed translations
- [X] T120 [P] [US10] Create `apps/web/src/i18n/i18n.ts` — simple key-based translation utility (get `t('sales.invoice.create.title')` from JWT locale)
- [X] T121 [P] [US10] Update `apps/web/src/core/auth/store.ts` to store `locale` from JWT
- [X] T122 [US10] Add `useTranslation` hook in `apps/web/src/shared/hooks/useTranslation.ts`

**Checkpoint**: All 10 user stories functional.

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [X] T123 [P] Add `@RequireModule()` decorator + `ModuleEnabledGuard` to ALL controller endpoints across all modules in `apps/api/src/modules/*/infrastructure/`
- [X] T124 [P] Add RBAC guards (`@UseGuards(JwtAuthGuard, RbacGuard)` + `@RequirePermission()`) to ALL new controller endpoints in `apps/api/src/modules/*/infrastructure/`
- [X] T125 [P] Run `npm run prisma:migrate` and verify all migrations apply cleanly in `apps/api/`
- [X] T126 Run full test suite: `cd apps/api && npx jest --testPathPattern='tests/unit'` and fix failures
- [X] T127 Run contract tests: `npx jest --testPathPattern='tests/contract'` and fix failures
- [X] T128 Run integration tests: `npx jest --testPathPattern='tests/integration'` and fix failures
- [X] T129 Run `quickstart.md` validation scenarios (all 9 scenarios) in `specs/003-core-architecture/quickstart.md`
- [x] T130 Code cleanup and final review

**Checkpoint**: All features complete, tested, and validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3-12)**: All depend on Foundational completion
  - US6 (Sales) depends on US2, US3, US4 (master data) + 002
  - US7 (Purchasing) depends on US2, US3, US4 (master data) + 002
  - US8 (Event Bus) depends on US6, US7 (needs events from transactional flows)
  - US9 (Audit) can run in parallel with US4-US8
  - US10 (i18n) can run in parallel with all others (frontend only)
- **Polish (Phase 13)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can start after Phase 2
- **US2 (P1)**: No dependencies on other stories — can start after Phase 2
- **US3 (P1)**: No dependencies on other stories — can start after Phase 2
- **US4 (P2)**: No dependencies on other stories — can start after Phase 2
- **US5 (P2)**: No dependencies on other stories — can start after Phase 2
- **US6 (P2)**: Requires US2, US3, US4 (master data) + 002-document-engine
- **US7 (P2)**: Requires US2, US3, US4 (master data) + 002-document-engine
- **US8 (P2)**: Requires US6, US7 (needs document events to consume)
- **US9 (P2)**: No dependencies — can start after Phase 2
- **US10 (P3)**: No dependencies — frontend only

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD per Constitution Principle III)
- Domain entities before use cases
- Use cases before controllers
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- US1, US2, US3, US4, US5, US9, US10 can all run in PARALLEL after Phase 2
- US6 and US7 can run in parallel once US2, US3, US4 are complete
- All tests for a story marked [P] can run in parallel
- Different files within a story marked [P] can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all tests for User Story 2 together:
Task: "Unit test for ProductCategory entity in tests/unit/inventory/product-category.entity.spec.ts"
Task: "Unit test for Product entity in tests/unit/inventory/product.entity.spec.ts"
Task: "Unit test for StockService in tests/unit/inventory/stock.service.spec.ts"
Task: "Contract test for product CRUD endpoints in tests/contract/inventory/products.spec.ts"
Task: "Contract test for stock adjust + movements in tests/contract/inventory/stock.spec.ts"

# Launch all models for User Story 2 together:
Task: "Create ProductCategory entity in apps/api/src/modules/inventory/domain/product-category.entity.ts"
Task: "Create Product entity in apps/api/src/modules/inventory/domain/product.entity.ts"
Task: "Create Warehouse entity in apps/api/src/modules/inventory/domain/warehouse.entity.ts"
Task: "Create Stock entity in apps/api/src/modules/inventory/domain/stock.entity.ts"
Task: "Create StockMovement entity in apps/api/src/modules/inventory/domain/stock-movement.entity.ts"
Task: "Create InventoryRepository interface in apps/api/src/modules/inventory/domain/inventory.repository.interface.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete US1 (Module Activation), US2 (Products & Inventory), US3 (Clients & Vendors) in parallel
4. **STOP and VALIDATE**: Test US1, US2, US3 independently
5. Deploy/demo if ready — master data management working

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1, US2, US3 → Test independently → **MVP DEPLOY** (master data CRUD)
3. Add US4, US5 → Test independently → Deploy (localization + cash)
4. Add US6, US7 → Test independently → Deploy (transactional flows)
5. Add US8, US9 → Test independently → Deploy (event bus + audit)
6. Add US10 → Test independently → Deploy (i18n)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (Module Activation) + US9 (Audit)
   - Developer B: US2 (Products & Inventory)
   - Developer C: US3 (Clients & Vendors) + US4 (Localization)
   - Developer D: US5 (Cash & Payments) + US10 (i18n)
3. After US2, US3, US4 complete:
   - Developer A: US6 (Sales)
   - Developer B: US7 (Purchasing)
4. After US6, US7 complete:
   - Developer A: US8 (Event Bus)
5. Together: Phase 13 Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [US1-10] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable
- Write tests first (RED), then implement (GREEN), then refactor per Constitution Principle III
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Files follow hexagonal architecture: `domain/` (entities, interfaces), `application/` (use cases), `infrastructure/` (controllers, DTOs, Prisma adapters, module)
- Use DI string tokens (`INVENTORY_REPOSITORY`, `CLIENT_VENDOR_REPOSITORY`, etc.) consistent with 001-core-foundations pattern
- All endpoints must have `@UseGuards(JwtAuthGuard, RbacGuard)` + `@RequirePermission()` + `@RequireModule()`
