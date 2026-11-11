# Release Roadmap — Atrio ERP

> Roadmap tentativo. Cada release entrega un conjunto de capacidades que pueden operar juntas de extremo a extremo.

---

## v0.1 — "POS V1" (actual)

**Objetivo**: Primer flujo de negocio completo de extremo a extremo.

### ✅ Entregado

| Capacidad | Epic |
|-----------|------|
| Business Partners (CRUD + compat layer) | 003 |
| RBAC + Users UI | 004-b |
| POS Draft | 005 / Slice 1 |
| POS Checkout | 005 / Slice 2 |
| POS Payment | 005 / Slice 2 |

### 🔴 En deuda (liberar junto con v0.2)

| Deuda | Epic |
|-------|------|
| Transaction hardening (idempotencia, concurrencia, boundaries) | H-001 |
| Contract tests (HTTP shape) | — |
| Integration tests (real DB) | — |

---

## v0.2 — "POS Resiliente"

**Objetivo**: POS que puede sobrevivir en producción.

### 🎯 Alcance planeado

| Capacidad | Epic |
|-----------|------|
| Transaction boundaries documentado | H-001.0 |
| Idempotencia (checkout, payment, cancel, approve) | H-001.1 |
| Concurrencia stock (pessimistic lock) | H-001.2 |
| Concurrencia caja (balance atomic) | H-001.2 |
| Event retry en handlers | H-001.4 |
| Outbox ADR (futuro) | H-001.5 |
| Business metrics + observabilidad | H-001.6 |

### 🧪 Pruebas

| Tipo | Estado |
|------|--------|
| Contract tests (checkout, payment) | ⚪ |
| Integration tests (repository) | ⚪ |
| Concurrency tests (2 payments same product) | ⚪ |

---

## v0.3 — "POS Terminal"

**Objetivo**: POS manejable desde el navegador.

### 🎯 Alcance planeado

| Capacidad | Epic |
|-----------|------|
| POS UI — Terminal screen (product grid, cart) | 005 / Slice 3 |
| POS UI — Customer search & select | 005 / Slice 3 |
| POS UI — Checkout modal (payment method, change) | 005 / Slice 3 |
| POS UI — Sale confirmation | 005 / Slice 3 |
| Receipt / Comprobante (browser print) | 005 / Slice 4 |
| Product search (by name/SKU) | 005 / Slice 3 |

### 🧪 Pruebas

| Tipo | Estado |
|------|--------|
| Playwright E2E (select → buy → receipt) | ⚪ |

---

## v0.4 — "POS Cierre"

**Objetivo**: POS completo con cierre de jornada.

### 🎯 Alcance planeado

| Capacidad | Epic |
|-----------|------|
| POS session close (daily summary) | 005 / Slice 4 |
| Multi-payment per sale | 005 / v2 |
| Cancel sale (void + stock revert) | 005 / v2 |
| Daily sales report | Reports |

---

## v1.0 — "ERP Core"

**Objetivo**: Base estable para empezar a vender.

### Criterios de entrada

- ✅ POS V1 completo y resiliente
- ✅ 90%+ cobertura de unit tests
- ✅ Contract tests en todos los endpoints críticos
- ✅ E2E tests del flujo POS completo
- ✅ Business metrics dashboard funcional
- ✅ Outbox pattern implementado o documentado

### Capacidades candidatas

| Capacidad | Dependencia |
|-----------|-------------|
| Purchasing (Órdenes de Compra) | Document Engine (ready) |
| Quotes (Cotizaciones) | Document Engine (ready) |
| Sales Returns | Document Engine + Inventory + Cash |
| Reports dashboard | Reports module |

---

## v2.0+

- E-commerce / Marketplace
- Multi-currency POS
- Offline POS (IndexedDB)
- HR / Payroll
- Fixed Assets
- Budgeting
