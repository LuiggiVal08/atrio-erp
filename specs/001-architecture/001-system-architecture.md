# System Architecture

> Este documento es la entrada a la fase 001-architecture. Define las decisiones estructurales que condicionan todo lo demás (coding standards, testing, seguridad, observabilidad). No se avanza a documentos derivados hasta que este esté aprobado.

---

## Principios arquitectónicos

1. **Organización por Bounded Context** (ADR-0006) — el código se estructura por dominio, no por capas técnicas
2. **Monolito modular** (ADR-0001) — contexts separados en el mismo proceso, extraíbles a servicios
3. **API First** (ADR-0002) — toda funcionalidad expuesta como API, frontend es un cliente más
4. **Comunicación por eventos** (ADR-0005) — los contexts comparten hechos, no datos
5. **Domain-Driven Design** (ADR-0004) — modelo rico donde el dominio lo justifica, CRUD donde no
6. **Localization Engine** (ADR-0003) — las reglas de cada país viven fuera del core

---

## Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Lenguaje | TypeScript 5.x | Tipado estricto, ecosistema, equipo unificado |
| Backend framework | NestJS 11 | Modular, DI nativa, decoradores, compatible con hexagonal |
| Frontend | React 19 + Vite 6 + Tailwind CSS 4 | Moderno, rápido, tipado |
| Base de datos | PostgreSQL 16 | Relacional, JSONB, multi-tenant ready |
| ORM | Prisma | Ver sección ORM abajo |
| Mensajería (futuro) | RabbitMQ / Kafka | Cuando se extraigan contexts a servicios |
| Cache | Redis | Sesiones, caché de consultas, rate limiting |
| Almacenamiento | S3-compatible | Archivos, avatares, documentos |

### Decisión ORM: Prisma

**Justificación para DDD:** Prisma es type-safe, tiene migraciones versionadas, y soporta multi-DB eventualmente. La objeción común (Prisma no es "DDD-friendly" porque sus modelos mezclan persistencia con dominio) se resuelve con una regla simple:

- **Domain** define sus propias interfaces de repositorio (`SaleRepository.interface.ts`)
- **Infrastructure** implementa esas interfaces usando Prisma (`PrismaSaleRepository.ts`)
- **Domain nunca importa Prisma.** Nunca.
- Los modelos de Prisma son un detalle de infraestructura, no entidades de dominio
- Prisma pertenece **exclusivamente** a Infrastructure. No aparece en Application, Domain ni Presentation

Esto aplica a cualquier ORM. La clave no es el ORM, es la capa que lo aísla.

---

## Diagrama de arquitectura

```
[Client Web]     [Client Mobile]     [API Pública (v2+)]
       │                │                     │
       └────────────────┼─────────────────────┘
                        │ HTTPS / JSON (v1) / GraphQL (futuro)
                        ▼
               ┌────────────────┐
               │  API Gateway   │
               │  version prefix│  /api/v1/...
               │  (Nginx/Nest)  │
               └───────┬────────┘
                       │
              ┌────────┴────────┐
              │  Auth (JWT)     │
              │  Tenant Guard   │
              │  Rate Limit     │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Catalog  │  │ Sales    │  │Inventory │  ...
   │ BC       │  │ BC       │  │ BC       │
   │          │  │          │  │          │
   │App/Dom/  │  │App/Dom/  │  │App/Dom/  │
   │Infra/P/T │  │Infra/P/T │  │Infra/P/T │
   └────┬─────┘  └────┬─────┘  └────┬─────┘
        │              │             │
        └──────────────┼─────────────┘
                       │ Domain Events (in-process)
                       │ → Audit Log
                       ▼
               ┌────────────────┐
               │  Shared Kernel │
               │  (tiny)        │
               └────────────────┘
                       │
                       ▼
               ┌────────────────┐
               │  Anti-Corr.    │
               │  Layer         │  SENIAT, DIAN, Stripe, Bancos...
               └────────────────┘
                       │
                       ▼
               ┌────────────────┐
               │  PostgreSQL    │
               │  (multi-tenant)│
               └────────────────┘
```

---

## Shared Kernel

**Mínimo absoluto.** Solo conceptos que son idénticos en TODOS los bounded contexts.

```
src/shared/
  domain/
    money.ts              # Amount + Currency
    percentage.ts
    email.ts
    phone.ts
    address.ts
    tax-id.ts             # RIF, NIT, NIF (genérico)
    audit-info.ts         # createdAt, createdBy, updatedAt, updatedBy
    domain-event.ts       # Base class for all domain events
    entity.ts             # Base class for entities (id, equals)
    value-object.ts       # Base class for value objects
  application/
    pagination.ts
    use-case.ts           # Base class/interfaz para casos de uso
  infrastructure/
    prisma/
      prisma-service.ts   # Singleton PrismaClient
  presentation/
    base-controller.ts
```

**Regla:** Si un concepto no es idéntico en todos los contexts, no pertenece a Shared. Una moneda en Catalog puede ser la misma que en Sales, pero un "Product" no — porque Catalog lo modifica y Sales solo lo lee.

### Política de entrada al Shared Kernel

**SK-001:** Un elemento solo puede ingresar al Shared Kernel si cumple simultáneamente:

1. Es verdaderamente transversal a dos o más Bounded Contexts
2. No contiene reglas de negocio específicas de ningún contexto
3. No tiene dependencias hacia ningún contexto
4. Es improbable que cambie por requisitos de un único módulo

**SK-002:** Si existe duda sobre si algo pertenece al Shared Kernel, la decisión por defecto es **NO**. Es preferible duplicar un Value Object en dos contexts que contaminar Shared con algo que solo usan dos módulos.

---

## Contracts (interfaces entre contexts)

Las interfaces que un contexto expone para que otros lo consulten viven dentro del contexto que las **define y publica**, no en Shared.

### Regla

```
catalog/
  application/
    ports/
      in/                          # ← Puertos que Catalog ofrece
        product-price-query.port.ts
        product-catalog-query.port.ts
```

El contexto consumidor (Sales) referencia la interfaz desde su propia carpeta de `ports/out/`:

```
sales/
  application/
    ports/
      out/                         # ← Puertos que Sales necesita
        product-price-query.port.ts  # → import from catalog/.../product-price-query.port
```

La **implementación** concreta vive en `infrastructure/external/` del contexto consumidor:

```
sales/
  infrastructure/
    external/
      catalog-product-price-query.ts  # implementa ProductPriceQuery
                                       # usando el puerto que Catalog expone
```

**Esto NO es acoplamiento oculto.** Es una dependencia explícita y unidireccional: Sales sabe que Catalog existe, pero Catalog no sabe que Sales existe.

### Regla de estabilidad de contratos

Los contratos (`ports/in` y `ports/out`) son parte de la arquitectura pública del contexto. Cambiar un contrato debe tratarse igual que cambiar una API pública:

1. Requiere revisión del equipo
2. Requiere actualizar todos los consumidores
3. Requiere un ADR si el cambio es significativo
4. Se versionan si es necesario (múltiples implementaciones conviviendo)

---

## Matriz de dependencias entre bounded contexts

| Contexto | Puede depender de | Nunca puede depender de |
|----------|------------------|------------------------|
| Catalog | Shared Kernel, Configuration | Sales, Inventory, Purchasing, cualquier otro contexto operativo |
| Customer Management | Shared Kernel, Configuration | Sales, Purchasing, Inventory |
| Sales | Shared Kernel, Catalog, Customer Management, Localization, Configuration | HR, Payroll, Purchasing |
| Purchasing | Shared Kernel, Catalog, Customer Management, Localization, Configuration | Sales, Inventory, HR, Payroll |
| Inventory | Shared Kernel, Catalog, Configuration | Sales, Purchasing, HR, Payroll |
| Cash Management | Shared Kernel, Configuration | Catalog, Inventory, Sales, Purchasing |
| Financials | Shared Kernel, Localization, Configuration | Catalog, Sales, Purchasing, Inventory, HR |
| HR | Shared Kernel, Configuration | Payroll, Sales, Purchasing, Inventory |
| Payroll | Shared Kernel, HR, Localization, Configuration | Catalog, Sales, Purchasing, Inventory |
| Localization | Shared Kernel, Configuration | Catalog, Sales, Inventory, HR, Payroll, Financials |
| Configuration | Shared Kernel | Ningún otro contexto |

**Nota:** Configuration es el único contexto que no depende de ningún otro. Todos los demás pueden depender de Configuration.

---

## Capas internas de cada Bounded Context

Estructura obligatoria, sin excepciones:

```
sales/
  application/
    use-cases/       # ← Solo orquestación, sin lógica de negocio
      confirm-sale.use-case.ts
      cancel-sale.use-case.ts
    dto/
    ports/
      in/            # Interfaces que este contexto ofrece
      out/           # Interfaces que este contexto necesita
  domain/
    entities/        # Aggregate Roots + Entities
    value-objects/
    events/
    services/        # Domain Services (lógica de negocio pura)
    repositories/    # Interfaces de repositorio
  infrastructure/
    persistence/     # Solo implementaciones de repositorios (Prisma)
    messaging/       # Solo implementación de eventos
    external/        # Adaptadores hacia otros contexts o APIs externas
      catalog/       # → implementación de ports/out (consulta a Catalog)
      anti-corruption/ # → ACL para SENIAT, DIAN, Stripe, etc.
  presentation/
    rest/            # REST controllers (v1)
    cli/             # CLI commands (futuro)
    graphql/         # GraphQL resolvers (futuro)
  __tests__/
    unit/
    integration/
```

### Reglas por capa

| Capa | Contiene | NO contiene |
|------|----------|-------------|
| **Application** | Casos de uso, DTOs, puertos (interfaces) | Lógica de negocio, acceso a DB, lógica de presentación |
| **Domain** | Entidades, Value Objects, Domain Services, eventos, interfaces de repositorio | Dependencias de infraestructura, ORM, frameworks |
| **Infrastructure** | Implementaciones de repositorios, adaptadores, messaging | Lógica de negocio, reglas de dominio |
| **Presentation** | Controllers, validators, response mappers | Lógica de negocio, acceso a DB |

---

## Manejo de transacciones

**Quién controla la transacción:** La capa de **Application** (el caso de uso).

```
ConfirmSaleUseCase.execute()
    │
    ├── 1. Iniciar transacción (unit of work)
    │
    ├── 2. Consultar stock (vía interfaz → Inventory)
    ├── 3. Confirmar venta (domain: saleOrder.confirm())
    ├── 4. Emitir SaleConfirmed (domain event)
    ├── 5. Emitir InvoiceIssued (domain event)
    ├── 6. Persistir (repository.save(saleOrder))
    │
    └── 7. Commit transacción
         Si algo falla → Rollback
```

- Un caso de uso = una transacción
- El Domain nunca inicia ni commitea transacciones
- Los eventos se emiten dentro de la transacción (outbox pattern en el futuro)

---

## Anti-Corruption Layer (ACL)

Todo sistema externo que Atrio integre (gobierno, bancos, pasarelas de pago, APIs) debe tener un ACL.

```
sales/
  infrastructure/
    external/
      anti-corruption/
        seniat/
          seniat-invoice-adapter.ts    # Traduce factura Atrio → formato SENIAT
          seniat-response-mapper.ts    # Traduce respuesta SENIAT → dominio Atrio
        dian/
          dian-electronic-invoice.ts
        payment-gateway/
          stripe-adapter.ts
          binance-adapter.ts
```

Cada integración importante se organiza como un mini-módulo dentro del ACL:

```
anti-corruption/
  seniat/                              # Cada integración = su propio directorio
    seniat.invoice.dto.ts              # DTOs específicos del sistema externo
    seniat.invoice.mapper.ts           # Traducción dominio → externo
    seniat.http.client.ts              # Cliente HTTP
    seniat.invoice.adapter.ts          # Adaptador principal (implementa puerto)
  dian/
    dian.electronic-invoice.dto.ts
    dian.electronic-invoice.mapper.ts
    dian.http.client.ts
    dian.electronic-invoice.adapter.ts
```

**Regla:** El dominio nunca conoce la existencia de SENIAT, DIAN, Stripe, ni ninguna API externa. Toda comunicación externa pasa por un ACL en Infrastructure.

---

## Jerarquía de eventos

```
Domain (emite Domain Event)
    │
    ▼
Application (traduce a Integration Event si es necesario)
    │
    ▼
Bus (in-process → cola distribuida en el futuro)
```

**Regla:** El Domain nunca sabe cómo se publican los eventos. No importa Kafka, RabbitMQ, Redis ni SQS. El Domain emite un objeto en memoria. La infraestructura decide cómo transportarlo.

---

## Jerarquía de excepciones

Tres niveles, cada uno en su capa correspondiente:

```
DomainException           # Lanzada por entidades, VOs, Domain Services
    └── InsufficientStockError
    └── InvalidOrderStatusError

ApplicationException      # Lanzada por casos de uso
    └── EntityNotFoundError
    └── ValidationError

InfrastructureException   # Lanzada por repositorios, adaptadores, clients HTTP
    └── DatabaseError
    └── ExternalServiceError
```

**Regla:** El Domain nunca lanza excepciones de infraestructura. Un `PrismaError` jamás atraviesa la capa de Domain.

---

## Estrategia de identidad

**UUID v7** para todos los Aggregate Roots y entidades del sistema.

| Propiedad | UUID v7 | UUID v4 | Auto Increment |
|-----------|---------|---------|---------------|
| Orden temporal | ✔ | ✖ | ✔ |
| Sin coordinación central | ✔ | ✔ | ✖ |
| Seguro para exponer en URLs | ✔ | ✔ | ✖ |
| Index performance | Buena | Peor | Mejor |
| Compatibilidad TypeScript/PostgreSQL | ✔ (pgcrypto) | ✔ | ✔ |

UUID v7 provee orden temporal (útil para índices y paginación) sin requerir un coordinador central. Es la mejor opción para un sistema multi-tenant distribuido.

---

## Zona horaria

**Todo el sistema opera en UTC.**

- Almacenamiento: todos los timestamps en UTC
- Lógica de dominio: cálculos en UTC
- Comunicación entre contexts: UTC
- La conversión a hora local ocurre exclusivamente en **Presentation** (para mostrar al usuario)

**Regla:** Nunca guardar horas locales en la base de datos. Nunca hacer cálculos de negocio en hora local.

---

## Dinero (multi-moneda)

**Obligatorio.** Ninguna entidad puede representar dinero como un `number` suelto.

```
// ✔ Correcto
class Money {
  constructor(
    readonly amount: number,
    readonly currency: Currency
  ) {}
}

// ✖ Prohibido en todo el sistema
price: number
total: number
```

`Money` es un Value Object inmutable que vive en Shared Kernel. Cualquier operación aritmética (sumar, restar, multiplicar) debe tener en cuenta la moneda. Operaciones entre distintas monedas requieren una tasa de conversión explícita.

---

## CQRS ligero

No Event Sourcing. Solo separación de comandos y consultas donde la complejidad lo justifique.

```
// Comando (Command)
ConfirmSaleUseCase
    → pasa por Domain → Repository

// Consulta (Query)
GetDashboardQuery
    → lee directamente un ReadModel (DTO optimizado)
    → NO pasa por Aggregate Root
```

**Regla:** `Las operaciones de escritura y lectura podrán evolucionar independientemente cuando la complejidad lo justifique.` No se implementa CQRS para todos los módulos desde el día uno, pero la arquitectura lo permite sin rediseño.

---

## API Versioning

**Desde el día uno, aunque solo exista v1.**

```
/api/v1/sales/orders
/api/v1/inventory/stock
/api/v1/catalog/products
```

- v1 es la versión actual del frontend
- Cuando un endpoint cambia de forma incompatible, se crea `/api/v2/...`
- La versión se incluye en el path, no en el header (más explícito para consumidores)
- Los endpoints internos (frontend) usan la misma versión que los públicos

---

## Repository por Aggregate Root

Cada Aggregate Root tiene su propio repositorio. No hay repositorios por tabla.

```
sales/
  domain/
    repositories/
      sale-order.repository.interface.ts   # ← Aggregate: SaleOrder
  infrastructure/
    persistence/
      prisma-sale-order.repository.ts      # ← implementación
```

Un repositorio:
- Persiste el Aggregate completo (no una tabla)
- Garantiza consistencia del Aggregate
- Usa Prisma internamente, pero expone interfaces de dominio
- Expresa intención de negocio, no genéricos de base de datos

### Regla de intención de repositorio

Un repositorio nunca debe exponer métodos genéricos como `findByColumn()`, `findWhere()` o `findDynamic()`. Eso lo convierte en un mini ORM y rompe el encapsulamiento del dominio.

```
// ✔ Correcto: expresa intención de negocio
findPendingOrders(): Promise<SaleOrder[]>
findByOrderNumber(number: OrderNumber): Promise<SaleOrder | null>
findOverdueByCustomer(customerId: CustomerId): Promise<SaleOrder[]>

// ✖ Incorrecto: parece SQL, no dominio
findByColumn(column: string, value: unknown): Promise<SaleOrder[]>
findWhere(filters: Record<string, unknown>): Promise<SaleOrder[]>
```

---

## Flujo de una request (completo)

```
Request: POST /api/v1/sales/orders
    │
    ▼
Middleware
    ├── TenantAccessGuard → inyecta effectiveTenantId
    ├── AuthGuard → valida JWT, inyecta user
    └── AuditInterceptor → prepara contexto de auditoría
    │
    ▼
Controller (Presentation/rest)
    ├── Valida request body (validator)
    └── Llama al caso de uso
    │
    ▼
CreateSaleUseCase (Application)
    ├── Inicia transacción (Unit of Work)
    ├── Consulta productos a Catalog (via port out → infra/external)
    ├── Consulta precios a Catalog (via port out)
    ├── Consulta impuestos a Localization (via port out)
    ├── Crea SaleOrder (domain entity)
    ├── Confirma venta (saleOrder.confirm())
    ├── Emite SaleConfirmed (domain event → in-process bus)
    ├── Emite InvoiceIssued (domain event → in-process bus)
    ├── Guarda (saleOrderRepository.save(order))
    └── Commit transacción
    │
    ▼
    Inventory (consume SaleConfirmed)
    ├── Descuenta stock
    └── Emite StockChanged
    │
    ▼
    Cash Management (consume InvoiceIssued)
    ├── Registra cobro esperado
    └── Emite CashTransactionRecorded
    │
    ▼
    Financials (consume InvoiceIssued + CashTransactionRecorded)
    ├── Genera asiento contable
    └── Emite JournalEntryPosted
    │
    ▼
    Audit Log (consume todos los eventos)
    ├── Registra quién, qué, cuándo, valor anterior, valor nuevo
    └── → AuditLog table
```

---

## Documentos relacionados (futuros)

| Documento | Depende de |
|-----------|-----------|
| `002-folder-structure.md` | ✅ Este documento |
| `003-coding-standards.md` | 001 + 002 |
| `004-dependency-rules.md` | 001 + 002 |
| `005-module-template.md` | 001 + 002 |
| `006-event-guidelines.md` | 001 + 002 |
| `007-testing-strategy.md` | 001 + 002 |
| `008-security-model.md` | 001 + 002 |
| `009-api-guidelines.md` | 001 + 002 |
| `010-observability.md` | 001 + 002 |

---

## ADRs relacionados

| ADR | Título |
|-----|--------|
| ADR-0001 | Monolito Modular |
| ADR-0002 | API First |
| ADR-0003 | Localization Engine |
| ADR-0004 | Domain-Driven Design |
| ADR-0005 | Comunicación por Eventos |
| ADR-0006 | Estructura por Bounded Context |

Ver `/docs/adr/`.
