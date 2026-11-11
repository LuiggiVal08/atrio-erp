# Domain Decisions — Epic 01: Venta POS V1

> Cinco decisiones de dominio que condicionan el modelo, los repositorios y las transacciones.
> Resueltas antes de escribir código del Slice 1.

---

## DD-001: ¿Una venta POS es un SalesOrder?

**Decisión: POSSale *es* SalesOrder.**

| Opción | Descripción | Veredicto |
|--------|------------|-----------|
| `POSSale → genera → SalesOrder` | La venta POS crea una orden separada | ❌ Duplica el aggregate, rompe trazabilidad |
| `POSSale *es* SalesOrder` | La venta POS es un tipo concreto de venta | ✅ Extiende el modelo existente |

### Consecuencias

- `SalesOrder.type = 'pos'` (ya existe en la entidad y en Prisma)
- El endpoint no se llama `/pos/orders`, se llama **`/pos/sales`**
- `POSSale` no es una entidad nueva; es un **servicio de aplicación** (`PosSaleService`) que opera sobre `SalesOrder` con reglas POS-specific
- `SalesOrder.status` usa los estados del ciclo de vida POS (DD-003), no los estados genéricos de Document

### ¿Y `SalesInvoice`?

En un POS, la venta y la factura ocurren al mismo tiempo (no hay "facturar después"). Por tanto:

- `POST /pos/sales/:id/checkout` genera `SalesInvoice` y `Document` simultáneamente
- `SalesInvoice` es el comprobante fiscal de la venta; `SalesOrder` es el registro de negocio
- Ambos referencian el mismo `Document`

```
POSSale (transacción POS)
  ├── SalesOrder (type='pos') — registro de la venta
  ├── SalesInvoice — comprobante fiscal (se genera en checkout)
  └── Document (type='sales_invoice') — máquina de estados
```

---

## DD-002: ¿Quién es el dueño del Document?

**Decisión: El Document Engine es el único que escribe sobre Document.**

### Flujo

```
PosSaleService.create()
  │
  ├── 1. Validar Partner (CUSTOMER)
  ├── 2. Validar productos + stock
  ├── 3. Llamar a CreateDocumentUseCase
  │      └── DocumentEngine crea Document (DRAFT)
  ├── 4. Crear SalesOrder (type='pos')
  │      └── Referencia documentId
  └── 5. Devolver { saleId, documentId }
```

### Reglas

- Ningún servicio fuera de `document-engine/` hace `prisma.document.create()` directamente
- `QuickSaleService` actualmente crea Document via evento (`'document.created'`) — **eso se elimina**: debe usar `CreateDocumentUseCase`
- El `SalesOrder` referencia `documentId` como FK, no al revés
- Las transiciones de estado (submit → approve → pay) se hacen a través del Document Engine

### ¿Por qué?

- El Document Engine es el único que conoce las reglas de numeración (`{PREFIX}-YYYYMMDD-{SEQ}`)
- Es el único que emite `document.*` events de forma consistente
- Garantiza que el `DocumentEvent` history se registre siempre

---

## DD-003: Ciclo de vida de una venta POS

### Estados

```
[borrador] ──checkout──▶ [pendiente_pago] ──payment──▶ [pagada] ──sync──▶ [completada]
     │                                                        │
     └──cancel──▶ [cancelada]                                 └──cancel──▶ [cancelada]
```

| Estado | Significado | ¿Stock? | ¿Modificable? |
|--------|------------|---------|---------------|
| `borrador` | Armando la venta (líneas, cliente) | No reservado | ✅ |
| `pendiente_pago` | Checkeado, esperando pago | No reservado | ❌ líneas, solo método de pago |
| `pagada` | Pago registrado, stock deducido, irreversible | ✅ Deducido | ❌ |
| `completada` | Sync fiscal, eventos publicados | ✅ | ❌ |
| `cancelada` | Venta anulada | No aplica | ❌ |

### Mapeo a Document states

| POS Status | Document Status |
|------------|-----------------|
| `borrador` | `draft` |
| `pendiente_pago` | `pending_approval` |
| `pagada` | `approved` |
| `completada` | `paid` |
| `cancelada` | `cancelled` |

El POS no usa `delivered` ni `pending_fiscal` ni `posted`.

### ¿Por qué `pendiente_pago` no reserva stock?

Porque entre el checkout y el pago pueden pasar minutos. En un POS presencial son segundos, pero si el pago falla (tarjeta rechazada), no queremos huecos en inventario. La reserva de stock ocurre **solo después del pago exitoso**.

---

## DD-004: ¿Qué se congela al confirmar la venta?

### Se congela en checkout (al pasar a `pendiente_pago`)

| Dato | Fuente | ¿Congelado? |
|------|--------|-------------|
| Precio unitario del producto | `Product.unitPrice` al momento del checkout | ✅ |
| Impuestos (tasa y monto) | `FiscalEngine.calculateTaxes()` al checkout | ✅ |
| Tipo de cambio | `CurrencyRate` vigente al checkout | ✅ |
| Descuentos por línea | Input del cajero (validado contra reglas) | ✅ |
| Cliente (Partner) | El seleccionado al checkout | ✅ |

### No se congela (vive en la entidad referenciada)

| Dato | Razón |
|------|-------|
| Nombre del producto | Se toma del `DocumentLine.description`, que se copia en checkout |
| IVA vigente mañana | No afecta — el cálculo usó la tasa del momento |

### Implementación

- `DocumentLine` almacena `unitPrice`, `taxRate`, `taxAmount`, `discountRate`, `discountAmount`, `lineTotal` — todos congelados
- `SalesOrder` almacena `subtotal`, `taxAmount`, `total`, `currency` — congelados
- `SalesInvoice` almacena los mismos totales + exchange rate en el momento del checkout

---

## DD-005: ¿Cuándo se ejecutan operaciones irreversibles?

### Orden estricto

```
Documento (aprobación)
  │
  ▼
Validación (stock suficiente, caja abierta)
  │
  ▼
Pago autorizado (movimiento de caja)
  │
  ▼
Stock deducido (evento document.approved → StockEventHandler)
  │
  ▼
Eventos publicados (document.paid, sale.completed)
  │
  ▼
Confirmación (status = pagada)
```

### Reglas

1. **Stock nunca se descuenta antes del pago** — el `document.approved` event se emite DESPUÉS de registrar el pago, no antes.
2. **Si el pago falla**, la transacción se revierte y el documento vuelve a `pendiente_pago` — el stock nunca se tocó.
3. **Si el stock es insuficiente al validar**, se rechaza el pago con error específico por producto.
4. **Cash movement** se crea en la misma transacción que el pago — si una falla, ambas fallan.
5. **Eventos** se publican después del commit de la transacción (outbox pattern implícito via NestJS `EventEmitter2` — es síncrono, así que si un handler falla, la transacción se revierte).

### Implementación

```
Prisma.$transaction(async (tx) => {
  1. Validar stock (SELECT ... FOR UPDATE)
  2. Actualizar Document a 'approved' (con guard de concurrencia)
  3. Crear DocumentEvent 'document.approved'
  4. Actualizar Document a 'paid'
  5. Crear DocumentEvent 'document.paid'
  6. Actualizar SalesOrder status = 'pagada'
  7. Crear CashMovement (type='in')
  8. Crear/actualizar SalesInvoice status = 'paid', paidAt = now
});

// Después del commit exitoso:
emitter.emit('document.approved', payload);  // StockEventHandler descuenta
emitter.emit('document.paid', payload);       // CashMovementEventHandler registra
```

El handler de `document.approved` (StockEventHandler) ejecuta `stockService.adjust()` dentro de su propia transacción. Si esa transacción falla, la venta ya está pagada — pero el stock no se descontó. Esto es un **riesgo aceptado para V1**, mitigado con:
- Validación de stock suficiente ANTES del pago
- Operación idempotente (si StockEventHandler falla, se reintenta)
- Dashboard de conciliación (futuro)

---

## Tabla resumen

| # | Decisión | Respuesta |
|---|----------|-----------|
| 1 | ¿Qué es una venta POS? | `SalesOrder` con `type='pos'`, endpoint `/pos/sales` |
| 2 | ¿Quién crea Document? | Solo `DocumentEngine` vía `CreateDocumentUseCase` |
| 3 | Ciclo de vida | `borrador → pendiente_pago → pagada → completada` (5 estados) |
| 4 | ¿Qué se congela? | Precios, impuestos, tasa de cambio, descuentos al hacer checkout |
| 5 | ¿Cuándo se descuenta stock? | Después del pago exitoso, dentro de la misma transacción |

---

## Implicaciones para Slice 1

### Alcance del Slice 1 (redefinido)

`POST /pos/sales` — Crear venta en estado `borrador`:
- Crear SalesOrder con type='pos', status='borrador'
- Crear Document vía `CreateDocumentUseCase` (DRAFT)
- NO reservar stock aún
- NO calcular impuestos aún (se calculan en checkout)
- NO crear SalesInvoice aún

`GET /pos/sales/:id` — Consultar venta:
- Devuelve SalesOrder + Document info + líneas
- Líneas se leen de `DocumentLine`

`PATCH /pos/sales/:id` — Editar venta en borrador:
- Cambiar cliente, agregar/quitar líneas, ajustar cantidades
- Solo permitido si status = 'borrador'

`DELETE /pos/sales/:id` — Descartar borrador:
- Soft delete del Document + SalesOrder
- Solo permitido si status = 'borrador'

### Lo que NO incluye Slice 1

- Checkout (pasar a `pendiente_pago`) → Slice 2
- Cálculo de impuestos vía Fiscal Engine → Slice 2
- Pago y descuento de stock → Slice 2
- Cash movement → Slice 2
- Comprobante → Slice 4
