# Plan: Reportes ERP

## Technical Context

### Stack
- **Backend**: NestJS 11 + TypeScript 5.x — hexagonal architecture (domain/application/infrastructure)
- **ORM**: Prisma v6.19.3 with PostgreSQL 16
- **Queue**: @nestjs/bull (BullMQ) with Redis
- **Storage**: MinIO (S3-compatible) via `minio` npm package
- **PDF**: Puppeteer (HTML→PDF via Handlebars templates)
- **Excel**: ExcelJS
- **Real-time**: Socket.IO (already in project)
- **Schedule**: BullMQ repeatable jobs (cron)

### Module Structure
```
src/modules/reports/
├── domain/
│   ├── report.entity.ts
│   ├── dashboard-widget.entity.ts
│   └── report.repository.interface.ts
├── application/
│   ├── dashboard.service.ts
│   ├── report-export.service.ts
│   ├── report-definition.service.ts
│   ├── report-scheduler.service.ts
│   └── report-cleanup.service.ts
├── infrastructure/
│   ├── reports.controller.ts
│   ├── prisma-reports.repository.ts
│   ├── dto/
│   │   ├── create-report-definition.dto.ts
│   │   ├── request-export.dto.ts
│   │   ├── create-widget.dto.ts
│   │   └── report-query.dto.ts
│   ├── templates/
│   │   ├── sales-report.hbs
│   │   ├── inventory-report.hbs
│   │   ├── cash-report.hbs
│   │   ├── clients-report.hbs
│   │   └── taxes-report.hbs
│   ├── minio-storage.service.ts
│   ├── pdf-generator.service.ts
│   ├── excel-generator.service.ts
│   ├── csv-generator.service.ts
│   ├── report-gateway.ts (Socket.IO)
│   └── reports.module.ts
├── jobs/
│   ├── report-export.processor.ts (BullMQ consumer)
│   ├── report-cleanup.processor.ts
│   └── report-schedule.processor.ts
```

### Database Changes
- 4 nuevas tablas: `report_definitions`, `report_executions`, `report_history`, `dashboard_widgets`
- 3 nuevos enums: `ReportType`, `ReportFormat`, `ReportExecutionStatus`

### Docker Changes
- Nuevo servicio `minio` en docker-compose.yml
- Variables de entorno en `.env` y `apps/api/.env`

## Constitution Check

| Principio | Verificación | Estado |
|-----------|-------------|--------|
| I. Domain-Driven Modules | Reports module autocontenido con domain/application/infrastructure | Alineado |
| II. Document-Driven State | Reportes leen datos de documentos, no los modifican | Alineado |
| III. Test-First & Data Integrity | TDD obligatorio, cleanup nocturno de archivos | Alineado |
| IV. Localization & Multi-Currency | Reportes multi-moneda usando tasas históricas | Alineado |
| V. Multi-Tenant Isolation | Todos los reportes scoped por tenant | Alineado |
| VI. i18n — Multi-Language | Templates de reportes en ES/EN según locale del usuario | Alineado |

**Resultado**: GATE PASSED

## Entregables

| Artifact | Path | Estado |
|----------|------|--------|
| Spec | specs/004-a-reportes/spec.md | ✅ |
| Research | specs/004-a-reportes/research.md | ✅ |
| Data Model | specs/004-a-reportes/data-model.md | ✅ |
| Contracts | specs/004-a-reportes/contracts/rest-api.md | ✅ |
| Quickstart | specs/004-a-reportes/quickstart.md | ✅ |
| Tasks | specs/004-a-reportes/tasks.md | Pendiente |
