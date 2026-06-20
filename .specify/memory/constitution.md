<!--
  Sync Impact Report
  Version change: 1.0.0 → 1.1.0
  Modified principles: All principles updated to reflect Atrio (Odalx Ecosystem) core architecture.
  Added sections: Localization & Multi-Currency, Multi-Tenant Security, UI/UX Premium Dark Theme.
  Removed sections: Generic CLI references (shifted focus to modular plugin API/CLI ecosystem).
  Templates requiring updates: None.
  Follow-up TODOs: Ensure spec-template aligns with the Document Engine immutable state pattern.
-->

# Atrio ERP Constitution (Odalx Ecosystem)

## Core Principles

### I. Domain-Driven Modules & Plug-in Architecture

The core system MUST remain completely agnostical to specific business verticals and country-specific rules. Business logic MUST be organized into independent, self-contained domain modules (Sales, Inventory, Cash & Payments, Purchasing, HR) that function as plug-ins. Each module MUST act as an isolated library, owning its data schema and business rules. Modules MUST be dynamically togglable per tenant configuration. Cross-domain communication MUST strictly navigate through explicit service boundaries or the System Event Engine, never via shared database access.
Rationale: A multi-industry ERP requires a completely decoupled core to scale without creating monolithic code degradation.

### II. Document-Driven State & Immutability

Everything inside Atrio's operational workflow revolves around "Documents" (Sales, Orders, Invoices, Stock Transfers, Cash Movements). Every document MUST follow strict state machine transitions (Draft, Approved, Paid, Delivered, Cancelled). Once a document is Approved, it becomes structurally IMMUTABLE. Any subsequent adjustment or cancellation MUST generate a counter-document or a registered state mutation event. Every document action MUST emit an event that triggers immediate decoupled impacts on Inventory, Cashflows, or Accounting.
Rationale: Document immutability guarantees transactional reliability, prevents financial data tampering, and simplifies event-driven synchronization.

### III. Test-First & Data Integrity (NON-NEGOTIABLE)

TDD is mandatory. Tests MUST be written and MUST fail before any implementation begins. The Red-Green-Refactor cycle MUST be strictly followed for all changes. Furthermore, all operations modifying business data MUST be auditable via an unalterable audit trail recording user identity, timestamp, and before/after states. Soft deletes MUST be enforced for critical entity records (Tenants, Customers, Vendors, Products) to safeguard historical data integrity.
Rationale: Financial and enterprise resource platforms demand absolute mathematical correctness and zero regression tolerance.

### IV. Localization & Multi-Currency Engine

The system core MUST NOT contain hardcoded tax rates, currency conversions, or fiscal formatting rules. All local rules (e.g., Venezuelan IVA, IGTF, retentions) MUST be processed via a dedicated, configuration-driven Localization Engine. The system MUST support native Multi-Currency operations, establishing a base currency per tenant while handling secondary tracking currencies. Exchange rates MUST be evaluated and fixed historically at the exact moment of the document's state transition (Time-of-Document execution), preventing dynamic retro-active fluctuations.
Rationale: Essential for global expansion, ensuring that adapting the platform to a new country or economic reality requires configuration updates, not core code rewrites.

### V. Multi-Tenant Isolation & Local Infrastructure

Atrio is natively a multi-company (multi-tenant) SaaS platform. Every database query, cache key, and event payload MUST strictly scope data within the authenticated tenant context boundary. For development and staging environments, the primary workflow MUST be containerized locally using **Docker and WSL2** to mirror staging parameters. Production deployments will favor dedicated VPS/Manual infrastructure orchestration over magic cloud-deployment wrappers to retain total architectural control.
Rationale: Tenant data leaks are catastrophic; complete infrastructure control ensures predictability and data compliance.

## Security & Compliance

- Role-Based Access Control (RBAC) with granular, permission-based checks MUST be enforced at every single API route or system entry point.
- The system MUST strictly maintain a conceptual separation where **User ≠ Empleado** (Users manage platform access; Employees populate business/payroll structures).
- Sensitive credentials, payment tokens, and tenant configurations MUST be encrypted at rest (AES-256) and strictly in transit (TLS 1.3).
- Data mutations inside the core database MUST validate the tenant's current module subscription status before fulfilling any resource request.

## UI/UX Design Token Standardization

- All client interfaces designed for Atrio MUST conform to the custom **Premium Dark** UI theme guidelines.
- The interface color scheme MUST center around high-end dark blue-gray palettes, specifically leveraging `#1b1b1b` as the baseline primary canvas color.
- Component layouts, typography scale, and feedback tokens MUST remain consistent across internal platform apps to maintain brand unity under the Odalx suite.

## Development Workflow

- All work MUST follow a strict feature-branch workflow via Pull Requests.
- Every PR MUST include corresponding automated tests and pass 100% of the testing suite pipeline gates before merging.
- Database schema migrations MUST be backward-compatible, running through automated isolated checks before executing on tenant structures.
- Breaking interface changes between the core and plug-in modules MUST adhere to semantic versioning and be documented inside a central changelog.

## Governance

This Constitution supersedes all other development practices, codebase conventions, and AI agent initiatives. Amendments require:

1. A fully documented technical proposal detailing the modification and its systemic impact.
2. Unanimous review and ratification by the core system maintainers.
3. An explicit version bump complying with Semantic Versioning (SemVer):
    - MAJOR: Removal or relaxation of a core architectural principle.
    - MINOR: Introduction of new foundational components (e.g., Localization rule changes).
    - PATCH: Wording adjustments, non-semantic clarifications.

**Version**: 1.1.0 | **Ratified**: 2026-06-19 | **Last Amended**: 2026-06-19
