# Tasks: Reports Module

**Input**: Design documents from `specs/004-a-reportes/`

**Prerequisites**: plan.md, spec.md (user stories), research.md, data-model.md, contracts/rest-api.md, quickstart.md

**Tests**: Test tasks are included per Constitution Principle III (TDD mandatory).

**Organization**: Tasks grouped by layer then user story for independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prisma schema changes, MinIO Docker setup, NPM dependencies, BullMQ queue config.

**Note**: This phase assumes 001-core-foundations, 002-document-engine, and 003-core-architecture are already implemented.

- [x] T001 [P] Update Prisma schema: add enums `ReportType` (SALES, INVENTORY, CASH, CLIENTS, TAXES, PROFIT), `ReportFormat` (PDF, XLSX, CSV), `ReportExecutionStatus` (PENDING, PROCESSING, COMPLETED, FAILED) in `apps/api/prisma/schema.prisma`
- [x] T002 [P] Update Prisma schema: add models `ReportDefinition`, `ReportExecution`, `ReportHistory`, `DashboardWidget` with all fields, relations, indexes, and `@@map` table names in `apps/api/prisma/schema.prisma`
- [x] T003 [P] Add `minio` service to `docker-compose.yml` with environment variables (endpoint, accessKey, secretKey, bucket), persistent volume, healthcheck, and port 9000
- [x] T004 [P] Install NPM dependencies in `apps/api/`: `@nestjs/bull`, `bullmq`, `handlebars`, `puppeteer`, `exceljs`, `minio`, and dev deps `@types/puppeteer` — update `package.json`
- [x] T005 [P] Create `BullModule.forRoot()` configuration in shared Redis infrastructure config and register queue names (`report-export`, `report-cleanup`, `report-schedule`) in `apps/api/src/infrastructure/redis/`
- [x] T006 [P] Create migration `20260630000000_add_reports_module/migration.sql` in `apps/api/prisma/migrations/` with all new enums, tables, and indexes

**Checkpoint**: Infrastructure ready — reports module can now be built.

---

## Phase 2: Foundational (Module Structure)

**Purpose**: Create reports module directory structure and register in the application.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 [P] Create `modules/reports/` directory structure (`domain/`, `application/`, `infrastructure/dto/`, `infrastructure/templates/`, `jobs/`) in `apps/api/src/modules/`
- [x] T008 Register `ReportsModule` in `apps/api/src/app.module.ts`

**Checkpoint**: Foundation ready — reports implementation can now begin.

---

## Phase 3: Core Engine — Domain Entities & Repository Interface

**Purpose**: Domain layer entities and repository contract for the reports module.

### Tests for Core Domain

- [x] T009 [P] [CORE] Unit test for `Report` entity in `tests/unit/reports/report.entity.spec.ts`
- [x] T010 [P] [CORE] Unit test for `DashboardWidget` entity in `tests/unit/reports/dashboard-widget.entity.spec.ts`

### Implementation for Core Domain

- [x] T011 [P] [CORE] Create `Report` entity (report data projection — no DB entity, this is the domain model for generated report data) in `apps/api/src/modules/reports/domain/report.entity.ts`
- [x] T012 [P] [CORE] Create `DashboardWidget` entity in `apps/api/src/modules/reports/domain/dashboard-widget.entity.ts`
- [x] T013 [P] [CORE] Create `ReportRepository` interface with methods for history, definitions, executions, and widgets CRUD in `apps/api/src/modules/reports/domain/report.repository.interface.ts`

**Checkpoint**: Core domain layer complete — entities and repository contract ready.

---

## Phase 4: Core Engine — Generators & Storage

**Purpose**: File generation services (PDF, Excel, CSV) and MinIO storage integration.

### Tests for Generators & Storage

- [x] T014 [P] [CORE] Unit test for `PdfGeneratorService` (template rendering + Puppeteer launch) in `tests/unit/reports/pdf-generator.service.spec.ts`
- [x] T015 [P] [CORE] Unit test for `ExcelGeneratorService` (workbook creation, sheets, styles) in `tests/unit/reports/excel-generator.service.spec.ts`
- [x] T016 [P] [CORE] Unit test for `CsvGeneratorService` (streaming, headers, escaping) in `tests/unit/reports/csv-generator.service.spec.ts`
- [x] T017 [P] [CORE] Unit test for `MinioStorageService` (upload, getSignedUrl, delete) in `tests/unit/reports/minio-storage.service.spec.ts`

### Implementation for Generators & Storage

- [x] T018 [P] [CORE] Create `PdfGeneratorService` in `apps/api/src/modules/reports/infrastructure/pdf-generator.service.ts` — Handlebars HTML rendering → Puppeteer PDF
- [x] T019 [P] [CORE] Create `ExcelGeneratorService` in `apps/api/src/modules/reports/infrastructure/excel-generator.service.ts` — ExcelJS workbook builder for each report type
- [x] T020 [P] [CORE] Create `CsvGeneratorService` in `apps/api/src/modules/reports/infrastructure/csv-generator.service.ts` — native Node.js stream CSV writer
- [x] T021 [P] [CORE] Create `MinioStorageService` in `apps/api/src/modules/reports/infrastructure/minio-storage.service.ts` — upload buffer, get signed download URL, delete object, list/cleanup by prefix

**Checkpoint**: File generation and storage ready — can produce PDF, Excel, CSV and store in MinIO.

---

## Phase 5: Core Engine — Handlebars Templates

**Purpose**: HTML templates for each report type rendered by Handlebars before Puppeteer conversion.

**Note**: Templates use inline CSS for styling (Puppeteer renders to PDF).

### Templates (no separate tests — validated via PdfGeneratorService tests)

- [x] T022 [CORE] Create `sales-report.hbs` Handlebars template in `apps/api/src/modules/reports/infrastructure/templates/` — table layout with date, client, total, status columns, totals footer, period header
- [x] T023 [CORE] Create `inventory-report.hbs` Handlebars template in `apps/api/src/modules/reports/infrastructure/templates/` — stock by warehouse, low-stock highlight, valuation summary
- [x] T024 [CORE] Create `cash-report.hbs` Handlebars template in `apps/api/src/modules/reports/infrastructure/templates/` — income/expense by method, opening/closing balance
- [x] T025 [CORE] Create `clients-report.hbs` Handlebars template in `apps/api/src/modules/reports/infrastructure/templates/` — client list with totals, top N ranking
- [x] T026 [CORE] Create `taxes-report.hbs` Handlebars template in `apps/api/src/modules/reports/infrastructure/templates/` — IVA collected/paid, fiscal credit/debit summary

**Checkpoint**: All 5 report templates ready for PDF generation.

---

## Phase 6: Core Engine — Application Services

**Purpose**: All application-layer use cases for reports.

### Tests for Application Services

- [x] T027 [P] [CORE] Unit test for `DashboardService` (live queries: summary KPIs, sales trend, top products, low stock) in `tests/unit/reports/dashboard.service.spec.ts`
- [x] T028 [P] [CORE] Unit test for `ReportExportService` (orchestrate queue→generate→store→history) in `tests/unit/reports/report-export.service.spec.ts`
- [x] T029 [P] [CORE] Unit test for `ReportDefinitionService` (CRUD, validation) in `tests/unit/reports/report-definition.service.spec.ts`
- [x] T030 [P] [CORE] Unit test for `ReportSchedulerService` (register repeatable jobs, cancel) in `tests/unit/reports/report-scheduler.service.spec.ts`
- [x] T031 [P] [CORE] Unit test for `ReportCleanupService` (delete expired files from MinIO + history) in `tests/unit/reports/report-cleanup.service.spec.ts`

### Implementation for Application Services

- [x] T032 [P] [CORE] Create `DashboardService` in `apps/api/src/modules/reports/application/dashboard.service.ts` — aggregate queries across sales/inventory/cash/client modules returning KPIs, trends, top products, low stock alerts
- [x] T033 [P] [CORE] Create `ReportExportService` in `apps/api/src/modules/reports/application/report-export.service.ts` — validate request, queue export job, track status, handle result
- [x] T034 [P] [CORE] Create `ReportDefinitionService` in `apps/api/src/modules/reports/application/report-definition.service.ts` — CRUD for scheduled report definitions with schedule validation
- [x] T035 [P] [CORE] Create `ReportSchedulerService` in `apps/api/src/modules/reports/application/report-scheduler.service.ts` — manage BullMQ repeatable jobs from report definitions, trigger on create/update/delete
- [x] T036 [P] [CORE] Create `ReportCleanupService` in `apps/api/src/modules/reports/application/report-cleanup.service.ts` — query expired report_history, delete files from MinIO, remove history records

**Checkpoint**: All application services complete — dashboard queries, export orchestration, definition management, scheduling, and cleanup working.

---

## Phase 7: Core Engine — Job Processors (BullMQ)

**Purpose**: Background job consumers for export, cleanup, and scheduled report generation.

### Tests for Job Processors

- [x] T037 [P] [CORE] Unit test for `ReportExportProcessor` in `tests/unit/reports/report-export.processor.spec.ts` — handles job data, calls generator + storage, emits Socket.IO event
- [x] T038 [P] [CORE] Unit test for `ReportCleanupProcessor` in `tests/unit/reports/report-cleanup.processor.spec.ts` — finds expired records, deletes from MinIO + DB
- [x] T039 [P] [CORE] Unit test for `ReportScheduleProcessor` in `tests/unit/reports/report-schedule.processor.spec.ts` — loads definition, creates execution, triggers export

### Implementation for Job Processors

- [x] T040 [P] [CORE] Create `ReportExportProcessor` in `apps/api/src/modules/reports/jobs/report-export.processor.ts` — BullMQ consumer: receives export job, queries data, generates file (PDF/Excel/CSV), uploads to MinIO, records in report_history, emits `report.completed` via Socket.IO
- [x] T041 [P] [CORE] Create `ReportCleanupProcessor` in `apps/api/src/modules/reports/jobs/report-cleanup.processor.ts` — BullMQ consumer: queries report_history WHERE expiresAt < now(), deletes from MinIO, removes records
- [x] T042 [P] [CORE] Create `ReportScheduleProcessor` in `apps/api/src/modules/reports/jobs/report-schedule.processor.ts` — BullMQ consumer: loads report definition, creates execution record, delegates to export flow

**Checkpoint**: All background jobs ready — exports, cleanup, and scheduled generation processed asynchronously.

---

## Phase 8: Core Engine — Infrastructure Layer (Controller, Gateway, DTOs, Repository, Module)

**Purpose**: Wire everything together — HTTP controller, Socket.IO gateway, DTOs, Prisma repository, NestJS module.

### Tests for Infrastructure

- [x] T043 [P] [CORE] Contract test for dashboard endpoints in `tests/contract/reports/dashboard.spec.ts` — GET /dashboard/summary, GET /dashboard/sales-trend, GET /dashboard/top-products, GET /dashboard/low-stock
- [x] T044 [P] [CORE] Contract test for widgets CRUD in `tests/contract/reports/widgets.spec.ts` — POST/PATCH/DELETE/GET/PUT widgets/reorder
- [x] T045 [P] [CORE] Contract test for export endpoints in `tests/contract/reports/exports.spec.ts` — POST /exports/request, GET /exports/:taskId/status
- [x] T046 [P] [CORE] Contract test for report history in `tests/contract/reports/history.spec.ts` — GET /history, GET /history/:id/download, DELETE /history/:id
- [x] T047 [P] [CORE] Contract test for report definitions in `tests/contract/reports/definitions.spec.ts` — CRUD /definitions, POST /definitions/:id/execute, GET /definitions/:id/executions
- [x] T048 [P] [CORE] Integration test for full export flow in `tests/integration/reports/export-flow.spec.ts` — request export → queue → process → store → notify → download

### Implementation for Infrastructure

- [x] T049 [P] [CORE] Create `PrismaReportsRepository` in `apps/api/src/modules/reports/infrastructure/prisma-reports.repository.ts` — implements ReportRepository with Prisma for all report models
- [x] T050 [P] [CORE] Create DTOs in `apps/api/src/modules/reports/infrastructure/dto/`:
  - `create-report-definition.dto.ts` — name, type, config, format, schedule, recipients
  - `update-report-definition.dto.ts` — partial update DTO
  - `request-export.dto.ts` — reportType, format, dateFrom, dateTo, filters
  - `create-widget.dto.ts` — type, config, positionX, positionY, width, height
  - `update-widget.dto.ts` — partial update DTO
  - `report-query.dto.ts` — dateFrom, dateTo, clientId, productId, vendorId, warehouseId, paymentMethodId
- [x] T051 [CORE] Create `ReportsController` in `apps/api/src/modules/reports/infrastructure/reports.controller.ts` with all endpoints:
  - Dashboard: GET /dashboard/summary, GET /dashboard/sales-trend, GET /dashboard/top-products, GET /dashboard/low-stock
  - Widgets: CRUD + PUT /widgets/reorder
  - Exports: POST /exports/request, GET /exports/:taskId/status
  - History: GET /history, GET /history/:id/download, DELETE /history/:id
  - Definitions: CRUD + POST /definitions/:id/execute, GET /definitions/:id/executions
  - All endpoints with `@UseGuards(JwtAuthGuard, RbacGuard)` + `@RequirePermission()`
- [x] T052 [CORE] Create `ReportGateway` in `apps/api/src/modules/reports/infrastructure/report-gateway.ts` — extends existing MainGateway pattern, exposes helper methods `emitReportProcessing()`, `emitReportCompleted()`, `emitReportFailed()` using `MainGateway.emitToTenant()`
- [x] T053 [CORE] Wire `ReportsModule` in `apps/api/src/modules/reports/infrastructure/reports.module.ts` — register Bull queues (export, cleanup, schedule), providers (all services, repository, generators, storage, processors, gateway), controller, and exports

**Checkpoint**: Core engine complete — all endpoints exposed, background jobs wired, real-time notifications flowing.

---

## Phase 9: User Story 1 — Dashboard Ejecutivo (P1) 🎯 MVP

**Goal**: Usuario ve dashboard con indicadores clave (ventas del día, inventario bajo, movimientos de caja, clientes nuevos).

**Independent Test**: Ver KPIs del dashboard → verificar ventas hoy, total facturado mes, productos bajos en stock. Crear widget → verificar que aparece en GET /widgets. Eliminar widget → verificar que no aparece.

- [x] T054 [P] [US1] Unit test for DashboardWidget CRUD in service in `tests/unit/reports/dashboard.service.spec.ts`
- [x] T055 [P] [US1] Contract test for full dashboard flow in `tests/contract/reports/dashboard.spec.ts`
- [x] T056 [US1] Integration test for dashboard live queries (< 2s response time) in `tests/integration/reports/dashboard-performance.spec.ts`

**Checkpoint**: US1 fully functional — dashboard KPIs, trends, top products, low stock, and widget management working.

---

## Phase 10: User Story 2-6 — Exportable Reports (P1) 🎯 MVP

**Goal**: Usuario genera reportes de ventas, inventario, caja, clientes e impuestos en PDF, Excel y CSV con filtros por fecha.

**Independent Test**: Solicitar exportación de ventas en PDF → verificar taskId → consultar estado hasta completed → descargar archivo → verificar PDF válido (> 1KB). Repetir para Excel y CSV con cada tipo de reporte.

### Tests for User Stories 2-6

- [x] T057 [P] [US2] Contract test for sales report export in `tests/contract/reports/sales-export.spec.ts` — POST /exports/request with reportType=SALES, all formats
- [x] T058 [P] [US3] Contract test for inventory report export in `tests/contract/reports/inventory-export.spec.ts` — POST /exports/request with reportType=INVENTORY
- [x] T059 [P] [US4] Contract test for cash report export in `tests/contract/reports/cash-export.spec.ts` — POST /exports/request with reportType=CASH
- [x] T060 [P] [US5] Contract test for clients report export in `tests/contract/reports/clients-export.spec.ts` — POST /exports/request with reportType=CLIENTS
- [x] T061 [P] [US6] Contract test for taxes report export in `tests/contract/reports/taxes-export.spec.ts` — POST /exports/request with reportType=TAXES
- [x] T062 [P] [US2] Integration test for multi-format export flow (PDF/XLSX/CSV) in `tests/integration/reports/multi-format-export.spec.ts`
- [x] T063 [P] [US3] Integration test for report-history lifecycle (create → complete → download → expire → cleanup) in `tests/integration/reports/history-lifecycle.spec.ts`

### Implementation for User Stories 2-6

- [x] T064 [US2] Wire and validate sales report query in `DashboardService` (aggregate from sales documents + document_lines) in `apps/api/src/modules/reports/application/dashboard.service.ts`
- [x] T065 [US3] Wire and validate inventory report query in `DashboardService` (stock by warehouse, low-stock threshold, movements) in `apps/api/src/modules/reports/application/dashboard.service.ts`
- [x] T066 [US4] Wire and validate cash report query in `DashboardService` (cash movements by register, method, period) in `apps/api/src/modules/reports/application/dashboard.service.ts`
- [x] T067 [US5] Wire and validate clients report query in `DashboardService` (client purchase totals, top N, last purchase) in `apps/api/src/modules/reports/application/dashboard.service.ts`
- [x] T068 [US6] Wire and validate taxes report query in `DashboardService` (IVA collected/paid, debit/credit fiscal) in `apps/api/src/modules/reports/application/dashboard.service.ts`

**Checkpoint**: US2-6 fully functional — all 5 report types exportable in all 3 formats with history tracking.

---

## Phase 11: User Story 7 — Reportes Programados (P2)

**Goal**: Usuario administrador programa reportes periódicos que se generan automáticamente y quedan disponibles en el historial.

**Independent Test**: Crear definición con schedule semanal → verificar que aparece activa. Ejecutar manualmente POST /definitions/:id/execute → verificar execution creada con status completado. Deshabilitar → verificar que no se programa.

### Tests for User Story 7

- [x] T069 [P] [US7] Unit test for ReportSchedulerService (register repeatable job from definition, cancel on delete) in `tests/unit/reports/report-scheduler.service.spec.ts`
- [x] T070 [P] [US7] Contract test for definition lifecycle (CRUD + execute + executions list) in `tests/contract/reports/definitions.spec.ts`
- [x] T071 [P] [US7] Integration test for scheduled report execution (cron trigger → queue → generate → history) in `tests/integration/reports/scheduled-execution.spec.ts`
- [x] T072 [P] [US7] Integration test for report cleanup (48h expiry → cleanup → file deleted from MinIO) in `tests/integration/reports/cleanup-expiry.spec.ts`

### Implementation for User Story 7

- [x] T073 [US7] Wire ReportSchedulerService lifecycle hooks in ReportsModule (onModuleInit: load enabled definitions and register repeatable jobs; onModuleDestroy: cancel all) in `apps/api/src/modules/reports/infrastructure/reports.module.ts`
- [x] T074 [US7] Wire ReportCleanupService as a cron-based BullMQ repeatable job (daily at 3:00 AM) in `apps/api/src/modules/reports/infrastructure/reports.module.ts`

**Checkpoint**: US7 fully functional — scheduled report definitions, automatic execution, email-ready history, and nightly cleanup working.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: RBAC guards, permission scoping, full validation, and test suite.

- [x] T075 [P] Add `@RequirePermission()` decorators to ALL controller endpoints with appropriate report permissions (e.g., `reports.dashboard.view`, `reports.export.request`, `reports.definitions.manage`) in `apps/api/src/modules/reports/infrastructure/reports.controller.ts`
- [x] T076 [P] Scrape dashboard live queries to filter by tenantId and user's enabled modules (skip data from modules user cannot access) in `apps/api/src/modules/reports/application/dashboard.service.ts`
- [x] T077 [P] Add warning for date ranges > 1 year in export requests (return warning in response) in `apps/api/src/modules/reports/application/report-export.service.ts`
- [x] T078 [P] Run `npm run prisma:migrate` and verify migration applies cleanly in `apps/api/`
- [x] T079 Run full test suite: `cd apps/api && npx jest --testPathPattern='tests/unit' --testPathPattern='reports'` and fix failures
- [x] T080 Run contract tests: `npx jest --testPathPattern='tests/contract' --testPathPattern='reports'` and fix failures
- [x] T081 Run integration tests: `npx jest --testPathPattern='tests/integration' --testPathPattern='reports'` and fix failures
- [x] T082 Run `quickstart.md` validation scenarios (all 10 scenarios) in `specs/004-a-reportes/quickstart.md`
- [x] T083 Code cleanup and final review

**Checkpoint**: All features complete, tested, and validated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all phases
- **Core Engine (Phases 3-8)**: Depends on Foundational — foundation for all user stories
  - Domain (Phase 3): No other dependencies
  - Generators & Storage (Phase 4): No other dependencies
  - Templates (Phase 5): No other dependencies
  - Application Services (Phase 6): Depends on Domain (Phase 3)
  - Job Processors (Phase 7): Depends on Generators & Storage (Phase 4), Application Services (Phase 6)
  - Infrastructure (Phase 8): Depends on all Core Engine phases (3-7)
- **US1 (Phase 9)**: Depends on Core Engine complete
- **US2-6 (Phase 10)**: Depends on Core Engine complete
- **US7 (Phase 11)**: Depends on Core Engine complete, US2-6 (needs exportable reports)
- **Polish (Phase 12)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can start after Phase 8
- **US2-6 (P1)**: No dependencies on each other — can all be implemented in parallel after Phase 8
- **US7 (P2)**: Requires US2-6 (scheduled reports work on existing report types)

### Within Each Layer/Phase

- Tests MUST be written and FAIL before implementation (TDD per Constitution Principle III)
- Domain entities before use cases
- Use cases before controllers
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Phase 3-5 (Domain, Generators, Templates) can all run in PARALLEL after Phase 2
- Phase 6 (Application Services) depends on Phase 3 (Domain)
- Phase 7 (Job Processors) depends on Phase 4 (Generators) and Phase 6 (Services)
- All implementation tasks within a phase marked [P] can run in parallel
- US2-6 contract tests can all run in PARALLEL
- Different files within a phase marked [P] can run in parallel

---

## Parallel Task Groups

```bash
# Launch Phase 1 setup tasks together:
Task: "T001 — Add enums to schema.prisma"
Task: "T002 — Add models to schema.prisma"
Task: "T003 — MinIO in docker-compose.yml"
Task: "T004 — Install NPM dependencies"
Task: "T005 — Create BullModule config"
Task: "T006 — Create migration"

# Launch Phase 3-5 (Domain + Generators + Storage + Templates) together:
Task: "T009 — Unit test Report entity"
Task: "T010 — Unit test DashboardWidget entity"
Task: "T011 — Create Report entity"
Task: "T012 — Create DashboardWidget entity"
Task: "T013 — Create ReportRepository interface"
Task: "T014 — Unit test PdfGeneratorService"
Task: "T015 — Unit test ExcelGeneratorService"
Task: "T016 — Unit test CsvGeneratorService"
Task: "T017 — Unit test MinioStorageService"
Task: "T018 — Create PdfGeneratorService"
Task: "T019 — Create ExcelGeneratorService"
Task: "T020 — Create CsvGeneratorService"
Task: "T021 — Create MinioStorageService"
Task: "T022 — Create sales-report.hbs template"
Task: "T023 — Create inventory-report.hbs template"
Task: "T024 — Create cash-report.hbs template"
Task: "T025 — Create clients-report.hbs template"
Task: "T026 — Create taxes-report.hbs template"

# Launch Phase 6-8 (Services + Jobs + Controller) sequentially within each, but parallel groups:
Task: "T027-T031 — Unit tests for all application services"
Task: "T032-T036 — Create all application services"
Task: "T037-T039 — Unit tests for all job processors"
Task: "T040-T042 — Create all job processors"
Task: "T043-T048 — Contract + integration tests for infrastructure"
Task: "T049-T053 — Create repository, DTOs, controller, gateway, module"
```

---

## Implementation Strategy

### MVP First (US1 + US2-6)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phases 3-8: Core Engine (domain, generators, storage, templates, services, jobs, controller)
4. **STOP and VALIDATE**: Core engine working — basic dashboard requests and export flow functional
5. Complete US1 (Phase 9): Dashboard Ejecutivo
6. Complete US2-6 (Phase 10): Exportable Reports
7. **MVP DEPLOY**: Dashboard KPIs + all 5 report types exportable in 3 formats

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Core Engine (generators, storage, services, jobs) → Engine ready
3. Add US1 (Dashboard) → **MVP 1** (dashboard KPIs + widgets)
4. Add US2-6 (Exportable reports) → **MVP 2** (full reporting with exports)
5. Add US7 (Scheduled reports) → Deploy (automation)
6. Polish + RBAC + Performance validation → Production ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Phase 1 + Phase 2 together
2. Once Phase 2 is done:
   - Developer A: Domain + Repository Interface (Phase 3)
   - Developer B: Generators + Storage (Phase 4)
   - Developer C: Templates (Phase 5)
3. After Phases 3-5:
   - Developer A: Application Services (Phase 6)
   - Developer B: Job Processors (Phase 7)
   - Developer C: Infrastructure — DTOs, Controller, Gateway, Module (Phase 8)
4. After Core Engine complete:
   - Developer A: US1 Dashboard (Phase 9)
   - Developer B: US2-6 Exportable Reports (Phase 10)
   - Developer C: US7 Scheduled Reports (Phase 11)
5. Together: Phase 12 Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [CORE] labels map tasks to shared reports engine (not user-story-specific)
- [US1-7] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable
- Write tests first (RED), then implement (GREEN), then refactor per Constitution Principle III
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Files follow hexagonal architecture: `domain/` (entities, interfaces), `application/` (use cases), `infrastructure/` (controllers, DTOs, Prisma adapters, module, generators, storage, templates), `jobs/` (BullMQ processors)
- Use DI string token `REPORTS_REPOSITORY` consistent with 001-core-foundations pattern
- All endpoints must have `@UseGuards(JwtAuthGuard, RbacGuard)` + `@RequirePermission()`
- Dashboard live queries use raw SQL or Prisma aggregation for performance (< 2s target)
- Export flow: REST request → BullMQ queue → Processor (query + generate + upload to MinIO + record history) → Socket.IO notification → client downloads
- History cleanup runs daily at 3:00 AM via repeatable BullMQ job
- MinIO bucket name: `reports-{tenantId}` — one bucket per tenant for isolation
- Templates use `{{{body}}}` triple-stash in Handlebars to render raw HTML tables safely
