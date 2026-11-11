# Capability Matrix — Atrio ERP

> Dashboard del producto. Cada fila es una capacidad de negocio que Atrio puede (o debería poder) ejecutar. Este documento se abre todos los días.

## Leyenda

| Icon | Significado |
|------|------------|
| ✅ | Completo — pasa pruebas, listo para UAT |
| 🟡 | Parcial — implementado pero con deuda conocida |
| 🔴 | Roto — existe pero falla o tiene bugs |
| ⚪ | No iniciado |
| - | No aplica |

---

## Core Platform

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **Multi-tenant** (slug, módulos, aislamiento) | ✅ | ✅ | 🟡 | ✅ | 🟡 | ⚪ | ⚪ |
| **Autenticación JWT** (login, logout, refresh) | ✅ | ✅ | ✅ | ✅ | ⚪ | ⚪ | ⚪ |
| **RBAC** (roles, 82 permisos, guards) | ✅ | ✅ | ✅ | ✅ | ⚪ | ⚪ | ⚪ |
| **User CRUD** (photo, locale, estado) | ✅ | ✅ | ✅ | ✅ | ⚪ | ⚪ | ⚪ |
| **Tenant CRUD** (suspender, módulos toggle) | ✅ | ✅ | 🟡 | ✅ | ⚪ | ⚪ | ⚪ |
| **Audit logging** (global + por entidad) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Domain events** (EventEmitter2) | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **Soft-delete** (ACTIVE→INACTIVE→BLOCKED→ARCHIVED) | ✅ | ✅ | 🟡 | ✅ | ⚪ | ⚪ | ⚪ |
| **Paginación / Filtros** | 🟡 | 🟡 | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |

---

## Document Engine

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **Document CRUD** (types: invoice, PO, credit/debit note) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Document FSM** (9 transiciones) | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **Document numbering** ({PREFIX}-YYYYMMDD-{SEQ}) | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **Document events** (approved/paid/cancelled) | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **Document audit interceptor** | ✅ | ✅ | - | ⚪ | ⚪ | ⚪ | ⚪ |
| **Counter-document** (credit note → invoice) | 🟡 | ✅ | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |

---

## Business Partners

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **Partner aggregate** (CUSTOMER/SUPPLIER/PROSPECT roles) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Partner CRUD** (soft-delete lifecycle) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Legacy Client/Vendor compat layer** | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **Deprecation headers** en legacy endpoints | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **Partner role validation** | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **TaxId per country** (value object) | 🟡 | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Partner search** (por nombre, RIF, email) | 🟡 | 🟡 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |

---

## Inventory

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **Product CRUD** (SKU, precio, costo, taxId) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Product categories** | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Product images** | 🟡 | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Warehouse CRUD** | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Stock balance** (productId + warehouseId) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Stock adjustments** (in/out) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Stock movements** (historial) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Stock transfers** (entre almacenes) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Reorder points / low-stock alerts** | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Event-driven stock deduction** (document.approved) | ✅ | ✅ | - | ✅ | ⚪ | ⚪ | ⚪ |
| **Concurrency lock** (pessimistic para stock) | 🔴 | ⚪ | - | ⚪ | ⚪ | ⚪ | ⚪ |

---

## Cash & Payments

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **Cash register CRUD** | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Cash movements** (in/out con balance check) | ✅ | ✅ | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |
| **Payment methods** (cash, card, transfer, check) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Bank accounts** | ✅ | ✅ | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |
| **Multi-payment** (split por venta) | 🔴 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Cash register concurrency** (balance race) | 🔴 | ⚪ | - | ⚪ | ⚪ | ⚪ | ⚪ |

---

## Localization / Fiscal

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **Tax definitions CRUD** (IVA, etc.) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Currency exchange rates** | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Fiscal strategy pattern** (VE, CO) | ✅ | ✅ | - | 🟡 | ⚪ | ⚪ | ⚪ |
| **VE fiscal calculation** (IVA 16%/8%/31%, IGTF, RETE) | ✅ | ✅ | - | 🟡 | ⚪ | ⚪ | ⚪ |
| **CO fiscal calculation** (IVA 19%/5%, retenciones) | ✅ | ✅ | - | 🟡 | ⚪ | ⚪ | ⚪ |
| **Fiscal calculation endpoint** (`POST /fiscal/calculate`) | ✅ | ✅ | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |
| **Invoice tax detail persistence** | 🟡 | 🟡 | - | ⚪ | ⚪ | ⚪ | ⚪ |

---

## POS / Sales

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **POS session** (open/close linked to cash register) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Draft sale** (create/edit/delete with lines) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Checkout** (freeze prices → create Document → PENDING_APPROVAL) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Payment** (approve doc → deduct stock → register cash) | ✅ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Quick sale** (one-shot legacy) | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Idempotency** (checkout/payment) | 🔴 | ⚪ | - | ⚪ | ⚪ | ⚪ | ⚪ |
| **Concurrent stock** (race between registers) | 🔴 | ⚪ | - | ⚪ | ⚪ | ⚪ | ⚪ |
| **Multi-payment** por venta | 🔴 | ⚪ | - | ⚪ | ⚪ | ⚪ | ⚪ |
| **Cancel sale** (void document + revert stock) | 🔴 | ⚪ | - | ⚪ | ⚪ | ⚪ | ⚪ |
| **Receipt / Comprobante** | 🟡 | 🟡 | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **POS UI** (terminal, cart, checkout) | ⚪ | - | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Product search** (by name/SKU/barcode) | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Barcode scanning** | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **Daily close** (session summary) | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |

---

## Reports

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **MinIO storage** (reports) | 🟡 | ✅ | ⚪ | 🟡 | ⚪ | ⚪ | ⚪ |
| **PDF generator** | 🟡 | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Excel generator** | 🟡 | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| **Dashboard widgets** | 🟡 | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |

---

## Quality & Observability

| Capability | Estado | Backend | Frontend | Unit Tests | Integración | Contrato | Producción |
|---|---|---|---|---|---|---|---|
| **Unit tests** (Jest) | ✅ | 453 tests | ⚪ | - | - | - | - |
| **E2E tests** (Playwright) | ⚪ | - | ⚪ | - | - | - | - |
| **Contract tests** (HTTP shape) | ⚪ | ⚪ | ⚪ | - | - | - | - |
| **Integration tests** (real DB) | ⚪ | ⚪ | - | - | - | - | - |
| **CI/CD** (GitHub Actions) | ✅ | ✅ | ✅ | ✅ | - | - | - |
| **Business metrics** (checkout_duration, payment_errors, stock_conflicts) | 🔴 | ⚪ | ⚪ | ⚪ | - | - | - |
| **Transaction boundaries doc** | 🔴 | ⚪ | - | ⚪ | - | - | - |
| **ADR log** (arquitectura) | 🟡 | 7 ADRs | - | - | - | - | - |

---

## Resumen

| Status | Count |
|--------|-------|
| ✅ Completo | 48 |
| 🟡 Parcial | 17 |
| 🔴 Roto / Deuda | 7 |
| ⚪ No iniciado | 9 |

**Ratio de salud del producto**: 48 / (48+17+7+9) = 48/81 = **59%** completado
**Ratio de salud transaccional**: Características con concurrencia/idempotencia: 0/4 = **0%**
