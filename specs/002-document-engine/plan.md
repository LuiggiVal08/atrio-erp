# Implementation Plan: Document Engine

**Branch**: `002-document-engine` | **Date**: 2026-06-19 | **Spec**: [spec.md](spec.md) | **Status**: ✅ Implemented (v1.0.0)

**Input**: Feature specification from `specs/002-document-engine/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implementar el Document Engine, módulo que gestiona el ciclo de vida completo de documentos empresariales (Facturas, Órdenes, Notas de Crédito/Débito, etc.) con máquina de estados transicionales (Borrador → Pendiente Aprobación → Aprobado → Entregado/Pagado/Anulado), inmutabilidad post-aprobación, contra-documentos para correcciones y emisión de eventos de dominio para reacciones cross-module (Inventario, Contabilidad, Flujo de Caja). Sigue los principios de la Constitución v1.1.0, en particular el Principio II (Document-Driven State & Immutability).

**✅ Implementación completa (v1.0.0)**: Los 45 tasks han sido implementados. 88 tests unitarios pasan (20 suites). 1 suite de tests de contrato (11 endpoints con verificación de RBAC). 1 test E2E con patrón `describeIf` (ciclo de vida completo). Interceptor de auditoría no-bloqueante vía RxJS `tap`. Migración Prisma con trigger de inmutabilidad a nivel PostgreSQL.

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 22 LTS (NestJS 11) — mismo stack del proyecto

**Primary Dependencies**:
- Framework: `@nestjs/core`, `@nestjs/common`, `@nestjs/swagger` (existente)
- ORM: `prisma` + `@prisma/client` (existente)
- State Machine: Propia — tabla de transiciones configurable (`DocumentStateMachine`) sin librería externa
- Validación: `class-validator`, `class-transformer` (existente)
- Testing: `jest`, `supertest` (existente)
- Eventos: `@nestjs/event-emitter` (añadido) — bus in-process con persistencia en `document_events`

**Storage**: PostgreSQL 16 — tablas: `documents`, `document_lines`, `document_state_machine`, `document_events`

**Testing**: Jest (unit), Supertest (contract/integration)

**Target Platform**: Linux server (Docker + WSL2 para desarrollo, VPS para producción)

**Project Type**: web-service (módulo interno del backend SaaS multi-tenant)

**Performance Goals**:
- Transición de estado < 500ms p95 (incluyendo emisión de eventos)
- Consulta de documentos por tenant + filtros < 200ms p95
- Soporte para 10,000+ documentos por tenant sin degradación
- Emisión de eventos < 100ms desde la transición

**Constraints**:
- Inmutabilidad total post-aprobación: una vez "Approved", ningún campo puede modificarse
- Atomicidad en transiciones: rollback completo si falla cualquier paso (cambio de estado + evento + auditoría)
- Aislamiento multi-tenant en cada operación (Constitución Principio V)
- Auditoría obligatoria de cada transición (Constitución Principio III)
- RBAC obligatorio para cada acción de transición (solo roles autorizados pueden aprobar/anular)
- Eventos de dominio deben ser emitidos y persistidos para consumidores asíncronos
- Las transiciones inválidas deben ser rechazadas en el dominio, no solo en la UI

**Scale/Scope**: Plataforma SaaS multi-tenant. Fase inicial: módulo Document Engine como base para todos los documentos transaccionales del ERP.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación | Estado |
|-----------|-------------|--------|
| I. Domain-Driven Modules | Document Engine es un módulo de dominio autocontenido con sus propios modelos, reglas de negocio y esquema de datos | Sin violación |
| II. Document-Driven State & Immutability | Esta feature ES la implementación del principio. Máquina de estados, inmutabilidad post-aprobación, contra-documentos | Alineado |
| III. Test-First & Data Integrity | TDD obligatorio, auditoría en cada transición, soft deletes para borrado de documentos | Alineado |
| IV. Localization & Multi-Currency | Los montos de documentos usarán el motor de moneda local, pero el Document Engine no gestiona conversiones FX directamente | Sin violación |
| V. Multi-Tenant Isolation | Cada documento está estrictamente scoped al tenant autenticado | Alineado |
| Security: RBAC | Control granular de permisos para cada transición de estado | Alineado |
| Security: User ≠ Employee | Documentos referencian usuarios (acción) y empleados (responsable), manteniendo la separación | Sin violación |
| Development Workflow | PRs con tests, migraciones backward-compatibles, changelog | Alineado |
| UI/UX Premium Dark | UI de documentos seguirá tema Premium Dark existente | Sin violación directa |

**Resultado**: GATE PASSED — sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-document-engine/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── rest-api.md
│   └── events.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root) — ✅ Implemented

```text
apps/
└── api/
    ├── prisma/
    │   ├── schema.prisma                     # Document enums + models (Document, DocumentLine, DocumentEvent)
    │   └── migrations/
    │       └── 20260619000000_add_document_engine/
    │           └── migration.sql             # Initial schema: enums, tables, indexes, FKs, immutability trigger
    └── src/
        └── modules/
            └── document-engine/
                ├── domain/
                │   ├── document.entity.ts
                │   ├── document-line.entity.ts
                │   ├── document-state-machine.ts
                │   ├── document.repository.interface.ts
                │   ├── document-event.entity.ts
                │   └── document-event.repository.interface.ts
                ├── application/
                │   ├── create-document.use-case.ts
                │   ├── submit-document.use-case.ts
                │   ├── approve-document.use-case.ts
                │   ├── reject-document.use-case.ts
                │   ├── transition-document.use-case.ts
                │   ├── create-counter-document.use-case.ts
                │   └── query-document.use-case.ts
                └── infrastructure/
                    ├── document.controller.ts
                    ├── document.module.ts
                    ├── dto/
                    │   ├── create-document.dto.ts
                    │   ├── update-document.dto.ts
                    │   ├── transition-document.dto.ts
                    │   ├── query-document.dto.ts
                    │   └── counter-document.dto.ts
                    ├── prisma-document.repository.ts
                    ├── prisma-document-event.repository.ts
                    ├── document-event-emitter.ts
                    └── document-audit.interceptor.ts

tests/
├── unit/document-engine/
│   ├── document-state-machine.spec.ts
│   ├── create-document.use-case.spec.ts
│   ├── submit-document.use-case.spec.ts
│   ├── approve-document.use-case.spec.ts
│   ├── reject-document.use-case.spec.ts
│   ├── transition-document.use-case.spec.ts
│   ├── create-counter-document.use-case.spec.ts
│   ├── query-document.use-case.spec.ts
│   ├── document-event-emitter.spec.ts
│   └── document-audit.interceptor.spec.ts
├── contract/document-engine/
│   └── documents.spec.ts
└── (E2E)
    └── document-engine.e2e-spec.ts           # Conditional describeIf pattern
```

**Structure Decision**: Se adopta la misma arquitectura hexagonal (Puertos y Adaptadores) establecida en `001-core-foundations`, con el módulo `document-engine` dentro de `apps/api/src/modules/`. Las pruebas unitarias se colocan en `tests/unit/document-engine/`, las de contrato en `tests/contract/document-engine/` y las de integración en `tests/integration/document-engine/`.

## Complexity Tracking

Sin violaciones constitucionales. No aplica.
