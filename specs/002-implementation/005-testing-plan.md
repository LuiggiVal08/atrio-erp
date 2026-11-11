# Testing Plan

> Qué se prueba, cuándo y cómo en cada fase del desarrollo.

---

## Por fase

### Sprint 0

| Tipo | Qué se prueba | Entrada |
|------|--------------|---------|
| Unit | Domain entities, VOs, services | Inmediato (TDD) |
| Integration | Repositorios con Prisma real | Al completar infraestructura |
| E2E | Flujo completo: Empresa → Venta → Caja → Auditoría | Al final del sprint |

**Meta:** Validar que el esqueleto arquitectónico funciona.

### P1 (MVP)

| Tipo | Qué se prueba | Cobertura mínima |
|------|--------------|-----------------|
| Unit (Domain) | Entidades, VOs, invariantes, eventos | > 90% |
| Unit (Application) | Casos de uso con puertos mockeados | > 80% |
| Integration | Repositorios + casos de uso con DB real | > 60% |
| E2E | Flujos core (crear producto → vender → cobrar) | > 40% |

### P2+

| Tipo | Se mantienen los mismos estándares de P1 |
|------|-----------------------------------------|

---

## Por capa

### Domain

```ts
// Sin dependencias de infraestructura
describe('SaleOrder', () => {
  it('should confirm and emit SaleConfirmed')
  it('should throw if cancelled order is confirmed')
  it('should calculate total correctly')
  // Sin mocks, sin DB, sin HTTP
})
```

### Application

```ts
// Dependencias mockeadas
describe('ConfirmSaleUseCase', () => {
  it('should confirm sale order')
  it('should publish SaleConfirmed event')
  it('should throw if stock is insufficient')
  // Repository mockeado, EventBus mockeado
})
```

### Infrastructure

```ts
// Con Prisma real (testcontainer o DB de prueba)
describe('PrismaSaleOrderRepository', () => {
  it('should save and retrieve sale order with lines')
  it('should find pending orders')
  // PrismaService real, base de datos PostgreSQL
})
```

### E2E

```ts
// HTTP request → DB verification
describe('POST /api/v1/sales/orders', () => {
  it('should create order and update stock')
  it('should register payment in cash management')
  it('should return 422 if stock insufficient')
})
```

---

## TDD obligatorio

Por Principio III de la Constitución:

1. Escribir el test que falla (red)
2. Escribir la implementación mínima para que pase (green)
3. Refactorizar manteniendo tests verdes (refactor)

Esto aplica a:
- Entidades de dominio (invariantes)
- Value Objects (validación en construcción)
- Domain Services (reglas de negocio)
- Casos de uso (orquestación)

---

## CI pipeline

```
Push → lint → typecheck → unit tests → build → integration tests → E2E tests
```

| Paso | Falla si |
|------|---------|
| `lint` | Violaciones de Biome |
| `typecheck` | Errores de TypeScript |
| `unit tests` | Tests fallan o cobertura < 80% |
| `build` | No compila |
| `integration tests` | Tests fallan |
| `E2E tests` | Tests fallan |

**Sin pipeline verde, no hay merge.**
