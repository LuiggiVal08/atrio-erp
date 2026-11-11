# Testing Strategy

> Cómo se prueban los bounded contexts, qué tipo de tests usar en cada capa, y qué cubrir. Después de leer esto, un desarrollador debe saber exactamente qué y cómo probar.

---

## Pirámide de tests

```
        ╱╲
       ╱ E2E ╲              ← 10% (flujos críticos cross-context)
      ╱────────╲
     ╱Integration╲          ← 30% (repositorios + casos de uso con DB real)
    ╱──────────────╲
   ╱   Unit Tests   ╲       ← 60% (dominio + aplicación con mocks)
  ╱────────────────────╲
```

---

## Unit tests (60%)

### Dominio (entidades, VOs, servicios de dominio)

- Sin dependencias externas (no mock, no DB, no HTTP)
- Prueban invariantes del dominio
- Prueban cambios de estado en Aggregate Roots

```ts
// __tests__/unit/domain/sale-order.test.ts
describe('SaleOrder', () => {
  it('should create with PENDING status')
  it('should confirm and emit SaleConfirmed')
  it('should throw if cancelled order is confirmed')
  it('should calculate total correctly')
  it('should not allow negative quantities')
})
```

### Aplicación (casos de uso)

- Dependencias mockeadas (repositorios, puertos)
- Prueban orquestación del caso de uso
- Verifican que se llamen los métodos correctos del dominio y los puertos

```ts
// __tests__/unit/application/confirm-sale.test.ts
describe('ConfirmSaleUseCase', () => {
  it('should confirm sale order')
  it('should publish SaleConfirmed event')
  it('should throw if order not found')
  it('should throw if stock is insufficient')
})
```

---

## Integration tests (30%)

### Repositorios (con Prisma real)

- Usan una base de datos de prueba (PostgreSQL + testcontainer o DB dedicada)
- Prueban persistencia y recuperación de Aggregate Roots completos
- Verifican que el mapeo Domain ↔ Prisma sea correcto

```ts
// __tests__/integration/prisma-sale-order.repository.test.ts
describe('PrismaSaleOrderRepository', () => {
  it('should save and retrieve sale order with lines')
  it('should find pending orders')
  it('should handle concurrent saves correctly')
})
```

### Casos de uso con DB real

- Mismos casos de uso, pero sin mockear repositorios
- Verifican que el flujo completo (Application → Domain → Infrastructure) funcione

```ts
// __tests__/integration/confirm-sale.integration.test.ts
describe('ConfirmSaleUseCase (integration)', () => {
  it('should persist confirmed order in database')
  it('should update stock after confirmation')
})
```

---

## E2E tests (10%)

- HTTP request → DB verification
- Cubren flujos críticos multi-context
- Usan la misma configuración que producción (con datos de prueba)

```ts
// test/e2e/sales/create-sale.e2e-spec.ts
describe('POST /api/v1/sales/orders (E2E)', () => {
  it('should create order and update stock')
  it('should create order and register payment')
  it('should reject order with insufficient stock')
  it('should return 401 without auth token')
  it('should return 403 for wrong tenant')
})
```

---

## Cobertura requerida

| Tipo | Cobertura mínima | Crítico |
|------|-----------------|---------|
| Unit tests (Domain) | > 90% | Sí |
| Unit tests (Application) | > 80% | Sí |
| Integration tests | > 60% | Sí |
| E2E (flujos core) | > 40% | Sí |
| E2E (seguridad) | 100% de los endpoints protegidos | Sí |

**Regla:** Ningún merge puede reducir la cobertura general por debajo del 80% en unit tests.

---

## Test Data Builders

Para evitar que los tests se acoplen a la construcción de agregados complejos:

```ts
// sales/__tests__/builders/sale-order.builder.ts
export class SaleOrderBuilder {
  private id = new SaleOrderId(uuid())
  private customerId = new CustomerId(uuid())
  private items = [new OrderLineBuilder().build()]
  private status = OrderStatus.PENDING

  withId(id: SaleOrderId): SaleOrderBuilder { this.id = id; return this }
  withCustomerId(id: CustomerId): SaleOrderBuilder { this.customerId = id; return this }
  withStatus(status: OrderStatus): SaleOrderBuilder { this.status = status; return this }
  withItems(items: OrderLine[]): SaleOrderBuilder { this.items = items; return this }

  build(): SaleOrder {
    const order = SaleOrder.create(this.id, this.customerId, this.items)
    if (this.status === OrderStatus.CONFIRMED) order.confirm()
    return order
  }
}

// Uso en tests:
const confirmedOrder = new SaleOrderBuilder()
  .withStatus(OrderStatus.CONFIRMED)
  .build()
```

---

## Mocks

- Solo se mockean puertos externos (ports/out)
- No se mokean entidades de dominio ni Value Objects
- Los mocks se crean con `jest.fn()` o `ts-mockito`

```ts
const repository = {
  findById: jest.fn(),
  save: jest.fn(),
}

const eventBus = {
  publish: jest.fn(),
}

const useCase = new ConfirmSaleUseCase(repository, eventBus)
```

---

## Lo que NO se prueba

- Código generado por Prisma
- Configuración de NestJS (los módulos se prueban en integración)
- Templates HTML (pruebas visuales, no unitarias)
- Código de terceros (se asume que funciona)
