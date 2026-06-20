# Feature Specification: Document Engine

**Feature Directory**: `specs/002-document-engine`

**Created**: 2026-06-19

**Status**: ✅ Implemented (v1.0.0)

> **Implementation verified**: 45/45 tasks complete • 88 unit tests passing • 1 E2E lifecycle test • 1 contract suite

**Input**: User description: "Document Engine"

## User Scenarios & Testing

### User Story 1 - Create and Submit a Sales Invoice (Priority: P1)

A billing clerk creates a sales invoice as a Draft, reviews line items, and submits it for approval.

**Why this priority**: The document lifecycle (Draft → Approval → Immutability) is the foundational flow of the entire ERP. Without this, no transactional operations are possible.

**Independent Test**: Can be fully tested by creating a new invoice in Draft status, verifying it appears in the draft list, submitting it, and confirming it transitions to Pending Approval with no data loss.

**Acceptance Scenarios**:

1. **Given** the clerk is on the "New Invoice" form, **When** they fill in required fields (customer, items, amounts) and save, **Then** the invoice is created in "Draft" status and visible in the draft documents list
2. **Given** a draft invoice exists, **When** the clerk submits it for approval, **Then** the status changes to "Pending Approval" and the document becomes locked for further edits
3. **Given** a submitted invoice is rejected, **When** the approving user returns it, **Then** the status goes back to "Draft" with rejection notes attached

---

### User Story 2 - Approve a Document and Lock It (Priority: P1)

An authorized manager reviews a pending document and approves it, making it immutable.

**Why this priority**: Once a document is approved, it becomes immutable — this is the core integrity guarantee of the system. This flow must work correctly before any business transactions can be trusted.

**Independent Test**: Can be tested by taking a "Pending Approval" document, approving it, then attempting to edit any field (which must be rejected).

**Acceptance Scenarios**:

1. **Given** a document is in "Pending Approval" status, **When** the approving user confirms approval, **Then** the document transitions to "Approved" status and all fields become read-only
2. **Given** an approved document, **When** any user attempts to modify a field via the UI or API, **Then** the system rejects the modification with a clear error message
3. **Given** an approved document, **When** a user views it, **Then** all fields display the exact values that were captured at the moment of approval

---

### User Story 3 - Generate a Counter-Document for Corrections (Priority: P2)

An approved invoice contains an error and a supervisor generates a corrective credit note linked to the original document.

**Why this priority**: Corrections to immutable documents must be handled via counter-documents, not edits. This is critical for audit compliance but can follow the basic approve workflow.

**Independent Test**: Can be tested by selecting an approved document, creating a "Credit Note" that references it, confirming the credit note goes through its own lifecycle.

**Acceptance Scenarios**:

1. **Given** an approved document exists, **When** a user creates a correction, **Then** a new counter-document (Credit Note) is created with a reference back to the original
2. **Given** a counter-document is created, **When** it references the original document, **Then** the original document shows a link to the counter-document
3. **Given** an approved document and its counter-document, **When** both are queried, **Then** the net effect reflects the correction without modifying the original

---

### User Story 4 - Change Document Status via State Machine (Priority: P2)

A warehouse manager marks a delivery order as "Delivered" after physical delivery, following only valid state transitions.

**Why this priority**: The state machine enforces valid transitions (e.g., Approved → Delivered, but Draft → Delivered is invalid). This prevents operational mistakes.

**Independent Test**: Can be tested by taking an approved document and transitioning through valid states, then attempting an invalid transition.

**Acceptance Scenarios**:

1. **Given** a document is in "Approved" status, **When** the user marks it as "Delivered", **Then** the status changes successfully
2. **Given** a document is in "Draft" status, **When** the user attempts to mark it as "Delivered", **Then** the system rejects the transition with a clear error
3. **Given** a document is in "Delivered" status, **When** the user marks it as "Paid", **Then** the status changes successfully

---

### User Story 5 - Listen to Document Events (Priority: P3)

The Inventory module automatically adjusts stock levels when a sales invoice is approved, reacting to the event emitted by the Document Engine.

**Why this priority**: Event emission enables cross-domain reactions (e.g., inventory, accounting, cash flow). This is important for integration but can be built after core flows are solid.

**Independent Test**: Can be tested by setting up a listener that logs events, approving a document, and verifying the event was emitted with correct payload.

**Acceptance Scenarios**:

1. **Given** a document is approved, **When** the status changes to "Approved", **Then** a `document.approved` event is emitted containing the document ID, type, and timestamp
2. **Given** a counter-document is created, **When** it is saved, **Then** a `document.counter-created` event is emitted with references to both documents
3. **Given** any document state transition occurs, **When** the status changes, **Then** a `document.status-changed` event is emitted

### Edge Cases

- What happens when a network failure occurs during document approval? The system must handle this atomically — either fully approved or fully draft, never partially approved
- How does the system handle submitting a document with zero total? This should be rejected unless explicitly allowed for zero-value documents (e.g., samples)
- How are concurrent approval requests handled? First approval locks the document; subsequent requests are rejected
- What happens to counter-documents when the original document is cancelled? Counter-documents remain valid; cancellation only affects the original

## Requirements

### Functional Requirements

- **FR-001**: System MUST support document state machine transitions with the lifecycle: Draft → Pending Approval → Approved → (Delivered | Paid | Cancelled). Counter-documents must follow the same lifecycle
- **FR-002**: Once a document enters "Approved" status, all its fields MUST become structurally immutable — no edits, additions, or deletions
- **FR-003**: System MUST enforce valid state transitions only. Invalid transitions (e.g., Draft → Delivered) MUST be rejected with a clear error
- **FR-004**: Users MUST be able to create a counter-document (e.g., Credit Note, Debit Note) that references an approved document and goes through its own independent lifecycle
- **FR-005**: System MUST emit a domain event for every document state transition, including the document ID, document type, previous status, new status, and timestamp
- **FR-006**: System MUST emit a domain event when a counter-document is created, including references to both the counter-document and the original document
- **FR-007**: Document transitions MUST be recorded in the immutable audit trail (user identity, timestamp, before/after status) per Constitution Principle III
- **FR-008**: System MUST support at least these document types: Sales Invoice, Purchase Order, Credit Note, Debit Note, Delivery Order, Stock Transfer, Cash Movement
- **FR-009**: System MUST allow querying documents by status, date range, document type, and tenant scope
- **FR-010**: System MUST prevent concurrent approval of the same document — first approval wins, subsequent attempts are rejected
- **FR-011**: Document state transitions MUST be atomic — a transition either completes fully or is rolled back entirely

### Key Entities

- **Document**: Core entity representing any business document. Attributes include: id, type (invoice, order, note, etc.), status, tenant context, timestamps, and a reference chain to linked documents (counter-documents)
- **Document Line**: Individual line items belonging to a document, with quantities, unit prices, tax references, and totals
- **Document State Machine**: Defines valid transitions per document type, enforces guard conditions, and orchestrates pre/post transition hooks
- **Document Event**: Immutable record of every domain event emitted by the Document Engine, with event type, payload, and timestamp

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can create a draft document and submit it for approval in under 2 minutes for typical invoices (up to 20 line items)
- **SC-002**: Once approved, no user can modify any field of the document — system rejects 100% of modification attempts
- **SC-003**: Invalid state transitions are rejected 100% of the time with a clear error message
- **SC-004**: Counter-documents are correctly linked to their source document and can be queried within 1 second
- **SC-005**: Document state transition events are emitted and persisted within 500ms of the status change
- **SC-006**: Concurrent approval of the same document is handled correctly 100% of the time — only the first succeeds
- **SC-007**: Audit trail records are complete (no gaps) for 100% of document transitions

## Assumptions

- Documents are created and managed within the existing multi-tenant isolation boundaries (Constitution Principle V)
- The existing RBAC system will be extended to control which user roles can perform each state transition (e.g., only managers can approve)
- The existing Audit infrastructure will be reused to record document state transitions
- The existing Event system or WebSocket infrastructure will handle event emission and consumption
- Document line items will use the product/catalog data from future domain modules (Inventory, Sales) but the Document Engine itself does not own product data
- Users are already authenticated via the existing JWT authentication system
- The UI will be built following the Premium Dark theme guidelines (Constitution UI/UX section)
