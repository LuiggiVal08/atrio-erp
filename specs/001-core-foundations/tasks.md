# Tasks: Core Foundations (Multi-Tenant, Auth, RBAC)

**Input**: Design documents from `/specs/001-core-foundations/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included per Constitution v1.1.0 (TDD mandatory) — write tests before implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — scaffold both backend and frontend, configure infrastructure.

- [X] T001 Create backend NestJS project in `apps/api/src/` with `pnpm`, TypeScript, and core dependencies
- [X] T002 [P] Create frontend React + Vite project in `apps/web/` with TypeScript
- [X] T003 Create `docker-compose.yml` with PostgreSQL 16, Redis 7, and pgBouncer services
- [X] T004 [P] Configure ESLint + Prettier for `apps/api/src/` and `apps/web/`
- [X] T005 [P] Create `.env.example` with all required environment variables (DB, Redis, JWT secret)
- [X] T006 Create `apps/api/prisma/schema.prisma` with all entities: Tenant, User, Employee, Role, Permission, RolePermission, UserRole, AuditLog

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can begin.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 [P] Implement PrismaService in `apps/api/src/infrastructure/database/prisma.service.ts`
- [X] T008 [P] Implement Redis client module in `apps/api/src/infrastructure/redis/redis.module.ts`
- [X] T009 [P] Implement tenant-scope middleware in `apps/api/src/common/middleware/tenant-scope.middleware.ts`
- [X] T010 [P] Implement JWT authentication strategy in `apps/api/src/common/auth/jwt.strategy.ts`
- [X] T011 [P] Implement global auth guard in `apps/api/src/common/auth/jwt-auth.guard.ts`
- [X] T012 [P] Implement global audit interceptor in `apps/api/src/core/audit/audit.interceptor.ts`
- [X] T013 [P] Implement WebSocket gateway in `apps/api/src/infrastructure/websocket/main.gateway.ts`
- [X] T014 [P] Configure global exception filter in `apps/api/src/common/filters/http-exception.filter.ts`
- [X] T015 [P] Setup test configuration (Jest, Supertest) in `apps/api/test/` and `apps/api/tests/`
- [X] T016 Configure NestJS module bootstrapping in `apps/api/src/app.module.ts`
- [X] T017 [P] Configure frontend Tailwind CSS with Premium Dark tokens in `apps/web/tailwind.config.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Gestión Multi-Tenant (P1) 🎯 MVP

**Goal**: Super-admin puede registrar un tenant, que opera con datos aislados.

**Independent Test**: Registrar un tenant con datos mínimos. Verificar que su admin puede iniciar sesión. Verificar que un usuario de otro tenant no accede a sus datos.

### Tests for User Story 1

- [X] T018 [P] [US1] Write contract test for POST `/api/v1/admin/tenants` (tenant creation) in `apps/api/tests/contract/tenants.spec.ts`
- [X] T019 [P] [US1] Write integration test for multi-tenant isolation in `apps/api/tests/integration/tenant-isolation.spec.ts`
- [X] T020 [P] [US1] Write unit test for TenantService in `apps/api/tests/unit/tenant.service.spec.ts`

### Implementation for User Story 1

- [X] T021 [P] [US1] Create TenantModule in `apps/api/src/core/tenant/tenant.module.ts`
- [X] T022 [P] [US1] Create TenantService in `apps/api/src/core/tenant/tenant.service.ts`
- [X] T023 [US1] Create TenantController in `apps/api/src/core/tenant/tenant.controller.ts` (POST /admin/tenants, GET /tenants/:id, PATCH /tenants/:id, DELETE /tenants/:id)
- [X] T024 [US1] Implement tenant creation with admin user provisioning in `apps/api/src/core/tenant/tenant.service.ts`
- [X] T025 [US1] Implement tenant isolation (RLS policy + middleware validation) in `apps/api/src/common/middleware/tenant-scope.middleware.ts`
- [X] T026 [US1] Implement tenant suspension/reactivation in `apps/api/src/core/tenant/tenant.service.ts`
- [X] T027 [US1] Add DTO validation for tenant endpoints in `apps/api/src/core/tenant/dto/`

**Checkpoint**: US1 fully functional — tenants can be registered, admin receives credentials, data isolation verified.

---

## Phase 4: User Story 2 — Autenticación Base (P1)

**Goal**: Usuarios autentican dentro de su tenant con JWT, bloqueo por intentos fallidos, logout con JWT blacklist.

**Independent Test**: Usuario inicia sesión en su tenant, accede a recursos, cierra sesión y pierde acceso. Credenciales inválidas 5 veces bloquean la cuenta.

### Tests for User Story 2

- [X] T028 [P] [US2] Write contract test for POST `/api/v1/auth/login` in `apps/api/tests/contract/auth.spec.ts`
- [X] T029 [P] [US2] Write integration test for login + JWT blacklist in `apps/api/tests/integration/auth-flow.spec.ts`
- [X] T030 [P] [US2] Write unit test for account lockout logic in `apps/api/tests/unit/auth.service.spec.ts`

### Implementation for User Story 2

- [X] T031 [P] [US2] Create AuthModule in `apps/api/src/core/auth/auth.module.ts`
- [X] T032 [P] [US2] Create AuthService in `apps/api/src/core/auth/auth.service.ts`
- [X] T033 [US2] Create AuthController in `apps/api/src/core/auth/auth.controller.ts` (POST /auth/login, POST /auth/logout, POST /auth/password-reset)
- [X] T034 [US2] Implement login with tenant-scoped credential validation in `apps/api/src/core/auth/auth.service.ts`
- [X] T035 [US2] Implement JWT token generation and rotation in `apps/api/src/common/auth/jwt.strategy.ts`
- [X] T036 [US2] Implement JWT blacklist (Redis) on logout in `apps/api/src/infrastructure/redis/jwt-blacklist.service.ts`
- [X] T037 [US2] Implement account lockout after N failed attempts in `apps/api/src/core/auth/auth.service.ts`
- [X] T038 [US2] Implement password reset flow in `apps/api/src/core/auth/auth.service.ts`
- [X] T039 [US2] Add DTO validation for auth endpoints in `apps/api/src/core/auth/dto/`

**Checkpoint**: US1 + US2 functional — auth flow complete with JWT, blacklist, and lockout.

---

## Phase 5: User Story 3 — RBAC (Roles y Permisos) (P2)

**Goal**: Admin de tenant define roles con permisos granulares, asigna a usuarios. RBAC enforceado en cada endpoint.

**Independent Test**: Admin crea rol "Auditor" con permiso `invoice.read`. Usuario Auditor puede leer pero recibe 403 al crear factura. Usuario sin rol no accede a nada.

### Tests for User Story 3

- [X] T040 [P] [US3] Write contract test for role CRUD endpoints in `apps/api/tests/contract/rbac.spec.ts`
- [X] T041 [P] [US3] Write integration test for RBAC enforcement in `apps/api/tests/integration/rbac-enforcement.spec.ts`
- [X] T042 [P] [US3] Write unit test for permission resolution in `apps/api/tests/unit/rbac.service.spec.ts`

### Implementation for User Story 3

- [X] T043 [P] [US3] Create RbacModule in `apps/api/src/core/rbac/rbac.module.ts`
- [X] T044 [P] [US3] Seed system permissions (all module.action codes) in `apps/api/prisma/seed.ts`
- [X] T045 [P] [US3] Create RoleService in `apps/api/src/core/rbac/role.service.ts`
- [X] T046 [P] [US3] Create PermissionService in `apps/api/src/core/rbac/permission.service.ts`
- [X] T047 [US3] Create RoleController in `apps/api/src/core/rbac/role.controller.ts` (CRUD roles, assign roles to user)
- [X] T048 [US3] Implement RBAC guard (permission-based) in `apps/api/src/common/auth/rbac.guard.ts`
- [X] T049 [US3] Apply RBAC guard to endpoints with permission decorator in `apps/api/src/common/auth/require-permission.decorator.ts`
- [X] T050 [US3] Add DTO validation for role/permission endpoints in `apps/api/src/core/rbac/dto/`

**Checkpoint**: US1 + US2 + US3 functional — RBAC enforced at every endpoint.

---

## Phase 6: User Story 4 — Separación Usuario vs Empleado (P3)

**Goal**: Entidades User y Employee independientes, vinculación opcional, soft-delete aislado.

**Independent Test**: Crear Employee con datos laborales. Crear User vinculado. Eliminar User → Employee intacto. Employee puede existir sin User.

### Tests for User Story 4

- [X] T051 [P] [US4] Write contract test for employee CRUD endpoints in `apps/api/tests/contract/employees.spec.ts`
- [X] T052 [P] [US4] Write integration test for User-Employee link/unlink in `apps/api/tests/integration/user-employee.spec.ts`
- [X] T053 [P] [US4] Write integration test for soft-delete isolation in `apps/api/tests/integration/soft-delete-isolation.spec.ts`

### Implementation for User Story 4

- [X] T054 [P] [US4] Create EmployeeModule in `apps/api/src/core/employee/employee.module.ts`
- [X] T055 [P] [US4] Create EmployeeService in `apps/api/src/core/employee/employee.service.ts`
- [X] T056 [US4] Create EmployeeController in `apps/api/src/core/employee/employee.controller.ts` (CRUD employees)
- [X] T057 [US4] Extend UserModule for employee linking in `apps/api/src/core/user/user.service.ts`
- [X] T058 [US4] Implement soft-delete (deletedAt filter) in `apps/api/src/common/mixins/soft-delete.mixin.ts`
- [X] T059 [US4] Enforce unique identityDoc per tenant in `apps/api/src/core/employee/employee.service.ts`
- [X] T060 [US4] Add DTO validation for employee endpoints in `apps/api/src/core/employee/dto/`

**Checkpoint**: All user stories functional — User-Employee separation verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Seed data, security hardening, documentation, and final validation.

- [X] T061 [P] Create database seed script with super-admin, system roles, and base permissions in `apps/api/prisma/seed.ts`
- [X] T062 [P] Implement rate-limiting (IP + Tenant) in `apps/api/src/infrastructure/redis/rate-limit.service.ts`
- [X] T063 [P] Add WebSocket event emission from services (audit, user, employee events) in `apps/api/src/infrastructure/websocket/main.gateway.ts`
- [X] T064 [P] Create frontend Socket.IO client and hooks in `apps/web/src/shared/ws/`
- [X] T065 [P] Create frontend Axios interceptor (X-Tenant-ID + Bearer) in `apps/web/src/shared/lib/api/client.ts`
- [X] T066 [P] Create frontend Zustand stores (auth, tenant) in `apps/web/src/core/auth/store.ts` and `apps/web/src/core/tenant/store.ts`
- [X] T067 [P] Run full test suite: contract, integration, unit — fix failures
- [X] T068 Run quickstart.md validation scenarios (all 8 scenarios)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2 + US1 (needs tenant context for auth)
- **Phase 5 (US3)**: Depends on Phase 2 + US1 + US2 (needs tenants and auth users)
- **Phase 6 (US4)**: Depends on Phase 2 + US1 + US2 (needs tenants and auth for user context)
- **Phase 7 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1 — MVP)**: Can start after Phase 2. No dependencies on other stories.
- **US2 (P1)**: Requires US1 (needs tenant for login context). Independently testable with seeded tenant.
- **US3 (P2)**: Requires US2 (needs authenticated user). Independently testable with seeded tenant + user.
- **US4 (P3)**: Requires US2 (needs auth context for user management). Independently testable with seeded data.

### Within Each User Story

- Tests written FIRST, ensure they FAIL before implementation
- Module definition before services
- Services before controllers
- Controllers before guard enforcement
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002, T004, T005 can run in parallel
- **Phase 2**: T007–T015 can all run in parallel (different files)
- **Within each story**: Tests marked [P] can run in parallel; models/services marked [P] can run in parallel
- **Cross-story**: Once Phase 2 is complete, US1 starts; US2/US3/US4 require US1 completion before starting

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for /api/v1/admin/tenants in tests/contract/tenants.spec.ts"
Task: "Integration test for tenant isolation in tests/integration/tenant-isolation.spec.ts"
Task: "Unit test for TenantService in tests/unit/tenant.service.spec.ts"

# Launch models/services for User Story 1 together:
Task: "Create TenantModule in src/core/tenant/tenant.module.ts"
Task: "Create TenantService in src/core/tenant/tenant.service.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Multi-Tenant)
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 (Multi-Tenant) → Test → **MVP complete!**
3. Add US2 (Auth) → Test → Auth flow live
4. Add US3 (RBAC) → Test → Access control live
5. Add US4 (User vs Employee) → Test → Full separation live
6. Polish → Security, rate-limiting, WebSocket events, frontend integration

### Parallel Team Strategy

With multiple developers:
1. Team completes Setup + Foundational together
2. Once Foundational done:
   - Developer A: US1 (Multi-Tenant) — MVP critical path
   - Developer B: US2 (Auth) — blocked until US1 is ready
3. After US1 + US2 complete:
   - Developer A: US3 (RBAC)
   - Developer B: US4 (User vs Employee)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Write tests first — verify they fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same-file conflicts, cross-story dependencies that break independence
- Refer to `quickstart.md` scenarios for manual validation after each phase
