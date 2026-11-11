# Folder Structure

> Organización de carpetas por Bounded Context dentro del monorepo. Basado en ADR-0006. Esta estructura es obligatoria para todos los bounded contexts, sin excepciones.

---

## Shared Kernel

> **Mínimo absoluto.** Solo conceptos universales que son idénticos en todos los contexts.

```
apps/api/src/
  shared/
    domain/
      money.ts                  # Amount + Currency
      percentage.ts
      email.ts
      phone.ts
      address.ts
      tax-id.ts                 # RIF, NIT, NIF (genérico)
      audit-info.ts             # createdAt, createdBy, updatedAt, updatedBy
      domain-event.ts           # Base class para todos los Domain Events
      entity.ts                 # Base class (id, equals)
      value-object.ts           # Base class
    application/
      pagination.ts
      use-case.ts               # Interfaz base: execute(dto) → response
    infrastructure/
      prisma/
        prisma-service.ts       # PrismaClient singleton
    presentation/
      base-controller.ts        # Manejo común de respuestas y errores
      api-error.ts              # Error response structure
```

---

## Common (cross-cutting)

```
apps/api/src/
  common/
    guards/
      tenant-access.guard.ts
      auth.guard.ts
      roles.guard.ts
    interceptors/
      audit.interceptor.ts
      logging.interceptor.ts
      transform.interceptor.ts
    filters/
      http-exception.filter.ts
      domain-exception.filter.ts
    pipes/
      validation.pipe.ts
    decorators/
      current-user.decorator.ts
      tenant.decorator.ts
```

---

## Estructura por Bounded Context (obligatoria)

Cada contexto sigue EXACTAMENTE esta estructura. Sin excepciones.

```
modules/
  sales/                                    # ← BC-04: Sales
    application/                            # ← Solo orquestación
      use-cases/                            # Casos de uso
        confirm-sale.use-case.ts
        cancel-sale.use-case.ts
      dto/                                  # Data Transfer Objects
        confirm-sale.dto.ts
        cancel-sale.dto.ts
      ports/                                # Interfaces
        in/                                 # Puertos que este contexto ofrece
          sales-query.port.ts
        out/                                # Puertos que este contexto necesita
          product-price-query.port.ts       # ← hacia Catalog
          stock-availability-query.port.ts  # ← hacia Inventory
          tax-calculation-query.port.ts     # ← hacia Localization
    domain/                                 # ← Lógica de negocio pura
      entities/                             # Aggregate Roots + Entities
        sale-order.ts                       # ← Aggregate Root
        order-line.ts                       # ← Entity dentro de SaleOrder
        invoice.ts                          # ← Aggregate Root
        credit-note.ts
      value-objects/                        # Value Objects
        money.ts
        currency.ts
        tax-rate.ts
        order-status.ts
        payment-terms.ts
      events/                               # Domain Events
        sale-confirmed.event.ts
        invoice-issued.event.ts
        sale-cancelled.event.ts
      services/                             # Domain Services (lógica de negocio pura)
        sale-pricing.service.ts
        tax-calculation.service.ts
      repositories/                         # Interfaces (contratos)
        sale-order.repository.interface.ts
        invoice.repository.interface.ts
    infrastructure/                         # ← Solo implementaciones
      persistence/                          # Implementaciones de repositorios
        prisma-sale-order.repository.ts     # → implementa SaleOrderRepository
        prisma-invoice.repository.ts
      messaging/                            # Implementación de eventos
        nest-event-bus.ts
      external/                             # Adaptadores a otros contexts
        catalog-product-price-query.ts      # → implementa ProductPriceQuery
        inventory-stock-query.ts            # → implementa StockAvailabilityQuery
      anti-corruption/                      # ACL para sistemas externos
        seniat/
          seniat-invoice-adapter.ts
          seniat-response-mapper.ts
        dian/
          dian-electronic-invoice.ts
        payment-gateway/
          stripe-adapter.ts
          binance-adapter.ts
    presentation/                           # ← Adaptable a cualquier canal
      rest/                                 # REST controllers
        sales.controller.ts
        invoices.controller.ts
        validators/
          confirm-sale.validator.ts
      cli/                                  # CLI commands (futuro)
      graphql/                              # GraphQL resolvers (futuro)
    __tests__/                              # Tests del contexto
      unit/
        domain/
          sale-order.test.ts
          money.test.ts
        application/
          confirm-sale.test.ts
        infrastructure/
          prisma-sale-order.repository.test.ts
      integration/
        confirm-sale.integration.test.ts
    sales.module.ts                         # NestJS module
```

---

## Reglas de la estructura

### Application (solo casos de uso)

```
application/
  use-cases/          ← Cada archivo = un caso de uso (orquestación pura)
  dto/                ← Data transfer objects (input/output)
  ports/
    in/               ← Interfaces que este contexto ofrece a otros
    out/              ← Interfaces que este contexto necesita de otros
```

- Un caso de uso = una transacción
- El caso de uso orquesta: consulta otros contexts (via ports/out), ejecuta dominio, persiste, emite eventos
- NO contiene lógica de negocio — eso vive en Domain
- NO contiene implementaciones de infraestructura — eso vive en Infrastructure

### Domain (lógica de negocio pura)

```
domain/
  entities/           ← Aggregate Roots + Entities
  value-objects/      ← Value Objects (inmutables)
  events/             ← Domain Events
  services/           ← Domain Services (lógica que no cabe en una entidad)
  repositories/       ← Interfaces (contratos), NO implementaciones
```

- **Nunca importa nada de Infrastructure**
- **Nunca importa Prisma, NestJS, HTTP, ni ningún framework**
- Solo depende de Shared Kernel y de otros domain objects del mismo contexto

### Infrastructure (solo implementaciones)

```
infrastructure/
  persistence/        ← Implementaciones de repositorios (Prisma)
  messaging/          ← Implementación de eventos
  external/           ← Adaptadores a otros bounded contexts
  anti-corruption/    ← ACL para sistemas externos
```

- **Nunca contiene lógica de negocio**
- Solo implementa interfaces definidas en Domain (repositories) y en Application (ports/out)
- Es la única capa que importa Prisma, NestJS, HTTP clients, etc.

### Presentation (adaptable)

```
presentation/
  rest/               ← REST (ahora)
  cli/                ← CLI (futuro)
  graphql/            ← GraphQL (futuro)
```

- No contiene lógica de negocio
- No contiene acceso a base de datos
- Solo transforma requests HTTP → DTOs → casos de uso, y respuestas → HTTP responses
- Separar REST/CLI/GraphQL permite cambiar el canal sin tocar Application ni Domain

---

## Repository por Aggregate Root

Cada Aggregate Root tiene su propio repositorio. No existen repositorios por tabla.

```
domain/
  repositories/
    sale-order.repository.interface.ts   ← Aggregate: SaleOrder
    invoice.repository.interface.ts       ← Aggregate: Invoice

infrastructure/
  persistence/
    prisma-sale-order.repository.ts       ← implementa SaleOrderRepository
    prisma-invoice.repository.ts           ← implementa InvoiceRepository
```

El repositorio:
- Persiste el Aggregate completo
- Garantiza consistencia del Aggregate
- Expone métodos de dominio (`save(order)`, `findById(id)`, no `insert()`, `update()`)

---

## Matriz de imports entre capas

| Capa | Puede importar de | NO puede importar de |
|------|------------------|---------------------|
| **Presentation** | Application (casos de uso, DTOs), Shared | Domain, Infrastructure |
| **Application** | Domain, Shared, ports/in de otros contexts | Infrastructure, Presentation |
| **Domain** | Shared Kernel solamente | Application, Infrastructure, Presentation, Prisma, NestJS |
| **Infrastructure** | Domain, Application (ports/out), Shared | Presentation |

### Permisos entre contexts

```
sales/application/ports/out/product-price-query.port.ts
  → import { IProductPriceQuery } from 'modules/catalog/application/ports/in/product-price-query.port'
  ✔ Permitido: importa la interfaz que Catalog publica

sales/infrastructure/external/catalog-product-price-query.ts
  → import { PrismaService } from 'shared/infrastructure/prisma/prisma-service'
  ✔ Permitido: importa infraestructura compartida

sales/domain/entities/sale-order.ts
  → import { Money } from 'shared/domain/money'
  ✔ Permitido: importa Shared Kernel

sales/domain/repositories/sale-order.repository.interface.ts
  → import { SaleOrder } from '../entities/sale-order'
  ✔ Permitido: importa su propia entidad
```

### Prohibido

```
sales/domain/entities/sale-order.ts
  → import { PrismaClient } from '@prisma/client'
  ✖ Prohibido: Domain no conoce Prisma

sales/infrastructure/persistence/prisma-sale-order.repository.ts
  → import { calculateTax } from '../../domain/services/tax-calculation.service'
  ✖ Prohibido: Infrastructure no llama a Domain Services directamente.
    La lógica de negocio debe ejecutarse en Application (caso de uso),
    no en Infrastructure.

sales/domain/entities/sale-order.ts
  → import { StockItem } from 'modules/inventory/domain/entities/stock-item'
  ✖ Prohibido: Sales no conoce entidades de Inventory
```

---

## Frontend

El frontend refleja la misma estructura de bounded contexts, pero simplificada:

```
apps/web/src/
  core/
    auth/
    tenant/
  modules/
    catalog/
    sales/
    inventory/
    purchasing/
    ...
  shared/
    components/
      ui/               # Componentes reutilizables (HeroUI)
      layout/
    lib/
      api/              # API client
      i18n/             # Traducciones (es.json, en.json)
      utils/
```

---

## Tests

```
sales/
  __tests__/
    unit/
      domain/           # Entidades, VOs, Domain Services (sin infraestructura)
      application/      # Casos de uso (con puertos mockeados)
      infrastructure/   # Repositorios (con Prisma testeable)
    integration/        # Flujos completos entre capas

apps/api/
  test/
    e2e/                # End-to-end (HTTP request → DB)
      sales/
        create-sale.e2e-spec.ts
        confirm-sale.e2e-spec.ts
      inventory/
```
