# Epic Status — Atrio ERP

> Seguimiento de epics activos, completados y planificados. Un epic entrega capacidades de negocio reales (no módulos).

---

## Activos

### Epic H-001 — Transaction Hardening

| Campo | Valor |
|-------|-------|
| **Estado** | 🟢 Completado (6/8 items, 2 complementarios) |
| **Dependencias** | Ninguna |
| **Riesgo** | Bajo |
| **Criterios de salida** | POS puede sobrevivir a doble clic, race condition, handlers caídos |

#### User Stories

| ID | Descripción | Prioridad | Estado |
|----|------------|-----------|--------|
| H-001.0 | Transaction boundaries document | Alta | ✅ |
| H-001.1 | Idempotency-Key en checkout y payment | Alta | ✅ |
| H-001.2 | Pessimistic lock en stock (SELECT FOR UPDATE en $transaction) | Alta | ✅ |
| H-001.3 | Locking strategy documentada | Media | ✅ |
| H-001.4 | Retry mechanism en event handlers | Media | ✅ |
| H-001.5 | Outbox pattern ADR | Baja | ✅ (diferido) |
| H-001.6 | Business metrics | Alta | ✅ |
| H-001.7 | Business invariants tests | Media | ✅ |
| H-001.8 | Chaos testing | Baja | ⚪ (QA) |

---

### Epic 002 — Point of Sale Experience (POSX)

| Campo | Valor |
|-------|-------|
| **Estado** | 🟢 Diseño aprobado (Gate POSX-01) — listo para implementar |
| **Dependencias** | H-001 completado |
| **Riesgo** | Medio (primera experiencia real de usuario) |

#### Gate POSX-01: 🟢 Aprobado

| Criterio | Estado |
|----------|--------|
| User journeys definidos (PX-01 a PX-06) | ✅ |
| Single-screen layout diseñado | ✅ |
| Keyboard-first (F2/F4/F8/ESC/CTRL+N) | ✅ |
| State management (Zustand) definido | ✅ |
| Offline strategy documentada | ✅ |
| Performance budgets establecidos | ✅ |
| Accessibility (WCAG 2.2 AA) | ✅ |
| Design tokens y guidelines | ✅ |
| Acceptance criteria (40+) | ✅ |
| Hardware support | ✅ |
| Interaction guidelines | ✅ |
| Personas, Customer Journey, Empty States, Error Catalog | ✅ |

---

## Completados

### Epic 005 — POS V1 (Slice 1 y 2)

| Criterio | Estado |
|----------|--------|
| Draft sale CRUD (5 endpoints) | ✅ |
| Checkout (freeze + Document) | ✅ |
| Payment (approve + stock + cash) | ✅ |
| 453 unit tests | ✅ |

### Epic 003 — Business Partners

| Criterio | Estado |
|----------|--------|
| Partner aggregate | ✅ |
| Legacy compatibility layer | ✅ |
| Partner CRUD | ✅ |

### Epic 004-b — RBAC + Users UI

| Criterio | Estado |
|----------|--------|
| Roles CRUD con checkboxes de permisos | ✅ |
| Users CRUD con asignación de roles | ✅ |
| Lazy-loaded routes (/rbac/*, /users/*) | ✅ |

---

## Planificados

### Sprint UX Polish — POSX Sprint 2

| Prioridad | Descripción | Estado |
|-----------|-------------|--------|
| 1 | Sonidos: beep en escaneo, error, venta completada | ⚪ |
| 2 | Foco automático infalible (cursor siempre al buscador post-agregar) | ⚪ |
| 3 | Soporte real para escáner HID (detectar ENTER post-código) | ⚪ |
| 4 | Botón modo entrenamiento en Header | ⚪ |
| 5 | Suspender venta (CTRL+S) | ⚪ |
| 6 | Atajos completos (CTRL+D, CTRL+X, ALT+P, +, -) | ⚪ |
| 7 | Header informativo (productos, total, conexión, offline) | ⚪ |
| 8 | Performance: buscar <100ms, agregar <50ms, cobrar <300ms | ⚪ |
| 9 | Receipt abstracto (ESC/POS + PDF + HTML + Email renderers) | ⚪ |
| 10 | Demo Mode (100 productos, 20 clientes, caja abierta al iniciar) | ⚪ |

### Escenarios de negocio (nueva métrica de progreso)

| Escenario | Estado |
|-----------|--------|
| Venta POS (consumidor final, efectivo) | ✅ |
| Venta con cliente registrado | 🟡 |
| Venta con múltiples métodos de pago | ⏳ |
| Venta suspendida y recuperada | ⏳ |
| Devolución | ⏳ |
| Apartado / Pedido | ⏳ |
| Compra a proveedor | ⏳ |
| Entrada de inventario | ⏳ |
| Cierre de caja | ⏳ |
| Nómina | ⏳ |

### Purchasing

| Criterio | Release objetivo |
|----------|-----------------|
| Purchase Order CRUD | v1.0 |
| PO → Document flow | v1.0 |
| Receiving + stock in | v1.0 |

---

## Domain Health Dashboard

Métrica usada para detectar cuándo el dominio crece sin control.

| Métrica | Valor | Tendencia |
|---------|-------|-----------|
| **Aggregates** | 27 | 🟢 |
| **Repositories** | 11 | 🟢 |
| **Domain Events** | 14 (sale.*) + ~8 (document.*) + varios = ~58 | 🟢 |
| **Use Cases** | ~143 (estimado) | 🟡 — monitorear |
| **Invariants** | 92 (estimado) | 🟢 |
| **ADRs** | 8 | 🟡 — subir a 10+ |
| **Unit Tests** | 477 | 🟢 |
| **Contract Tests** | 0 | 🔴 |
| **Integration Tests** | 0 | 🔴 |
| **E2E Tests** | 0 | 🔴 |
