# Transaction Boundaries — Atrio ERP

> Define qué operaciones son una sola transacción, cuáles son varias, y dónde se emiten eventos.
> Fundamental para evitar transacciones anidadas, estados inconsistentes, y eventos huérfanos.
>
> **Importante**: Los eventos de dominio se emiten post-commit. Ya NO ejecutan lógica de negocio
> (la consistencia está garantizada por la transacción). Su propósito es **comunicar el hecho consumado**
> a consumidores como BI, CRM, alertas, auditoría y analytics.

---

## Reglas generales

1. **Cada línea = una transacción Prisma `$transaction`**. Nunca una transacción dentro de otra.
2. **Eventos se emiten post-commit** (después del `$transaction` exitoso, no dentro).
3. **Handlers de eventos ejecutan su propia transacción** — si fallan, no revierten la transacción padre.
4. **Operaciones irreversibles** (stock, caja) usan pessimistic lock (`SELECT ... FOR UPDATE`).
5. **Reads de validación** (stock disponible, caja abierta) ocurren DENTRO de la transacción, no antes.

---

## Mapa de transacciones

### POS — Draft Lifecycle

| Use Case | Una TX | Operaciones dentro de la TX | Eventos post-commit |
|----------|--------|----------------------------|---------------------|
| `createDraft` | ✅ | INSERT sales_order (+ lines) | `sale.created` |
| `updateDraft` | ✅ | UPDATE sales_order + líneas (delete + recreate) | `sale.updated`, `sale.line_*` |
| `deleteDraft` | ✅ | DELETE sales_order (cascade lines) | `sale.deleted` |

### POS — Checkout

| Use Case | Una TX | Operaciones dentro de la TX | Eventos post-commit |
|----------|--------|----------------------------|---------------------|
| `checkout` | **NO** (2 TX) | TX1: Document.create (DRAFT). TX2: Document.update (→ PENDING_APPROVAL) + SalesOrder.update | `sale.checkout_completed` |

> **⚠️ Riesgo conocido**: TX1 y TX2 no están envueltas en una sola transacción. Si el proceso falla entre TX1 y TX2, queda un Document en DRAFT huérfano.
>
> **Mitigación V1**: El scheduler de limpieza de borradores puede eliminar Documents DRAFT > 24h.
> **Solución futura**: Migrar a una sola TX usando `Prisma.$transaction()` con `updateStatus` que acepte estado inicial.

### POS — Payment

| Use Case | Una TX | Operaciones dentro de la TX | Eventos post-commit |
|----------|--------|----------------------------|---------------------|
| `payment` | **NO** (3 TX) | TX1 (ApproveDocumentUseCase): Document → APPROVED + event log. TX2 (TransitionDocumentUseCase): Document → PAID + event log. TX3 (manual): CashRegister.update(balance) + CashMovement.create + SalesOrder.update | `document.approved` → StockEventHandler, `document.paid` → CashMovementEventHandler, `sale.payment_completed` |

> **⚠️ Riesgo conocido**: TX1, TX2, TX3 son independientes. Si TX2 falla, Document queda APPROVED pero no PAID (stock ya deducido por handler de TX1). Si TX3 falla, Document está PAID pero SalesOrder no.
>
> **Mitigación V1**: El Document FSM garantiza que APPROVED → PAID es válido. El StockEventHandler descuenta con su propia TX (no reversible por fallo de pago). Si TX3 falla, el Dashboard de conciliación detecta Document PAID con SalesOrder sin pagar.
> **Solución futura**: Unificar en una sola TX usando `$transaction` con `updateMany` + optimistic lock en Document (ya implementado en repositorio).

### Document Engine

| Use Case | Una TX | Operaciones dentro de la TX | Eventos post-commit |
|----------|--------|----------------------------|---------------------|
| `createDocument` | ✅ | INSERT document + lines | `document.created` (vía audit interceptor) |
| `submitDocument` | ✅ | UPDATE status → PENDING_APPROVAL | — |
| `approveDocument` | ✅ | UPDATE status → APPROVED + INSERT event | `document.approved` |
| `payDocument` (transition) | ✅ | UPDATE status → PAID + INSERT event | `document.paid` |
| `cancelDocument` (transition) | ✅ | UPDATE status → CANCELLED + INSERT event | `document.cancelled` |

### Event Handlers (post-commit)

| Handler | TX propia | Operaciones | Riesgo |
|---------|-----------|-------------|--------|
| `StockEventHandler.handleDocumentApproved` | ✅ | StockService.adjust() para cada línea | **ALTO**: si falla, stock no se descuenta pero Document ya está APPROVED |
| `CashMovementEventHandler.handleDocumentPaid` | ✅ | CashMovementService.register() | **MEDIO**: si falla, movimiento no se registra pero Document ya está PAID |

> **Mitigación V1**: Validación de stock suficiente ANTES del approve (en payment). Handlers idempotentes (reintentar si fallan).
> **Solución futura**: Outbox pattern — eventos se persisten en la misma TX y un worker los publica.

---

## Estrategia de Locking

| Recurso | Lock | Razón |
|---------|------|-------|
| **Stock** | Pessimistic (`SELECT ... FOR UPDATE`) | Recurso físico compartido entre cajas. Race condition real si dos vendedores venden el último producto. |
| **Document** | Optimistic (`updateMany` con guard `WHERE status = :previousStatus`) | Baja contención. Dos personas no aprueban el mismo documento simultáneamente. |
| **Cash Register balance** | Pessimistic (increment atómico `balance + delta`) | Race condition si dos pagos ocurren al mismo tiempo. |
| **Partner** | Optimistic | Baja contención. Ediciones simultáneas improbables. |
| **Product** | Optimistic | Baja contención. Solo admin edita precios. |
| **SalesOrder** | Optimistic (vía `updateOrderStatus`) | Baja contención. Solo un flujo paga la misma orden. |

### Granularidad del FOR UPDATE en Stock

| Aspecto | Decisión |
|---------|----------|
| **¿Qué filas se bloquean?** | Solo las filas de `stock` donde `product_id` y `warehouse_id` coinciden con las líneas del documento que se está pagando. No se bloquean productos no relacionados. |
| **¿Un producto en 12 almacenes?** | Solo se bloquea la fila del almacén específico que aparece en la línea del documento. Los otros 11 almacenes no se ven afectados. |
| **¿Lotes / seriales?** | Hoy no hay lotes ni seriales. Cuando lleguen, el lock debe aplicarse a nivel de lote (`stock_by_lot`), no de producto. Se documentará en ese momento. |
| **Deadlock risk?** | Bajo. Todas las transacciones bloquean en el mismo orden (por `productId_warehouseId`). Ninguna transacción bloquea en orden inverso. |

### Idempotency TTL

| Aspecto | Decisión |
|---------|----------|
| **TTL** | 1 hora (3600 segundos) |
| **¿Por qué 1h?** | Suficiente para cubrir timeouts de red y reintentos de usuario. Una caja POS no espera más de 1h para reintentar un pago fallido. |
| **¿Por qué no 24h?** | Las claves idempotentes ocupan memoria en Redis. 24h acumularía claves innecesarias. Además, después de 1h, si el cliente reintenta, es una nueva intención de pago (la ventana de doble clic ya pasó). |
| **¿Por qué no permanente?** | Las claves permanentes requerirían limpieza periódica o Redis con memoria infinita. No hay caso de negocio que justifique recordar un idempotency key para siempre. |
| **¿Qué pasa si el TTL expira y el cliente reintenta?** | El reintento se trata como una nueva petición. Si la venta ya se pagó, el `WHERE status = 'pending_payment'` en la transacción evitará el doble pago (optimistic lock). |
| **¿Qué pasa si Redis cae?** | El `IdempotencyInterceptor` no bloquea la operación. Sin Redis, no hay protección de idempotencia, pero el optimistic lock en la base de datos sigue protegiendo contra doble pago. |

---

## Mapa visual

```
┌──────────────────────────────────────────────────────────────┐
│  PAYMENT (3 transacciones separadas)                         │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ TX1: approveDocumentUseCase                             │ │
│  │  • Document.update(status→APPROVED, approvedById, ...)  │ │
│  │  • DocumentEvent.create('document.approved')            │ │
│  │  → post-commit: document.approved → StockEventHandler   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ TX2: transitionDocumentUseCase(targetStatus=PAID)       │ │
│  │  • Document.update(status→PAID)                         │ │
│  │  • DocumentEvent.create('document.paid')                │ │
│  │  → post-commit: document.paid → CashMovementEventHandler│ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ TX3: manual (service layer)                              │ │
│  │  • CashRegister.update(balance + delta)                  │ │
│  │  • CashMovement.create(type='in')                        │ │
│  │  • SalesOrder.update(status=PAID)                        │ │
│  │  → post-commit: sale.payment_completed                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                              │
│  Si TX1 falla → no se ejecuta TX2 ni TX3.                    │
│  Si TX1 ok, TX2 falla → Document APPROVED, stock ya         │
│    deducido, Document no PAID.                               │
│  Si TX1+TX2 ok, TX3 falla → Document PAID, caja no         │
│    actualizada, SalesOrder en PENDING_PAYMENT.              │
└──────────────────────────────────────────────────────────────┘
```

---

## Regla para nuevos desarrollos

> **Toda operación que modifique más de un aggregate debe estar documentada aquí antes de implementarse.**

Si alguien agrega una nueva capacidad que toca Document + Stock + Cash en la misma operación, debe:

1. Agregar una fila en la tabla de arriba.
2. Justificar por qué no se puede unificar en una sola TX.
3. Documentar el riesgo y la mitigación.
