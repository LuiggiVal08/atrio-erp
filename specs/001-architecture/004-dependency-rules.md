# Dependency Rules

> Reglas de dependencias entre capas, entre bounded contexts, y entre módulos. Estas reglas se validan en CI y cualquier violación bloquea el merge.

---

## Regla fundamental

> **Las dependencias siempre apuntan hacia adentro del contexto y hacia arriba en la jerarquía de capas.**

```
Presentation → Application → Domain
                                  ↑
                          Shared Kernel
```

Infrastructure implementa interfaces definidas por Domain y Application, pero Domain nunca depende de Infrastructure.

---

## Capas (dentro de un mismo contexto)

```
Presentation  ───►  Application  ───►  Domain
       │                  │                  │
       │                  ▼                  │
       │          Shared Kernel ◄────────────┘
       │                                     │
       └──────────► Infrastructure ◄─────────┘
                        │
                        ▼
                  Otros contexts
                  (via ports, no directo)
```

| Origen | Destino permitido | Destino prohibido |
|--------|------------------|-------------------|
| `presentation/` | `application/`, `shared/` | `domain/`, `infrastructure/` |
| `application/` | `domain/`, `shared/`, `application/ports/in/` de otros contexts | `infrastructure/`, `presentation/` |
| `domain/` | `shared/` | `application/`, `infrastructure/`, `presentation/`, Prisma, NestJS |
| `infrastructure/` | `domain/`, `application/` (ports), `shared/`, `infrastructure/` de otros contexts | `presentation/` |

---

## Entre bounded contexts

La matriz completa está en `001-system-architecture.md`. Aquí las reglas generales:

### Permitido

```
Sales/application/ports/out/...  →  Catalog/application/ports/in/...
Sales/infrastructure/external/...  →  Catalog/... (implementación)
```

### Prohibido

```
Sales/domain/...  →  Catalog/domain/...        (✖ dominio conoce dominio ajeno)
Sales/domain/...  →  Inventory/...             (✖ dominio conoce otro contexto)
Sales/infrastructure/...  →  Sales/domain/...  (✖ infraestructura conoce lógica de negocio directa)
```

---

## Validación en CI

Todos los proyectos del monorepo ejecutan una validación de dependencias antes de cada merge:

```bash
# Verifica que no haya imports prohibidos entre capas
npm run lint:deps

# Verifica que no haya imports entre bounded contexts prohibidos
npm run lint:modules
```

La configuración de dependencias vive en:

```
tools/
  dependency-rules/
    allowed-deps.yaml       # Dependencias permitidas entre contexts
    forbidden-imports.yaml  # Patrones de imports prohibidos
```

Ejemplo de `forbidden-imports.yaml`:

```yaml
forbidden:
  # Domain nunca importa Infrastructure
  - from: "**/domain/**"
    to: "**/infrastructure/**"
    reason: "Domain no debe conocer infraestructura"

  # Domain nunca importa Application
  - from: "**/domain/**"
    to: "**/application/**"
    reason: "Domain no debe conocer casos de uso"

  # Domain nunca importa Presentation
  - from: "**/domain/**"
    to: "**/presentation/**"
    reason: "Domain no debe conocer la capa de presentación"

  # Sales no puede depender de HR
  - from: "**/modules/sales/**"
    to: "**/modules/human-resources/**"
    reason: "Sales no debe conocer HR (matriz de dependencias)"

  # HR no puede depender de Payroll
  - from: "**/modules/human-resources/**"
    to: "**/modules/payroll/**"
    reason: "HR no depende de Payroll (HR emite eventos, Payroll consume)"
```

---

## Path aliases

El `tsconfig.json` define alias para evitar imports relativos largos:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"],
      "@shared/*": ["src/shared/*"],
      "@modules/*": ["src/modules/*"],
      "@modules/sales/*": ["src/modules/sales/*"],
      "@modules/inventory/*": ["src/modules/inventory/*"],
      "@common/*": ["src/common/*"]
    }
  }
}
```

### Uso

```ts
// ✔ Correcto
import { SaleOrder } from '@modules/sales/domain/entities/sale-order.entity'
import { Money } from '@shared/domain/money'
import { TenantAccessGuard } from '@common/guards/tenant-access.guard'

// ✖ Incorrecto
import { SaleOrder } from '../../../../domain/entities/sale-order.entity'
```
