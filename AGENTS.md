<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/004-b-frontend/plan.md
<!-- SPECKIT END -->

## Project Conventions

### Branching Strategy
- **main** — production-ready, stable
- **develop** — integration branch for features (create from main when starting a feature cycle)
- **feat/<module>** — feature branches (e.g., `feat/document-engine`, `feat/docker`)
- Merge: feature → develop (squash), develop → main (merge commit with semver tag)

### Commit Convention — Conventional Commits
Format: `type(scope): imperative description in English`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`
Scopes: `api`, `web`, `db`, `docker`, `docs`, `specs`

Examples:
- `feat(api): add document repository with Prisma`
- `fix(db): remove CLI warnings from migration SQL`
- `chore(docker): add Dockerfiles for api and web`

Use `git add -p` to separate unrelated changes into distinct commits.

### Code Conventions
- **API (NestJS 11 + TypeScript 5.x):** hexagonal architecture (domain/application/infrastructure), `@/` path alias, Prisma ORM, PostgreSQL 16
- **Web (React 19 + Vite 6):** `@/` path alias, `import.meta.env` for env vars, Tailwind CSS 4
- Tests: Jest (unit), Supertest (E2E), Vitest (web unit), Playwright (web E2E)
- TDD mandatory per Constitution Principle III

### Data Loading & Perceived Performance (Web)
- **`isPending` vs `isFetching`:** use `isPending`/`isLoading` to render skeletons (first load, no data). `isFetching` only drives subtle indicators (refresh button, `refreshing` prop) — never blank the UI on a background refetch or poll.
- **`keepPreviousData`:** paginated/searchable lists must set `placeholderData: keepPreviousData` so page/filter changes don't blank the grid. Use `listQueryOptions()` from `@/core/lib/query-defaults`.
- **`staleTime` map (via `query-defaults.ts`):** reference data (`refQueryOptions`) 1h; transactional data (`txQueryOptions`) 30s; list queries (`listQueryOptions`) keep previous data. Never call `queryClient.setQueryData` from inside a `queryFn`.
- **Zustand stores hold UI state only** (filter/sort/page/selection). Server data lives in react-query — no mirrored `products`/`loading`/`total` in stores.
- **Skeletons are mandatory in lists/tables:** use `Skeleton`, `TableSkeleton`, `CardSkeleton`, `ModuleSkeleton` instead of spinners. `VirtualGrid` renders skeleton rows while loading.
- **Entry animations run only on first load** and respect `prefers-reduced-motion` (see `useCountUp`, `AnimatedNumber`, `AnimatedBar`).
- **Below-the-fold dashboard sections** mount lazily via `DeferredMount` (IntersectionObserver).

### Form Architecture (Web)
- All new form views use `@tanstack/react-form` + Zod (Standard Schema), pinned to exact versions. See `specs/architecture/decisions/ADR-0011-web-forms-tanstack.md`.
- Zod schemas live in `apps/web/src/shared/validation/` and mirror (do not share) the API `class-validator` DTOs. The API remains the source of truth.
- Bind UI kit components once in `apps/web/src/shared/form/`; never use `<form.Field>` render-props directly in feature views.
- On server data arrival use `form.reset(initialValues)`, not `useEffect(() => setX(...))`.
- Map API validation errors by field via `applyServerErrors(form, error)`; the API returns `errors: [{ field, message }]`.
- POS, search/filter inputs and `LoginView` are out of scope.

### Docker Strategy
- `apps/api/Dockerfile`: multi-stage (build + runtime), Node 24 Alpine, Prisma via direct connection for migrations
- **Note:** `npm ci` in Docker build frequently times out (network issue). Workaround: removed `node_modules/` from `.dockerignore` and use `COPY node_modules ./node_modules/` instead of `RUN npm ci`. Context is ~480MB but builds reliably.
- `apps/web/Dockerfile`: multi-stage Node 24 Alpine build + Nginx Alpine serve
- `docker-compose.yml`: one service per component, Nginx as single entry point (:80)
- API connects through PgBouncer at runtime; migrations run via direct PostgreSQL connection

### PR Workflow
- Feature branches squash-merged to develop
- develop merged to main with merge commit and version tag (v1.0.0, v1.1.0, etc.)

## Accepted Practices

- **Backlog taxonomy**: OBS (observation) / OPS (operation request) / ARCH (architecture) / EXP (experiment). Never delete entries.
- **Observation flow**: OPEN → IN PROGRESS → VALIDATED → CLOSED
- **UX Debt tracked separately** in UX-DEBT.md (same priority as tech debt)
- **Time-motion targets** in 002-time-motion-study.md (median of 10 iterations, not average)
- **Keyboard-first principle**: no feature enters POS unless Keyboard Playwright tests exist
- **User Friction Index (UFI)**: F0=100, F1=40, F2=10, F3=3. Target UFI open < 20.
- **No feature added to POS without observation**: only OBS/OPS/ARCH/EXP entries justify POS changes
- **Identity Permanence Principle (ADR-0010)**: entities representing a permanent identity (Partner, Employee, Product, etc.) must NEVER directly store temporal/historical states. Everything that changes over time → versioned temporal entity with history. See `specs/architecture/decisions/ADR-0010-identity-permanence.md`

### Domain State Machines
State machines model only transition legality between statuses. They never contain business rules or side effects.
- StateMachine: defines valid transitions; exposes `canTransition()`, `assertValidTransition()`, `getValidTransitions()`
- Aggregate: decides when to attempt a transition; maintains domain invariants; updates its status
- Use Case: orchestrates the operation; coordinates other aggregates; manages transaction; publishes events

### Rule of Four — Extraction decisions
Do not abstract into shared infrastructure until the pattern appears at least 4 times across the codebase:
- 1st occurrence → implementation
- 2nd → coincidence
- 3rd → observe
- 4th → consider shared infrastructure
This prevents premature internal framework creation.

### Terminal States — ADR required
No terminal state (CANCELLED, VOIDED, REFUNDED, REVERSED, etc.) is added solely because a flow needs it. An ADR must first define its implications on inventory, cash registers, documents, taxes, audit trail, and domain events. A single enum change can break invariants across multiple bounded contexts. (for next planning session)

### Vertical Slice Pattern
Every new bounded context should include, by convention:
- Aggregate (root entity with identity + invariants)
- State Machine (via `createStateMachine()`)
- Repository interface (domain layer)
- Use Cases (application layer)
- REST Controller + DTOs
- Prisma Repository (infrastructure)
- Domain Events + Event Emitter integration
- Integration Event Handlers (reactions from other BCs)
- Tests (unit: state machine, entities, invariants, use cases)

Not a framework — a checklist. Deviations require justification.

These are not rules — they are ideas captured for team discussion.

### Product Excellence Phase
- Rename next phase from "UX Polish" to "Product Excellence"
- Core objective: reduce sale time, reduce errors, reduce clicks, improve onboarding, improve perceived performance
- No new modules — only improve existing flows

### Metric tracking infrastructure
- Average time per sale tracked weekly
- Clicks per sale (target: 2 for simple cash sale)
- "100 Sales Challenge": 3 tiers (A: simple, B: 5 products × 3 methods, C: chaos with errors/offline/cancellations)
- Persona-based testing: newbie (50 sales), expert (500 sales), admin (2/week)

### Error recovery
- Gate UX-02 — Production Readiness
- Scenarios to solve: payment rejected, internet down, printer disconnected, stock changed mid-sale
- Must work when the environment stops being perfect

### Field feedback
- Track field feedback separately from observations
- Example: "cliente pide que el sistema recuerde la última longitud de tubo PVC"

### UX debt as gate
- Before adding new POS feature, review UX-DEBT.md and resolve any UXD with High/Medium impact in the affected module

### Document scope rule
- Each spec document must answer exactly one question. If two documents answer the same question, one is redundant.

### Interaction Layer
- FocusManager, ScannerEngine, KeyboardManager, AudioService form a single `platform/interaction/` capability, not POS-only code.
- UX-002 renamed from "Scanner Engine" to "Input Layer" to reflect this scope.

---

### Alpha-1 Mission
- **Goal**: 100 real sales in a pilot business. Real money, real customers, real pressure.
- **Gate**: Operational Ready — the business operates a full day without development assistance.
- **Rule**: No new spec documents. Every new feature must be born from a real sale or a demonstrable client need.
- **Metric**: Developer explains nothing, only observes and logs friction.

---

## Session 2026-07-08 — Organization Structure + Employment Domain Discovery

### Completed
- **RC-0 Stabilization**: all 398 tests pass (99 suites), TypeScript compiles cleanly (API + Web), Web Vite build succeeds, 15/15 DB migrations applied
- **CI/CD**: GitHub Actions pipeline (`.github/workflows/ci.yml`) with parallel API/Web jobs, PostgreSQL + Redis service containers
- **Toast Service**: replaced `console.log` placeholder in `toast-service.ts` with real Sileo implementation
- **RBAC + Users UI**: full CRUD views for roles and users
- **Business Partners Domain Design (specs/003-business-partners/)**: 9 spec docs + CCR-01
- **Organization Structure V1**: Position + PositionAssignment entities, Organization module, migration SQL, updated Employee entity with managerEmployeeId
- **Employment Domain Discovery (specs/004-employment/)**: 8 spec docs + ADR-0009 (Temporal Relationships) + ADR-0010 (Identity Permanence Principle)

### Key Decisions
- `Client` and `Vendor` are replaced by `Partner` with `PartnerRole[]` (CUSTOMER, SUPPLIER, PROSPECT, etc.)
- Business Partners is a **Core Domain** (not a module), lives in `core/business-partners/`
- Only Business Partners writes to the Partner aggregate; all other contexts read-only
- Soft delete only (never physical DELETE): ACTIVE → INACTIVE → BLOCKED → ARCHIVED
- PartnerId (UUID v7) is the identity; TaxIdentifier is a mutable value object per country
- Migrate incrementally with feature flags: new model first, adapters for legacy `/clients` and `/vendors`, then deprecation
- Priority order for next features: Business Partners implementation → remaining RC-0 items → future features

### Key Decisions (Employment)
- **Organization** is a separate bounded context from People (Employee). Structure ≠ personnel.
- **Employment** (EmploymentRelationship) is the intermediate layer: Employee → Employment → Payroll/Workforce.
- **EmploymentRelationship** is the aggregate root, NOT Contract. Contracts change within the same relationship.
- **CompensationAgreement** replaces SalaryHistory (nunca UPDATE, siempre INSERT).
- **EmploymentReason** is required for every change (analítica de RRHH).
- **EmploymentStatus** is a first-class concept with explicit transitions.
- **EmploymentPolicy** (V2+) avoids Contract accumulating config fields.
- **Workforce** (Attendance, Leave, Vacation) is a separate bounded context.
- **Payroll** never knows Employee directly — solo EmploymentRelationshipId.
- **Localization** consumes Employment events; Employment never imports Localization.
