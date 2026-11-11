# Epic H-001 — Transaction Hardening

> No agrega funcionalidad. Hace que el sistema sobreviva en producción.
> **Regla**: No se abre ningún epic nuevo de negocio hasta que H-001 esté completo.
>
> **Estado**: ✅ Completado (H-001.0 a H-001.6 implementados; H-001.7 y H-001.8 son complementarios)

---

## H-001.0 — Transaction Boundaries

| Campo | Valor |
|-------|-------|
| **Estado** | ✅ Completado |
| **Documento** | `transaction-boundaries.md` |
| **Entrega** | Mapa de transacciones del POS, estrategia de locking, riesgos documentados. ADR-0007 creado. |

---

## H-001.1 — Idempotency

### Problema

Doble clic en checkout o payment crea:

- Dos Documents para la misma venta
- Dos pagos para la misma venta
- Dos descuentos de stock para los mismos productos

### Solución

`Idempotency-Key` header en todos los comandos críticos:

| Endpoint | Key | Comportamiento |
|----------|-----|----------------|
| `POST /pos/sales/:id/checkout` | `sha256(saleId + userId + timestamp)` | Si key ya existe → devuelve resultado anterior (200, no 201) |
| `POST /pos/sales/:id/pay` | `sha256(saleId + paymentMethodId)` | Si key ya existe → devuelve 200 con estado actual |
| `POST /pos/sales/:id/cancel` | `saleId + "-cancel-" + timestamp` | Idempotente por naturaleza (cancelar ya cancelado → 200) |

### Implementación

```typescript
// IdempotencyMiddleware o guard
@Injectable()
export class IdempotencyGuard {
  constructor(private readonly redis: RedisService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const key = req.headers['idempotency-key'];
    if (!key) return true; // Opcional: requerir key

    const previous = await this.redis.get(`idempotency:${key}`);
    if (previous) {
      // Devolver respuesta cacheada
      req.idempotencyResult = JSON.parse(previous);
      return true; // Controller checkea req.idempotencyResult
    }

    // Almacenar key para evitar duplicados
    await this.redis.set(`idempotency:${key}`, 'pending', 'EX', 3600);
    req.idempotencyKey = key;
    return true;
  }
}
```

### Criterios de aceptación

1. `POST /pos/sales/:id/checkout` con misma key dos veces → segundo request devuelve 200 (no 201) con mismos datos
2. `POST /pos/sales/:id/pay` con misma key dos veces → segundo request retorna 200 con estado actual
3. Sin key → comportamiento normal (sin breaking change)
4. Key expira después de 1 hora
5. Key `pending` por más de 30s se considera huérfana y permite reintento

---

## H-001.2 — Concurrency

### Stock (Pessimistic Lock)

**Hoy**: `StockService.getBalance()` hace un simple `findUnique` — race condition si dos cajas pagan simultáneamente el mismo producto.

**Solución**: En el payment, antes de approve, hacer `SELECT ... FOR UPDATE`:

```typescript
// Dentro de la transacción de payment
const stock = await this.prisma.$queryRaw`
  SELECT quantity FROM stock
  WHERE product_id = ${productId}
    AND warehouse_id = ${warehouseId}
  FOR UPDATE
`;
```

**Pero** — el `approveDocumentUseCase` y `transitionDocumentUseCase` tienen su propia TX. No podemos hacer SELECT FOR UPDATE fuera de su TX. Soluciones:

**Opción A (recomendada)**: Unificar payment en una sola TX y hacer FOR UPDATE antes del approve.

```typescript
await this.prisma.$transaction(async (tx) => {
  // 1. Lock stock rows
  for (const line of lines) {
    await tx.$queryRaw`SELECT quantity FROM stock WHERE ... FOR UPDATE`;
  }
  // 2. Validate stock
  // 3. Approve Document (via raw queries, no use cases)
  // 4. Pay Document
  // 5. Update CashRegister balance (increment)
  // 6. Create CashMovement
  // 7. Update SalesOrder status
});
```

**Opción B (puente)**: Agregar validación con FOR UPDATE en `PosSaleService.pay()` antes de llamar a los use cases. Los use cases ejecutan su propia TX, pero el lock se toma antes y se libera al commit de la TX del use case (que es más chica).

### Cash Register (Atomic Increment)

**Hoy**: `this.prisma.cashRegister.update({ where: { id }, data: { balance: { increment: amount } } })` — esto YA es atómico en PostgreSQL. No necesita cambio.

### Document (Optimistic Lock)

**Hoy**: `PrismaDocumentRepository.updateStatus()` usa `updateMany` con `WHERE status = :expectedPreviousStatus`. Si `result.count === 0`, la operación falla. Esto YA es optimistic lock. No necesita cambio.

---

## H-001.3 — Locking Strategy

Ver `transaction-boundaries.md` → sección "Estrategia de Locking".

**Resumen**:

| Recurso | Lock | Implementación |
|---------|------|----------------|
| Stock | Pessimistic | `SELECT ... FOR UPDATE` en la TX de payment |
| Document | Optimistic | `updateMany` con guard `WHERE status = :prev` |
| Cash Register | Atómico | `balance: { increment: delta }` de Prisma |
| Partner | Optimistic | Versión implícita (baja contención) |

**Decisión**: Usar **Opción A** (unificar payment en una sola TX) cuando se refactorice. Mientras tanto, **Opción B** como puente.

---

## H-001.4 — Event Handler Retry

### Problema

`StockEventHandler.handleDocumentApproved()` y `CashMovementEventHandler.handleDocumentPaid()` ejecutan fuera de la TX del documento. Si fallan (timeout, DB caída), el Document ya cambió de estado pero el stock/caja no se actualizó.

### Solución V1 (sin Outbox)

```typescript
@OnEvent('document.approved')
async handleDocumentApproved(payload: any) {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await this.stockService.adjust({ ... });
      return; // Éxito
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        // Log crítico + métrica
        this.logger.error(`Stock deduction failed after ${MAX_RETRIES} attempts`, {
          documentId: payload.documentId,
          error: err.message,
        });
        // Metric: stock_deduction_failed
        throw err; // Deja que NestJS loggee el error
      }
      await sleep(1000 * attempt); // Backoff: 1s, 2s, 3s
    }
  }
}
```

### Dashboard de conciliación (futuro)

Query que busca:
- Document `APPROVED` sin `StockMovement` correspondiente
- Document `PAID` sin `CashMovement` correspondiente
- SalesOrder `PENDING_PAYMENT` con `documentId` en Document `PAID`

---

## H-001.5 — Outbox Pattern ADR

### Status quo

```
TX (Prisma)
  ↓
commit
  ↓
EventEmitter2.emit()   ← síncrono, dentro del mismo proceso
  ↓
Handler escucha y ejecuta su propia TX
```

**Problema**: Si el proceso crashea entre commit y emit(), el evento se pierde.

### Propuesta (para v2+)

```
TX (Prisma)
  ├── Operaciones de negocio
  ├── INSERT en outbox_events (evento serializado)
  └── commit
       ↓
Worker (separado, poll cada 100ms)
       ↓
  Publica evento (RabbitMQ / Redis Stream)
       ↓
  Handler consume y ejecuta
       ↓
  Marca outbox_event como processed
```

**Por qué no ahora**: EventEmitter2 es síncrono y en-proceso. Para un POS monousuario en una PYME, el riesgo de crash entre commit y emit es bajo. El costo de implementar Outbox ahora (infraestructura de mensajería, worker, tabla outbox, transacciones distribuidas) no justifica el beneficio para V1.

**Decisión**: ADR — posponer a v2+. Documentado para que futuros desarrolladores sepan que existe.

### Criterios para activar Outbox

- [ ] Más de 10 cajas POS concurrentes
- [ ] Más de 1 servidor de API (horizontal scaling)
- [ ] Requisito de auditoría que exija "exactly-once delivery"
- [ ] Fallos de handlers recurrentes en producción

---

## H-001.6 — Business Metrics

| Campo | Valor |
|-------|-------|
| **Estado** | ✅ Completado |
| **Entrega** | `BusinessMetricsService`, `GET /metrics/business`, 5 métricas implementadas, instrumentación en checkout + pay |

### Dashboard

Métricas que deben exponerse como endpoint `GET /metrics/business` (prometheus format):

| Métrica | Tipo | Labels | Descripción |
|---------|------|--------|-------------|
| `pos_checkout_duration_seconds` | Histogram | tenant_id | Tiempo entre POST checkout y commit |
| `pos_payment_duration_seconds` | Histogram | tenant_id | Tiempo entre POST pay y commit |
| `pos_payments_total` | Counter | tenant_id, status | Total de pagos (ok/failed) |
| `pos_payment_errors_total` | Counter | tenant_id, error_type | Errores de pago (stock_insufficient, session_closed, etc.) |
| `pos_stock_conflicts_total` | Counter | tenant_id | Race conditions detectadas en stock |
| `pos_average_ticket` | Gauge | tenant_id | Ticket promedio del día |
| `pos_sales_per_hour` | Gauge | tenant_id | Ventas por hora |
| `pos_cash_open_duration_seconds` | Histogram | tenant_id | Tiempo que una caja permanece abierta |
| `pos_payment_distribution` | Gauge | tenant_id, method | Distribución de métodos de pago |

### Implementación V1

```typescript
// metrics.service.ts
@Injectable()
export class BusinessMetricsService {
  private readonly checkoutDuration = new Histogram({
    name: 'pos_checkout_duration_seconds',
    help: 'Checkout duration',
    labelNames: ['tenant_id'],
  });
  // ... más métricas

  observeCheckout(tenantId: string, durationMs: number): void {
    this.checkoutDuration.labels(tenantId).observe(durationMs / 1000);
  }
}
```

### Instrumentación

Agregar en `PosSaleService.checkout()` y `.pay()`:

```typescript
const start = performance.now();
// ... lógica
this.metrics.observeCheckout(tenantId, performance.now() - start);
```

---

---

## Clarificación arquitectónica (post-revisión)

> ⚠️ **Los eventos de dominio se emiten post-commit para comunicación, no para ejecución.**

El cambio a una transacción única movió la deducción de stock del `StockEventHandler` (evento `document.approved`) al interior de la transacción de pago. Esto es correcto para la consistencia.

Pero los eventos **no desaparecieron**: `sale.payment_completed` sigue emitiéndose después del commit. La diferencia es semántica:

| Antes | Ahora |
|-------|-------|
| `document.approved` → **ordena** deducir stock | `sale.payment_completed` → **notifica** que ocurrió |
| El handler **ejecuta** la acción | El handler **reacciona** al hecho (BI, CRM, alertas, analytics) |

Ver ADR-0007 para la justificación completa.

---

## H-001.7 — Business Invariants Tests (complementario)

| Campo | Valor |
|-------|-------|
| **Estado** | ✅ Completado |
| **Archivo** | `tests/unit/sales/sales-order-invariants.spec.ts` |
| **Entrega** | 20+ tests de domino que verifican invariantes: no modificar después de pago, no retroceder estados, no pagar dos veces, tenant ownership, cantidades positivas, etc. |

Estos tests verifican que el dominio se protege solo, independientemente de la capa de aplicación:

- `INV-SALE-004`: No modification after PENDING_PAYMENT (5 casos)
- `INV-030`: Sale cannot go back to DRAFT (4 casos)
- `INV-SALE-002`: Customer required (1 caso)
- `INV-SALE-003`: Positive line quantities (3 casos)
- `INV-052`: Cannot pay same sale twice (3 casos)
- `INV-SALE-001`: Tenant ownership (2 casos)
- Status order consistency (7 casos)
- OrderLine value integrity (2 casos)

---

## H-001.8 — Chaos Testing (complementario)

| Campo | Valor |
|-------|-------|
| **Estado** | ⚪ Pendiente — no bloqueante |
| **Propósito** | Verificar que el sistema se comporta correctamente cuando componentes fallan |

### Escenarios a probar (cuando se implemente)

| Escenario | Qué se prueba | Resultado esperado |
|-----------|---------------|-------------------|
| Redis cae durante checkout | Idempotency deshabilitada | Checkout funciona sin idempotencia; optimistic lock en DB previene duplicados |
| Redis cae durante payment | Idempotency deshabilitada | Payment funciona; FOR UPDATE + optimistic lock previenen doble pago |
| DB connection timeout en payment | FOR UPDATE timeout | Transacción falla, rollback, error 500; ningún estado inconsistente |
| Stock no existe para un producto | SELECT FOR UPDATE devuelve 0 filas | BadRequest: stock insuficiente; transacción no inicia |
| Cash register update falla | Error en balance increment | Rollback completo; Document no se aprueba, stock no se descuenta |
| Dos payments simultáneos mismo producto | FOR UPDATE serializa | Segundo pago espera al primero; si stock se agotó, segundo falla con 409 |

### Implementación

No se implementa ahora. Se documentan los escenarios para que el equipo QA los cubra cuando exista un entorno de staging.

---

## Criterios de salida del Epic H-001

- [x] H-001.0: Transaction boundaries documentado y revisado
- [x] H-001.1: Idempotency-Key implementada en checkout y payment
- [x] H-001.2: Stock usa pessimistic lock en payment (Prisma $transaction + FOR UPDATE)
- [x] H-001.3: Locking strategy documentada en `transaction-boundaries.md`
- [x] H-001.4: Handlers tienen retry con backoff (3 intentos, 1s/2s/3s)
- [x] H-001.5: Outbox ADR escrito (diferido a v2+)
- [x] H-001.6: Business metrics expuestas en `/metrics/business`
- [x] H-001.7: Business invariants tests (20+ tests de dominio)
- [ ] H-001.8: Chaos testing scenarios documentados (QA)
- [ ] Contract tests pasan (checkout + payment shape) — diferido a CI
- [x] 0 regresiones en unit tests (453/453)
