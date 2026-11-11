# Event Guidelines

> Cómo diseñar, nombrar y manejar eventos de dominio. Después de leer esto, un desarrollador debe poder crear un nuevo evento y saber cómo emitirlo y consumirlo correctamente.

---

## Domain Events vs Integration Events

| | Domain Event | Integration Event |
|---|---|---|
| **Propósito** | Hecho del negocio que cambió el estado del dominio | Notificación a sistemas externos |
| **Consumidores** | Otros bounded contexts dentro de Atrio | ODALX products, API pública, BI, terceros |
| **Formato** | Clase TypeScript con datos del dominio | Traducción explícita (posiblemente serializada) |
| **Evolución** | Cambia con el modelo de dominio | Versionado (no rompe contratos externos) |
| **Bus** | In-process (misma transacción) | Cola distribuida (futuro) |

**Regla:** Todo Integration Event es una traducción explícita de un Domain Event. No se emiten Integration Events sin que exista su Domain Event correspondiente.

---

## Nomenclatura

### Domain Events

Nombres en **pasado** (algo ya ocurrió):

```
SaleConfirmed
InvoiceIssued
StockChanged
EmployeeHired
PayrollProcessed
TaxRuleChanged
```

**Regla:** `[Entidad][Acción en pasado]`

### Event Handlers

```
SaleConfirmedHandler
InvoiceIssuedHandler
StockChangedHandler
```

**Regla:** `[EventName]Handler`

---

## Estructura de un Domain Event

```ts
// domain/events/sale-confirmed.event.ts
import { DomainEvent } from '@shared/domain/domain-event'

export class SaleConfirmed extends DomainEvent {
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly total: Money,
    readonly items: OrderLineDto[],
    readonly confirmedAt: Date,
  ) {
    super()
  }
}
```

**Reglas:**
- Inmutable (todas las propiedades `readonly`)
- Sin lógica de negocio
- Sin métodos (solo datos)
- Extiende `DomainEvent` base (que provee `eventId`, `occurredOn`, `eventName`)

---

## Cómo emitir un evento

### 1. El Aggregate Root crea el evento

```ts
class SaleOrder extends Entity<SaleOrderId> {
  private events: DomainEvent[] = []

  confirm(): void {
    if (this.status === OrderStatus.CONFIRMED) return
    if (this.status === OrderStatus.CANCELLED) throw new InvalidOrderStatusError()

    this.status = OrderStatus.CONFIRMED
    this.events.push(new SaleConfirmed(
      this.id.value,
      this.customerId.value,
      this.total,
      this.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      new Date(),
    ))
  }

  pullEvents(): DomainEvent[] {
    const events = this.events
    this.events = []
    return events
  }
}
```

### 2. El caso de uso publica los eventos

```ts
class ConfirmSaleUseCase {
  async execute(dto: ConfirmSaleDto): Promise<void> {
    const order = await this.repository.findById(new SaleOrderId(dto.orderId))
    if (!order) throw new EntityNotFoundError('SaleOrder', dto.orderId)

    order.confirm()
    await this.repository.save(order)

    const events = order.pullEvents()
    for (const event of events) {
      await this.eventBus.publish(event)
    }
  }
}
```

### 3. El bus distribuye a los handlers

Los handlers se registran en NestJS:

```ts
// sales.module.ts
@Module({
  providers: [
    ConfirmSaleUseCase,
    SaleConfirmedHandler,   // ← registrado como consumer
  ],
})
```

```ts
// handlers/sale-confirmed.handler.ts
@Injectable()
export class SaleConfirmedHandler {
  constructor(
    private readonly inventoryService: InventoryService,
  ) {}

  @OnEvent(SaleConfirmed.name)
  async handle(event: SaleConfirmed): Promise<void> {
    // Inventory descuenta stock
    for (const item of event.items) {
      await this.inventoryService.reserveStock(item.productId, item.quantity)
    }
  }
}
```

---

## Eventos entre bounded contexts (cross-context)

Un contexto emite un Domain Event que otro contexto consume:

```
Sales emite:  SaleConfirmed
Inventory consume:  SaleConfirmedHandler → descuenta stock
Cash Management consume:  SaleConfirmedHandler → registra cobro esperado
```

**Reglas:**
- El emisor no sabe quién consume sus eventos
- El consumidor no modifica al emisor
- Los eventos entre contexts son asíncronos (in-process → cola en el futuro)
- El handler nunca lanza excepciones que afecten al emisor

---

## Eventos síncronos (excepciones justificadas)

Solo para operaciones POS que requieren respuesta inmediata:

```ts
// ports/out/stock-availability-query.port.ts
export interface IStockAvailabilityQuery {
  check(productId: string, warehouseId: string, quantity: number): Promise<boolean>
}
```

Se implementa como consulta síncrona (no evento) y se documenta como excepción en `001-system-architecture.md`.

---

## Eventos prohibidos

```ts
// ✖ Prohibido: nombre en presente
SaleConfirmed ❌
SaleConfirm   ✔
SaleConfirmed ✔

// ✖ Prohibido: acción en lugar de hecho
UpdateInventory ❌
InventoryUpdated ✔

// ✖ Prohibido: datos sensibles en el evento
SaleConfirmed {
  creditCardNumber: string   // ✖ NUNCA
}
```

---

## Outbox pattern (futuro)

Cuando se introduzca mensajería distribuida:

1. El caso de uso persiste el evento en la tabla `outbox` dentro de la misma transacción
2. Un proceso separado lee `outbox` y publica en la cola
3. Garantiza entrega at-least-once sin consistencia distribuida

Por ahora, los eventos se emiten en el mismo proceso (NestJS EventEmitter).
