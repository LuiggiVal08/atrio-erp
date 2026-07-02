# Implementation Plan: Core Architecture & Domain Modules

**Branch**: `003-core-architecture` | **Date**: 2026-06-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-core-architecture/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implementar la arquitectura base del ERP: módulos de dominio multi-tenant (Sales, Inventory, Cash & Payments, Purchasing), tablas de datos maestros (productos, clientes, proveedores), Localization Engine (impuestos, tasas de cambio), Event Bus para impacto cross-module orquestado por el Document Engine (002), y el sistema de auditoría cross-cutting. Sigue los principios de la Constitución v1.2.0, en particular los Principios I (módulos desacoplados), II (event impact), IV (localización), y VI (i18n).

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 24 LTS (NestJS 11) — mismo stack del proyecto

**Primary Dependencies**:
- Framework: `@nestjs/core`, `@nestjs/common`, `@nestjs/swagger` (existente)
- ORM: `prisma` + `@prisma/client` (existente)
- Validación: `class-validator`, `class-transformer` (existente)
- Eventos: `@nestjs/event-emitter` (existente desde 002)
- Testing: `jest`, `supertest` (existente)
- UI: React 19, Vite 6, Tailwind CSS 4, shadcn/ui (existente)

**Storage**: PostgreSQL 16 — tablas nuevas: `products`, `product_categories`, `warehouses`, `stock`, `stock_movements`, `clients`, `vendors`, `localization_taxes`, `currency_rates`, `cash_registers`, `payment_methods`, `cash_movements`, `sales_orders`, `sales_invoices`, `purchase_orders`, `audit_logs` + modificar `tenants` (add `enabled_modules`), `users` (add `locale`)

**Testing**: Jest (unit), Supertest (contract/integration)

**Target Platform**: Linux server (Docker + WSL2 para desarrollo, VPS para producción)

**Project Type**: web-service (módulo interno del backend ERP multi-tenant + frontend React)

**Performance Goals**:
- CRUD de maestros < 200ms p95
- Stock lookup por producto + almacén < 100ms p95
- Event Bus: emisión + consumo < 200ms p95 por evento
- Consultas de auditoría < 500ms p95 con filtros por tenant + fecha

**Constraints**:
- Toda mutación en datos core debe registrarse en `audit_logs` (Principio III)
- Soft-delete obligatorio en productos, clientes, proveedores (Principio III)
- Módulos desactivados por tenant → HTTP 403 (Principio I + V)
- Document Engine es la única fuente de verdad para transacciones (Principio II)
- Los eventos de dominio deben persistirse para replay en caso de fallo
- i18n keys externalizadas, sin strings hardcodeadas en UI (Principio VI)
- Tasas de cambio fijadas históricamente al aprobar documento (Principio IV)

**Scale/Scope**: Plataforma SaaS multi-tenant. Fase inicial: datos maestros + integración con Document Engine para ventas y compras.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación | Estado |
|-----------|-------------|--------|
| I. Domain-Driven Modules | Cada módulo (Inventory, Sales, Cash, Purchasing, Localization) es un módulo NestJS autocontenido con sus modelos, servicios y controladores. Comunicación vía Event Bus, no DB compartida | Alineado |
| II. Document-Driven State & Event Impact | Este spec implementa los consumidores de eventos del Document Engine (Inventory descuenta stock al aprobar, Cash registra movimiento al pagar). El motor de documentos sigue siendo la única fuente de verdad transaccional | Alineado |
| III. Test-First & Data Integrity | TDD obligatorio, auditoría en cada mutación, soft-deletes | Alineado |
| IV. Localization & Multi-Currency | Localization Engine gestiona impuestos y tasas de cambio. Tasas fijadas históricamente al momento de aprobación del documento | Alineado |
| V. Multi-Tenant Isolation | Todos los módulos scoped por tenant. Módulos desactivados por tenant devuelven 403 | Alineado |
| VI. i18n — Multi-Language | `users.locale`, JWT incluye locale, frontend consume archivos JSON key-based | Alineado |
| Security: RBAC | Todos los endpoints protegidos con `@UseGuards(JwtAuthGuard, RbacGuard)` + `@RequirePermission()` | Alineado |
| Security: User ≠ Employee | Clientes y proveedores son entidades separadas de Users/Employees | Alineado |
| Development Workflow | PRs con tests, migraciones backward-compatibles | Alineado |

**Resultado**: GATE PASSED — sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-core-architecture/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── rest-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
apps/api/src/
├── modules/
│   ├── inventory/                      # NUEVO: productos, categorías, almacenes, stock
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── client-vendor/                  # NUEVO: clientes y proveedores
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── localization/                   # NUEVO: impuestos, tasas de cambio
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── cash-payments/                  # NUEVO: cajas, métodos de pago, movimientos
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── sales/                          # NUEVO: órdenes de venta, facturación
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── purchasing/                     # NUEVO: órdenes de compra, recepción
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── document-engine/                # EXISTENTE — se expande con eventos de dominio
│   └── ... (auth, rbac, tenant, user, employee — existentes)
├── common/
│   ├── guards/                         # NUEVO: ModuleEnabledGuard
│   └── audit/                          # EXISTENTE: audit interceptor
└── ...

apps/web/src/
├── i18n/                               # NUEVO: archivos de traducción
│   ├── es.json
│   └── en.json
├── modules/                            # NUEVO: feature modules
│   ├── inventory/
│   ├── sales/
│   ├── cash-payments/
│   └── purchasing/
└── ... (core, shared — existentes)

prisma/
├── schema.prisma                       # MODIFICADO: nuevas tablas + campos
└── migrations/
    └── 20260620000000_add_core_architecture/
        └── migration.sql               # NUEVO

tests/
├── unit/                               # NUEVOS: tests por módulo
│   ├── inventory/
│   ├── client-vendor/
│   ├── localization/
│   ├── cash-payments/
│   ├── sales/
│   └── purchasing/
├── contract/                           # NUEVOS: tests de contrato
└── integration/                        # NUEVOS: tests de integración
```

**Structure Decision**: Se adopta la misma arquitectura hexagonal (Puertos y Adaptadores) de 001 y 002. Cada módulo nuevo sigue el patrón `domain/application/infrastructure`. Los módulos se comunican exclusivamente vía el Event Bus del Document Engine.

## Complexity Tracking

Sin violaciones constitucionales. No aplica.
