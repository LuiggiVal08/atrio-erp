# Changelog

> Product changelog — what Atrio can do, organized by capabilities.

## v0.1.0-dev (2026-07-07)

### ✅ Core Platform

| Capability | Status |
|-----------|--------|
| Multi-tenant architecture | 🟢 |
| JWT Authentication (login/logout/switch-tenant) | 🟢 |
| RBAC (roles, permissions, 82 permission codes) | 🟢 |
| User management (CRUD, locale, photo) | 🟢 |
| Tenant management (CRUD, modules, suspend) | 🟢 |
| Global audit logging | 🟢 |
| Domain event system (NestJS EventEmitter2) | 🟢 |
| Document Engine (FSM: draft→approved→paid→cancelled) | 🟢 |
| Soft-delete convention across all entities | 🟢 |

### ✅ Business Partners

| Capability | Status |
|-----------|--------|
| Partner aggregate (Customer, Supplier, Prospect roles) | 🟢 |
| Partner CRUD with soft-delete lifecycle | 🟢 |
| Legacy Client/Vendor compatibility layer | 🟢 |
| Deprecation headers on legacy endpoints | 🟢 |
| Compatibility usage metrics | 🟢 |

### ✅ Localization Engine

| Capability | Status |
|-----------|--------|
| Tax definitions (IVA, etc.) CRUD | 🟢 |
| Currency exchange rates | 🟢 |
| Venezuela fiscal strategy (IVA 16%/8%/31%, IGTF 3%, RETE_IVA) | 🟢 |
| Colombia fiscal strategy (IVA 19%/5%, RETE_IVA, RETE_FUENTE, RETE_ICA) | 🟢 |
| Fiscal calculation endpoint (`POST /fiscal/calculate`) | 🟢 |

### ✅ Inventory

| Capability | Status |
|-----------|--------|
| Product CRUD with categories | 🟢 |
| Warehouse management | 🟢 |
| Stock balance, adjustments, movements | 🟢 |
| Stock transfers between warehouses | 🟢 |
| Reorder points and low-stock alerts | 🟢 |
| Event-driven stock deduction (document.approved) | 🟢 |

### ✅ Cash & Payments

| Capability | Status |
|-----------|--------|
| Cash register management | 🟢 |
| Cash movements (in/out with balance validation) | 🟢 |
| Payment methods (cash, card, transfer, check) | 🟢 |
| Bank accounts | 🟢 |
| Event-driven cash movement (document.paid) | 🟢 |

### 🟡 POS Sales (Slice 1 — Draft)

| Capability | Status |
|-----------|--------|
| SalesOrder aggregate with OrderLine entities | 🟢 |
| CustomerSnapshot (frozen at sale time) | 🟢 |
| Money value object (typed amounts, currency-safe) | 🟢 |
| CurrencySnapshot (exchange rate frozen) | 🟢 |
| Draft lifecycle (Draft → PendingPayment → Paid → Completed) | 🟢 |
| `POST /pos/sales` — Create draft sale | 🟢 |
| `GET /pos/sales/:id` — View sale with lines | 🟢 |
| `GET /pos/sales` — List all POS sales | 🟢 |
| `PATCH /pos/sales/:id` — Edit draft (customer, lines) | 🟢 |
| `DELETE /pos/sales/:id` — Discard draft | 🟢 |
| Domain events (sale.*) | 🟢 |
| Audit logging per mutation | 🟢 |
| Invariants: tenant ownership, Draft-only modifications | 🟢 |
| Extension points for Slice 2 (checkout, payment, stock) | 🟢 |

### ⚪ Upcoming

| Capability | Target |
|-----------|--------|
| POS Checkout & Payment | Slice 2 |
| Stock deduction on payment | Slice 2 |
| Fiscal Engine integration (tax calculation) | Slice 2 |
| Cash movement registration | Slice 2 |
| POS Terminal UI (frontend) | Slice 3 |
| Receipts & Daily close | Slice 4 |
| Sales returns via POS | Future |
| Multi-currency POS | Future |
| Offline POS (IndexedDB) | Future |

## Notes

- **Architecture**: Hexagonal (domain/application/infrastructure) in all bounded contexts
- **Backend**: NestJS 11 + TypeScript 5.x + Prisma ORM + PostgreSQL 16
- **Frontend**: React 19 + Vite 6 + Tailwind CSS 4 (in progress)
- **Tests**: 440 unit tests, Jest + Supertest contract tests
- **CI/CD**: GitHub Actions (API + Web parallel), PostgreSQL + Redis service containers
