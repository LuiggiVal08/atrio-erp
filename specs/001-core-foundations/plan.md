# Implementation Plan: Core Foundations (Multi-Tenant, Auth, RBAC)

**Branch**: `001-core-foundations` | **Date**: 2026-06-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-core-foundations/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Diseñar e implementar el núcleo base de Atrio ERP: sistema Multi-Tenant con
aislamiento completo de datos por compañía, autenticación segura por email +
contraseña, RBAC granular por módulo/acción, y separación conceptual de
Usuarios (identidad digital) vs Empleados (registro laboral), todo conforme a
la Constitución v1.1.0.

Extensión frontend: arquitectura React + Zustand (estado global) + TanStack
Query (server state) + Axios interceptor (X-Tenant-ID automático) +
estructura Domain-Driven Modules + tema Premium Dark (#1b1b1b).

## Technical Context

**Language/Version**: TypeScript 5.x + Node.js 22 LTS (NestJS 11)

**Primary Dependencies**:
- Framework: `@nestjs/core`, `@nestjs/common`, `@nestjs/swagger`
- ORM: `prisma` + `@prisma/client` (type-safe, migraciones)
- Auth: `@nestjs/passport`, `passport-jwt`, `bcrypt`
- RBAC: Guards personalizados NestJS + patrones CASL
- Validación: `class-validator`, `class-transformer`
- Testing: `jest`, `supertest`, `playwright`
- Cache + Rate Limit + JWT Blacklist: `redis` + `@nestjs/bull` (opcional)

**Infrastructure Dependencies**:
- **Redis 7**: Caché de config tenant, rate-limiting (IP/Tenant), JWT blacklist
- **pgBouncer**: Pool de conexiones PostgreSQL (modo transaccional)
- **Docker Compose**: Orquestación local (postgres:16, redis:7, pgbouncer)

**Real-Time (WebSockets)**:
- `@nestjs/websockets` + `socket.io`: Comunicación bidireccional
- `@socket.io/redis-adapter`: Escalado horizontal multi-instancia
- Canales por tenant (`tenant:{id}:*`) + canal privado por usuario (`user:{id}:private`)

**Audit Trail**:
- Tabla `audit_log` en PostgreSQL (solo INSERT, inmutable por RLS)
- Interceptor NestJS captura `before`/`after` state + contexto de usuario
- Índices por tenant+timestamp, entity, user

**Storage**: PostgreSQL 16 + pgBouncer (pool de conexiones)

**Testing**: Jest (unit), Supertest (integration/contract), Playwright (E2E)

**Target Platform**: Linux server (Docker + WSL2 para desarrollo, VPS para
producción — según Constitución v1.1.0, Principio V).

**Project Type**: web-service (API RESTful + WebSocket SaaS backend multi-tenant)

**Performance Goals**:
- Login < 2s p95 (SC-002)
- Soporte 100+ tenants concurrentes sin degradación (SC-005)
- Verificación RBAC en < 50ms por operación
- Verificación JWT blacklist en < 5ms (Redis EXISTS)
- Rate limiting overhead < 2ms por request

**Constraints**:
- Aislamiento multi-tenant en cada operación (FR-002, Principio V)
- Encriptación AES-256 en reposo, TLS 1.3 en tránsito (Constitución)
- RBAC obligatorio en cada punto de entrada (FR-007, FR-008)
- Auditoría immutable de todas las mutaciones (FR-011, Principio III)
- Separación User ≠ Employee (FR-009, FR-010, Constitución Security)
- Soft deletes para Tenant, User, Employee (Principio III)
- Backward-compatible schema migrations (Development Workflow)
- JWT blacklist en Redis (no en DB) para verificación O(1)
- Rate limiting en dos capas: IP (global) + Tenant (por plan de suscripción)
- WebSocket solo lectura de eventos (las mutaciones siempre vía REST)

**Frontend**:
- **Framework**: React 19 + TypeScript + Vite + React Router v7
- **State (global)**: Zustand (sesión, tenant activo, preferencias UI)
- **State (server)**: TanStack Query v5 (caché, fetching, mutaciones)
- **HTTP Client**: Axios con interceptor que adjunta automáticamente
  `X-Tenant-ID` (desde Zustand) y `Authorization: Bearer <token>`
- **Estilos**: Tailwind CSS 4 + tokens Premium Dark (#1b1b1b canvas base)
- **UI Components**: shadcn/ui personalizado con tema corporativo
- **Testing**: Vitest (unit) + Testing Library + Playwright (E2E)

**Scale/Scope**: Plataforma SaaS multi-tenant. Fase inicial: 100 tenants,
cientos de usuarios por tenant, millones de registros transaccionales futuros.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación | Estado |
|-----------|-------------|--------|
| I. Domain-Driven Modules | Core foundations deben ser modulares y extensibles para que futuros módulos dominio (facturación, inventario) se conecten como plug-ins | ✅ Sin violación |
| II. Document-Driven State | No aplica a esta capa base (auth/RBAC/tenants no son documentos de negocio). El diseño debe considerar eventos para auditoría | ✅ Sin violación |
| III. Test-First & Data Integrity | Spec incluye auditoría (FR-011), soft deletes, TDD obligatorio | ✅ Alineado |
| IV. Localization & Multi-Currency | No aplica al core foundations (vendrá en módulos de dominio) | ✅ Sin violación |
| V. Multi-Tenant Isolation | Esta feature ES la implementación del principio. Aislamiento por tenant en cada query, cache y evento | ✅ Alineado |
| Security & Compliance: RBAC | Spec define RBAC granular en FR-006, FR-007, FR-008 | ✅ Alineado |
| Security: User ≠ Employee | Spec define separación en FR-009, FR-010, US4 | ✅ Alineado |
| Development Workflow | PRs con tests, migrations backward-compatibles, changelog | ✅ Alineado |
| UI/UX Premium Dark | Frontend React con Tailwind, tokens basados en #1b1b1b, shadcn/ui | ✅ Alineado |

**Resultado**: GATE PASSED — sin violaciones. No se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-foundations/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Raíz — solo configuraciones globales
├── docker-compose.yml       # PostgreSQL 16 + pgBouncer + Redis 7
├── .gitignore               # Ignorados globales
├── .dockerignore            # Ignorados Docker
├── .prettierrc              # Formateo global
├── .env.example             # Variables de entorno (referencia)
└── AGENTS.md                # Contexto para agentes AI

# Backend — NestJS + Prisma + PostgreSQL
apps/
└── api/
    ├── src/                 # Código fuente backend
    │   ├── core/            #   Módulos de dominio
    │   │   ├── tenant/      #     Multi-tenant
    │   │   ├── auth/        #     Autenticación
    │   │   ├── rbac/        #     Roles y permisos
    │   │   ├── user/        #     Usuarios (identidad digital)
    │   │   ├── employee/    #     Empleados (registro laboral)
    │   │   └── audit/       #     Auditoría immutable
    │   ├── infrastructure/  #   Infraestructura
    │   │   ├── redis/       #     Redis client, rate-limit, JWT blacklist
    │   │   ├── websocket/   #     Gateways Socket.IO
    │   │   └── database/    #     Prisma service
    │   ├── common/          #   Utilidades compartidas
    │   └── api/             #   API REST endpoints
    ├── prisma/              #   Schema + migraciones
    ├── tests/               #   Tests (unit, contract, integration)
    ├── test/                #   Config E2E (jest-e2e.json)
    ├── package.json
    ├── tsconfig.json
    └── nest-cli.json

# Frontend — React + Vite + Zustand + TanStack Query
apps/
└── web/
    ├── src/
    │   ├── core/            #   Módulos de dominio (espejo backend)
    │   │   ├── auth/        #     Login, store, api, components, pages
    │   │   ├── tenant/      #     Gestión multi-tenant
    │   │   ├── rbac/        #     Roles y permisos
    │   │   ├── users/       #     Usuarios
    │   │   └── employees/   #     Empleados
    │   ├── shared/          #   Capa compartida
    │   │   ├── ui/          #     Design system (shadcn/ui + Premium Dark)
    │   │   ├── lib/         #     Axios instance + interceptors + utils
    │   │   ├── hooks/       #     Hooks compartidos
    │   │   └── ws/          #     Socket.IO client + hooks
    │   ├── app/             #   Router, providers, App.tsx
    │   └── styles/          #   Tailwind globals + tokens Premium Dark
    ├── public/
    ├── tests/
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

**Structure Decision**: Monorepo con dos aplicaciones independientes dentro
de `apps/`: `apps/api` (backend NestJS) y `apps/web` (frontend React). La
raíz queda reservada exclusivamente para configuraciones globales (Docker,
git, formateo), especificaciones de SpecKit (`.specify/`, `specs/`), y
`AGENTS.md`. Ambas apps comparten la misma estructura de módulos de dominio
(tenant, auth, rbac, user, employee) para mantener consistencia
backend-frontend. El backend añade módulos de infraestructura
(`infrastructure/redis`, `infrastructure/websocket`, `infrastructure/database`).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Sin violaciones. No aplica.
