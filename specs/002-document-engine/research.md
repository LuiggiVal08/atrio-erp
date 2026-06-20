# Research: Document Engine

## Consolidation of Technical Decisions

No `[NEEDS CLARIFICATION]` markers were present in the spec. The following decisions were derived from the project context and constitution.

### State Machine Pattern

- **Decision**: Implement a custom state machine using a configuration-driven transition table (not a third-party library)
- **Rationale**: The document lifecycle has specific guard conditions and side effects per transition that require hooks (audit, event emission, counter-document validation). A custom table offers full control without external coupling
- **Alternatives considered**: `javascript-state-machine` (too generic, hook system insufficient), XState (too heavy for backend, adds complexity)

### Event Emission Strategy

- **Decision**: Use NestJS-native `@nestjs/event-emitter` for in-process event bus, with an event log table for persistence
- **Rationale**: Lightweight, no additional infrastructure needed; events are persisted in PostgreSQL for replay/debugging. Future multi-instance scaling can use Redis pub/sub
- **Alternatives considered**: RabbitMQ (overkill for current scale), Redis Streams (adds infra dependency), custom EventEmitter (error-prone)

### Immutability Enforcement

- **Decision**: Enforce immutability at the database level via a PostgreSQL trigger that rejects UPDATEs on approved documents, plus application-level checks in the domain layer
- **Rationale**: Defense in depth — the domain layer enforces rules for normal flows, the DB trigger prevents direct SQL tampering or buggy code paths
- **Alternatives considered**: Application-only enforcement (risk of data corruption if bug bypasses checks), Prisma middleware only (can be bypassed by raw queries)

### Counter-Document Linking

- **Decision**: Use a self-referential `original_document_id` foreign key in the documents table, plus a `counter_document_type` enum
- **Rationale**: Simple, queryable, and consistent with the relational model. Allows easy traversal of document chains
- **Alternatives considered**: Separate `document_links` join table (more flexible but over-engineered), event-sourced links (too complex for v1)

### Document Types

- **Decision**: Use a `document_type` enum/string field extensible per tenant configuration, with base types seeded: `sales_invoice`, `purchase_order`, `credit_note`, `debit_note`, `delivery_order`, `stock_transfer`, `cash_movement`
- **Rationale**: Flexible enough to add new document types without schema changes, while providing type safety via the domain enum
- **Alternatives considered**: Separate tables per document type (too rigid, hard to maintain), JSON polymorphism (loses relational integrity)

### State Transition Guards (RBAC Integration)

- **Decision**: Each transition will check the requesting user's permissions against a `transition_permissions` map (configurable per document type)
- **Rationale**: Reuses the existing RBAC module from `001-core-foundations` while allowing document-type-specific permission rules
- **Alternatives considered**: Hardcoded role checks per transition (not extensible), CASL integration (adds unnecessary abstraction layer)

### Audit Trail

- **Decision**: Reuse the existing `AuditInterceptor` pattern, extending it to capture document-specific before/after snapshots
- **Rationale**: Consistent with existing infrastructure (Principle III), zero new audit infrastructure needed
- **Alternatives considered**: Separate `document_audit` table (redundant with existing audit_logs)

### Soft Deletes

- **Decision**: Documents support soft delete via `deletedAt` timestamp (same pattern as Tenant, User, Employee)
- **Rationale**: Consistent with Constitution Principle III and existing patterns in the codebase
- **Alternatives considered**: Hard delete (violates data integrity principle), separate archive table (unnecessary complexity)

### Multi-Tenant Scoping

- **Decision**: Every document query includes `WHERE tenant_id = ?` via middleware (same `TenantScopeMiddleware` pattern)
- **Rationale**: Reuses existing tenant scoping infrastructure, zero new isolation code
- **Alternatives considered**: Row-Level Security (RLS) in PostgreSQL (adds DB complexity, harder to debug)

### Testing Strategy

- **Decision**: 
  - Unit tests for state machine transitions (pure logic, no dependencies)
  - Unit tests for each use case (mock repository ports)
  - Contract tests for REST API endpoints (supertest + AppModule)
  - Integration tests for end-to-end document lifecycle (with test database)
- **Rationale**: Aligned with existing testing patterns (jest + supertest) and the established test directory structure
- **Alternatives considered**: Playwright E2E (too slow for CI feedback loop), only integration tests (slower, harder to isolate failures)
