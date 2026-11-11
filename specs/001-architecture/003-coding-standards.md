# Coding Standards

> Cómo se escribe código en Atrio. Después de leer esto, un desarrollador nuevo debe poder escribir código consistente con el resto del proyecto sin preguntar.

---

## Lenguaje y estilo

| Regla | Estándar |
|-------|----------|
| Idioma del código | Inglés (clases, interfaces, variables, funciones, archivos) |
| Idioma de comentarios | Español (cuando sean necesarios) |
| Formateador | Biome (o Prettier) — configuración en `biome.json` |
| Linter | Biome — configuración en `biome.json` |
| TypeScript | `strict: true` en `tsconfig.json` |
| Nombres de archivo | `kebab-case` con sufijo de rol (`sale-order.entity.ts`, `confirm-sale.use-case.ts`) |

---

## Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Clases | PascalCase | `SaleOrder`, `ConfirmSaleUseCase` |
| Interfaces | PascalCase con prefijo `I` opcional | `ISaleOrderRepository` o `SaleOrderRepository` |
| Types | PascalCase | `SaleStatus`, `PaymentMethod` |
| Funciones | camelCase | `confirmSale()`, `calculateTotal()` |
| Variables | camelCase | `pendingOrders`, `totalAmount` |
| Constantes | UPPER_SNAKE | `MAX_ITEMS_PER_ORDER`, `DEFAULT_CURRENCY` |
| Archivos | kebab-case con sufijo | `sale-order.entity.ts`, `confirm-sale.use-case.ts` |
| Carpetas | kebab-case | `value-objects/`, `anti-corruption/` |

### Sufijos de archivo

| Sufijo | Capa | Ejemplo |
|--------|------|---------|
| `.entity.ts` | Domain | `sale-order.entity.ts` |
| `.value-object.ts` | Domain | `money.value-object.ts` |
| `.event.ts` | Domain | `sale-confirmed.event.ts` |
| `.service.ts` | Domain | `sale-pricing.service.ts` |
| `.repository.interface.ts` | Domain | `sale-order.repository.interface.ts` |
| `.use-case.ts` | Application | `confirm-sale.use-case.ts` |
| `.dto.ts` | Application | `confirm-sale.dto.ts` |
| `.port.ts` | Application | `product-price-query.port.ts` |
| `.repository.ts` | Infrastructure | `prisma-sale-order.repository.ts` |
| `.controller.ts` | Presentation | `sales.controller.ts` |
| `.validator.ts` | Presentation | `confirm-sale.validator.ts` |

---

## TypeScript

### strict: true

Obligatorio. Sin excepciones. Esto incluye `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, etc.

### Prohibido

```ts
// ✖ Prohibido: any
function process(data: any): void

// ✖ Prohibido: type assertions innecesarias
const x = foo as Bar

// ✖ Prohibido: null sin tipo definido
let x = null

// ✖ Prohibido: non-null assertion
user!.name

// ✖ Prohibido: clases sin tipo (métodos sin return type)
class Foo {
  bar() { return 42 }
}
```

### Obligatorio

```ts
// ✔ Tipos explícitos en firmas públicas
function calculateTotal(items: OrderLine[]): Money

// ✔ Tipos en propiedades de clase
class SaleOrder {
  private readonly items: OrderLine[]
  private status: OrderStatus
}

// ✔ readonly en propiedades inmutables
class Money {
  constructor(
    readonly amount: number,
    readonly currency: Currency
  ) {}
}
```

---

## Imports

### Orden

1. Módulos de Node/NestJS (`@nestjs/*`, `@prisma/*`)
2. Shared Kernel (`@shared/*`)
3. Módulos de otros bounded contexts (`@modules/catalog/*`, `@modules/inventory/*`)
4. Módulos del mismo contexto (`./`, `../`)

### Prohibido

```ts
// ✖ Prohibido: import relativo largo
import { SaleOrder } from '../../domain/entities/sale-order.entity'

// ✖ Prohibido: barrel imports que cruzan capas
import { ... } from '../../../domain'

// ✖ Prohibido: import de Infrastructure desde Domain
import { PrismaService } from '../../infrastructure/persistence/prisma-service'
```

### Permitido

```ts
// ✔ Import con path alias (desde tsconfig paths)
import { SaleOrder } from '@/modules/sales/domain/entities/sale-order.entity'

// ✔ Import de Shared Kernel
import { Money } from '@/shared/domain/money'

// ✔ Import de puerto de otro contexto
import { IProductPriceQuery } from '@/modules/catalog/application/ports/in/product-price-query.port'
```

---

## Convenciones DDD

### Aggregate Roots

- Son la unidad de consistencia transaccional
- Se referencian entre sí por ID, no por objeto
- Protegen sus invariantes en métodos públicos
- Nunca exponen setters públicos

### Value Objects

- Inmutables
- Se comparan por valor (implementan `equals()`)
- Se validan en construcción (fail fast)

### Repositorios

- Solo se declaran en Domain como interfaces
- Solo se implementan en Infrastructure
- Sus métodos expresan intención de negocio (no `findByColumn`)

### Eventos

- Nombres en pasado (`SaleConfirmed`, `InvoiceIssued`)
- Inmutables después de creados
- Contienen solo datos, no lógica

---

## Tests

- Unit tests sin dependencias de infraestructura (Domain puro)
- Mocks solo para puertos/servicios externos
- Test Data Builders para crear agregados sin acoplar a DB
- Tests nombrados como: `[entidad].[escenario].test.ts`

```ts
// test/sales/domain/sale-order.test.ts
describe('SaleOrder', () => {
  describe('confirm', () => {
    it('should change status to confirmed', () => { ... })
    it('should emit SaleConfirmed event', () => { ... })
    it('should throw if already cancelled', () => { ... })
  })
})
```
