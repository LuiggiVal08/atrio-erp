# Tasks: Document Engine

**Input**: Design documents from `specs/002-document-engine/`

**Prerequisites**: plan.md, spec.md (user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included per Constitution Principle III (TDD mandatory).

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create module skeleton and register in the application.

- [X] T001 Create `modules/document-engine/` directory structure (domain/, application/, infrastructure/, dto/) per plan.md structure
- [X] T002 [P] Register `DocumentModule` in `apps/api/src/app.module.ts` as a new imported module
- [X] T003 Create migration `add_document_engine` with `documents`, `document_lines`, `document_events` tables per data-model.md schema

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Add `DocumentType`, `DocumentStatus`, `CounterDocumentType` enums to Prisma schema at `apps/api/prisma/schema.prisma`
- [X] T005 [P] Implement `DocumentStateMachine` with transition table (valid transitions, guard conditions) in `apps/api/src/modules/document-engine/domain/document-state-machine.ts`
- [X] T006 [P] Create `Document` entity class in `apps/api/src/modules/document-engine/domain/document.entity.ts`
- [X] T007 [P] Create `DocumentLine` entity class in `apps/api/src/modules/document-engine/domain/document-line.entity.ts`
- [X] T008 [P] Create `DocumentEvent` entity class in `apps/api/src/modules/document-engine/domain/document-event.entity.ts`
- [X] T009 [P] Create `DocumentRepository` interface in `apps/api/src/modules/document-engine/domain/document.repository.interface.ts`
- [X] T010 [P] Create `DocumentEventRepository` interface in `apps/api/src/modules/document-engine/domain/document-event.repository.interface.ts`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Create and Submit a Sales Invoice (P1) 🎯 MVP

**Goal**: A billing clerk creates a sales invoice as a Draft, reviews line items, and submits it for approval.

**Independent Test**: Create a new invoice in Draft, verify it appears in the draft list, submit it, confirm it transitions to Pending Approval with no data loss.

### Tests for User Story 1

- [X] T011 [P] [US1] Unit test for `CreateDocumentUseCase` in `tests/unit/document-engine/create-document.use-case.spec.ts`
- [X] T012 [P] [US1] Unit test for `SubmitDocumentUseCase` in `tests/unit/document-engine/submit-document.use-case.spec.ts`
- [X] T013 [US1] Contract test for `POST /tenants/:tenantId/documents` and `POST /:id/submit` in `tests/contract/document-engine/documents.spec.ts`

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement `CreateDocumentUseCase` in `apps/api/src/modules/document-engine/application/create-document.use-case.ts`
- [X] T015 [P] [US1] Implement `SubmitDocumentUseCase` in `apps/api/src/modules/document-engine/application/submit-document.use-case.ts`
- [X] T016 [P] [US1] Create `CreateDocumentDto` and `TransitionDocumentDto` in `apps/api/src/modules/document-engine/infrastructure/dto/`
- [X] T017 [US1] Implement `PrismaDocumentRepository` in `apps/api/src/modules/document-engine/infrastructure/prisma-document.repository.ts`
- [X] T018 [US1] Implement `DocumentController` (create + submit endpoints) in `apps/api/src/modules/document-engine/infrastructure/document.controller.ts`
- [X] T019 [US1] Wire `DocumentModule` with providers, controllers, and DI tokens in `apps/api/src/modules/document-engine/infrastructure/document.module.ts`

**Checkpoint**: US1 fully functional — can create, list, and submit invoices. 🎯 MVP COMPLETE.

---

## Phase 4: User Story 2 — Approve a Document and Lock It (P1)

**Goal**: An authorized manager reviews a pending document and approves it, making it immutable.

**Independent Test**: Take a Pending Approval document, approve it, then attempt to edit any field — must be rejected.

### Tests for User Story 2

- [X] T020 [P] [US2] Unit test for `ApproveDocumentUseCase` in `tests/unit/document-engine/approve-document.use-case.spec.ts`
- [X] T021 [P] [US2] Unit test for `QueryDocumentUseCase` in `tests/unit/document-engine/query-document.use-case.spec.ts`
- [X] T022 [US2] Contract test for approval + immutability in `tests/contract/document-engine/documents.spec.ts`

### Implementation for User Story 2

- [X] T023 [P] [US2] Implement immutability guard in `Document` entity (reject field changes when status === `approved`) in `apps/api/src/modules/document-engine/domain/document.entity.ts`
- [X] T024 [P] [US2] Implement `ApproveDocumentUseCase` with concurrent approval prevention (first-approval-wins) in `apps/api/src/modules/document-engine/application/approve-document.use-case.ts`
- [X] T025 [P] [US2] Implement `QueryDocumentUseCase` (list by status, date range, type; get single with lines) in `apps/api/src/modules/document-engine/application/query-document.use-case.ts`
- [X] T026 [US2] Add approve + query endpoints to `DocumentController` in `apps/api/src/modules/document-engine/infrastructure/document.controller.ts`

**Checkpoint**: US1 + US2 both functional — documents can be created, submitted, approved, and queried.

---

## Phase 5: User Story 3 — Generate a Counter-Document for Corrections (P2)

**Goal**: An approved invoice contains an error and a supervisor generates a corrective credit note linked to the original.

**Independent Test**: Select an approved document, create a Credit Note referencing it, confirm the credit note has its own independent lifecycle.

### Tests for User Story 3

- [X] T027 [P] [US3] Unit test for `CreateCounterDocumentUseCase` in `tests/unit/document-engine/create-counter-document.use-case.spec.ts`
- [X] T028 [US3] Contract test for `POST /:id/counter` in `tests/contract/document-engine/documents.spec.ts`

### Implementation for User Story 3

- [X] T029 [P] [US3] Implement `CreateCounterDocumentUseCase` (validates original is approved, links via `originalDocumentId`) in `apps/api/src/modules/document-engine/application/create-counter-document.use-case.ts`
- [X] T030 [US3] Add counter-document endpoint to `DocumentController` in `apps/api/src/modules/document-engine/infrastructure/document.controller.ts`

**Checkpoint**: US1 + US2 + US3 functional — corrections via counter-documents work.

---

## Phase 6: User Story 4 — Change Document Status via State Machine (P2)

**Goal**: A warehouse manager marks a delivery order as Delivered, following only valid state transitions.

**Independent Test**: Take an approved document, transition through valid states (Delivered, Paid), then attempt an invalid transition (Draft → Delivered).

### Tests for User Story 4

- [X] T031 [P] [US4] Unit test for `TransitionDocumentUseCase` in `tests/unit/document-engine/transition-document.use-case.spec.ts`
- [X] T032 [US4] Contract test for `POST /:id/transition` in `tests/contract/document-engine/documents.spec.ts`

### Implementation for User Story 4

- [X] T033 [P] [US4] Implement `TransitionDocumentUseCase` (delegates to `DocumentStateMachine` for validation) in `apps/api/src/modules/document-engine/application/transition-document.use-case.ts`
- [X] T034 [US4] Add transition endpoint to `DocumentController` in `apps/api/src/modules/document-engine/infrastructure/document.controller.ts`

**Checkpoint**: US1 through US4 functional — full state machine lifecycle operational.

---

## Phase 7: User Story 5 — Listen to Document Events (P3)

**Goal**: The Inventory module automatically adjusts stock when a sales invoice is approved, reacting to emitted events.

**Independent Test**: Set up a listener that logs events, approve a document, verify event was emitted with correct payload.

### Tests for User Story 5

- [X] T035 [P] [US5] Unit test for `DocumentEventEmitter` in `tests/unit/document-engine/document-event-emitter.spec.ts`
- [X] T036 [US5] Integration test for event emission in `tests/integration/document-engine/document-engine.spec.ts`

### Implementation for User Story 5

- [X] T037 [P] [US5] Implement `DocumentEventEmitter` service (wraps `@nestjs/event-emitter`) in `apps/api/src/modules/document-engine/infrastructure/document-event-emitter.ts`
- [X] T038 [P] [US5] Implement `PrismaDocumentEventRepository` in `apps/api/src/modules/document-engine/infrastructure/prisma-document-event.repository.ts`
- [X] T039 [US5] Wire event emission into each use case (emit after successful state change + persist event) in `apps/api/src/modules/document-engine/application/`

**Checkpoint**: All 5 user stories functional — events emitted and persisted for every transition.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [X] T040 [P] Integrate RBAC guards on every transition endpoint (reuse existing `RbacGuard` from `common/auth/`) in `apps/api/src/modules/document-engine/infrastructure/document.controller.ts`
- [X] T041 [P] Integrate `AuditInterceptor` for document state transitions in `apps/api/src/modules/document-engine/`
- [X] T042 [P] Add soft delete (`DELETE /:id`) with status restriction (draft/cancelled only) in `apps/api/src/modules/document-engine/`
- [X] T043 [P] Add `QuickstartDto` and `QueryDocumentDto` with `class-validator` in `apps/api/src/modules/document-engine/infrastructure/dto/`
- [X] T044 Run `quickstart.md` validation scenarios end-to-end
- [X] T045 Code cleanup and final review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational completion
  - US3 (counter-document) depends on US2 (immutability — original must be approved)
  - US4 (state machine transitions) depends on US2 (approved document exists)
  - US5 (events) depends on US1 and US2 (transitions to emit from)
  - US3 and US4 can proceed in parallel if staffed
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — can start after Phase 2
- **US2 (P1)**: Can start after Phase 2; integrates with US1 (takes pending documents)
- **US3 (P2)**: Requires US2 (original must be approved)
- **US4 (P2)**: Requires US2 (transitions start from approved)
- **US5 (P3)**: Requires US1 and US2 (needs transitions to emit events from)

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD per Constitution Principle III)
- Domain entities before use cases
- Use cases before controllers
- Story complete before moving to next priority

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel
- T005-T010 in Phase 2 can all run in parallel
- T011+T012 (US1 tests) can run in parallel
- T014+T015+T016 (US1 models) can run in parallel
- US3 and US4 can run in parallel once US2 is complete

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test US1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → **MVP DEPLOY**
3. Add US2 → Test independently → Deploy
4. Add US3 + US4 → Test independently → Deploy
5. Add US5 → Test independently → Deploy

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (MVP)
   - Developer B: US5 (events infrastructure — independent from core flows)
3. After US1 complete:
   - Developer A: US2
   - Developer B: US5 use case integration
4. After US2 complete:
   - Developer A: US3
   - Developer B: US4
5. Together: Phase 8 Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [US1-5] labels map tasks to specific user stories for traceability
- Each user story is independently completable and testable
- Write tests first (RED), then implement (GREEN), then refactor per Constitution Principle III
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Files follow hexagonal architecture: `domain/` (entities, interfaces), `application/` (use cases), `infrastructure/` (controllers, DTOs, Prisma adapters, module)
- Use DI string tokens (`DOCUMENT_REPOSITORY`, `DOCUMENT_EVENT_REPOSITORY`) consistent with 001-core-foundations pattern
