<!--
  Sync Impact Report
  Version change: 1.1.0 → 1.2.0
  Modified principles: Principle II reinforced with explicit event-driven impact mandate.
  Added sections: Principle VI (i18n), Module Catalog, Business Model Support, Future Vision.
  Removed sections: None.
  Follow-up TODOs: Implement i18n translation files structure (ES/EN) in web app.
-->

# ODALX Ecosystem — Atrio ERP Constitution

ODALX is the parent brand encompassing multiple products (ATS, ERP, and future systems). Atrio ERP is the modular ERP platform within this ecosystem. This constitution governs all development under the ODALX umbrella.

## Core Principles

### I. Domain-Driven Modules & Plug-in Architecture

The core system MUST remain completely agnostical to specific business verticals and country-specific rules. Business logic MUST be organized into independent, self-contained domain modules (Sales, Inventory, Cash & Payments, Purchasing, HR) that function as plug-ins. Each module MUST act as an isolated library, owning its data schema and business rules. Modules MUST be dynamically togglable per tenant configuration. Cross-domain communication MUST strictly navigate through explicit service boundaries or the System Event Engine, never via shared database access.
Rationale: A multi-industry ERP requires a completely decoupled core to scale without creating monolithic code degradation.

### II. Document-Driven State, Immutability & Event Impact

Everything inside Atrio's operational workflow revolves around "Documents" (Sales, Orders, Invoices, Stock Transfers, Cash Movements). Every document MUST follow strict state machine transitions (Draft, Approved, Paid, Delivered, Cancelled). Once a document is Approved, it becomes structurally IMMUTABLE. Any subsequent adjustment or cancellation MUST generate a counter-document or a registered state mutation event. Every document action MUST emit an event that triggers immediate decoupled impacts on Inventory, Cashflows, and Accounting (future). Every event MUST generate an immutable audit trail recording identity, timestamp, and before/after states. The Document Engine is the central nervous system of the platform.
Rationale: Document immutability guarantees transactional reliability, prevents financial data tampering, and simplifies event-driven synchronization. Event-driven impact ensures all subsystems stay consistent without tight coupling.

### III. Test-First & Data Integrity (NON-NEGOTIABLE)

TDD is mandatory. Tests MUST be written and MUST fail before any implementation begins. The Red-Green-Refactor cycle MUST be strictly followed for all changes. Furthermore, all operations modifying business data MUST be auditable via an unalterable audit trail recording user identity, timestamp, and before/after states. Soft deletes MUST be enforced for critical entity records (Tenants, Customers, Vendors, Products) to safeguard historical data integrity.
Rationale: Financial and enterprise resource platforms demand absolute mathematical correctness and zero regression tolerance.

### IV. Localization & Multi-Currency Engine

The system core MUST NOT contain hardcoded tax rates, currency conversions, or fiscal formatting rules. All local rules (e.g., Venezuelan IVA, IGTF, retentions) MUST be processed via a dedicated, configuration-driven Localization Engine. The system MUST support native Multi-Currency operations, establishing a base currency per tenant while handling secondary tracking currencies. Exchange rates MUST be evaluated and fixed historically at the exact moment of the document's state transition (Time-of-Document execution), preventing dynamic retro-active fluctuations. Tax calculation MUST be decoupled from the core — applied via configurable rules per product category with support for exemptions.
Rationale: Essential for global expansion, ensuring that adapting the platform to a new country or economic reality requires configuration updates, not core code rewrites.

### V. Multi-Tenant Isolation & Local Infrastructure

Atrio is natively a multi-company (multi-tenant) SaaS platform. Every database query, cache key, and event payload MUST strictly scope data within the authenticated tenant context boundary. For development and staging environments, the primary workflow MUST be containerized locally using **Docker and WSL2** to mirror staging parameters. Production deployments will favor dedicated VPS/Manual infrastructure orchestration over magic cloud-deployment wrappers to retain total architectural control.
Rationale: Tenant data leaks are catastrophic; complete infrastructure control ensures predictability and data compliance.

### VI. Internationalization (i18n) — Multi-Language from Day One

All user-facing strings MUST be externalized to structured translation files. Hardcoded display text in any language is strictly forbidden. The base languages are:
- **Español (ES)** — primary
- **English (EN)** — secondary

The translation system MUST be key-based (not string-based), allowing future additions without code changes. The core MUST NOT assume any language; locale selection MUST be per-user or per-tenant configurable.
Rationale: Retrofitting i18n into a mature codebase is prohibitively expensive. Building it in from the start ensures ODALX can scale globally without rewrites.

## Module Catalog

Modules are independently activatable per tenant. Each module owns its data, routes, and business rules:

| Module | Description |
|--------|-------------|
| **Sales** | Quotes, orders, invoicing, POS, returns |
| **Inventory** | Products, categories, stock, movements, warehouses, lots (future) |
| **Cash & Payments** | Cash registers, bank accounts, payment methods, fees, references |
| **Purchasing** | Purchase orders, product receiving, vendor management |
| **HR / Payroll** (future) | Employees, positions, salaries, payroll |
| **Multi-Currency** | Secondary currency tracking, exchange rate history |
| **Advanced Reports** | Sales, inventory, cash, tax, profit analytics |

## Business Model Support

The platform is designed to serve multiple business types without code changes:
- **Retail / physical stores** — POS, cash registers
- **Order-based businesses** — quotes → orders → partial deliveries
- **Service companies** — non-inventory documents, time-based billing
- **Inventory-managed businesses** — stock tracking, transfers, adjustments
- **Multi-branch** (future) — cross-warehouse operations, consolidated reporting

Partial deliveries and split fulfillments MUST be supported at the Document Engine level.

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

- All work MUST follow a strict feature-branch workflow via Pull Requests (see AGENTS.md for branching strategy).
- Every PR MUST include corresponding automated tests and pass 100% of the testing suite pipeline gates before merging.
- Database schema migrations MUST be backward-compatible, running through automated isolated checks before executing on tenant structures.
- Breaking interface changes between the core and plug-in modules MUST adhere to semantic versioning and be documented inside a central changelog.
- Commit messages MUST follow the Conventional Commits format (`type(scope): description`). See AGENTS.md for types and scopes.

## Future Vision

ODALX is designed to evolve into:

1. **Full Odoo-like ERP** — complete suite covering all business operations
2. **Product ecosystem** — multiple ODALX-branded products (ATS, ERP, vertical solutions)
3. **Module marketplace** — third-party modules installable per tenant
4. **Global SaaS platform** — multi-country, multi-language, multi-currency
5. **Public API** — external integrations, webhooks, partner ecosystem
6. **Multi-branch / multi-warehouse** — consolidated operations across locations

## Governance

This Constitution supersedes all other development practices, codebase conventions, and AI agent initiatives. Amendments require:

1. A fully documented technical proposal detailing the modification and its systemic impact.
2. Unanimous review and ratification by the core system maintainers.
3. An explicit version bump complying with Semantic Versioning (SemVer):
    - MAJOR: Removal or relaxation of a core architectural principle.
    - MINOR: Introduction of new foundational components (e.g., i18n, Module Catalog).
    - PATCH: Wording adjustments, non-semantic clarifications.

**Version**: 1.2.0 | **Ratified**: 2026-06-20 | **Last Amended**: 2026-06-20
