# CCR-01 — Business Partners Cross-Context Review

> Revisión de impacto sistémico del módulo Business Partners sobre los demás
> Bounded Contexts de Atrio. Gate previo a la implementación.

---

## 1. Matriz de impacto por contexto

| Contexto | ¿Cómo usa Partner? | ¿Modifica Partner? | Eventos que consume | Eventos que emite |
|---|---|---|---|---|
| **Sales** | Referencia como cliente en facturas, cotizaciones, pedidos | ❌ Solo lectura | `partner.archived` → alertar antes de crear nueva factura | `sale.confirmed` → para historial |
| **Purchasing** | Referencia como proveedor en órdenes de compra, recepciones | ❌ Solo lectura | `partner.archived` → alertar antes de crear nueva OC | `purchase.received` → para historial |
| **Finance / Cash** | Referencia como cliente/proveedor en pagos, cobros, estado de cuenta | ❌ Solo lectura | `partner.archived` → congelar saldo, impedir nuevos movimientos | `payment.registered` → para historial |
| **Inventory** | Sin relación directa (solo a través de Sales/Purchasing) | ❌ Sin acceso | — | — |
| **HR / Employees** | Sin relación (Employee es un agregado distinto de Person) | ❌ Sin acceso | — | — |
| **Localization** | Referencia para configuración fiscal por país del Partner | ❌ Solo lectura | `partner.address_added` (si cambia país) | — |
| **RBAC / Auth** | Sin relación directa (usuarios del sistema ≠ Partners) | ❌ Sin acceso | — | — |
| **Reports** | Consulta para filtros y agrupaciones por Partner | ❌ Solo lectura | — | — |

### Regla de oro

> **Solo Business Partners escribe sobre el agregado `Partner` y sus hijos
> (Contact, Address, Role, Tag). Cualquier otro BC que necesite modificar un
> Partner debe hacerlo a través de un caso de uso de Business Partners, nunca
> mediante UPDATE directo a la BD.**

---

## 2. Verificación del Ownership Matrix

```
Partner
├── id                    OWNER: Business Partners
├── legalName             OWNER: Business Partners
├── taxId                 OWNER: Business Partners
├── status                OWNER: Business Partners
├── roles                 OWNER: Business Partners
│   ├── CUSTOMER          CONSULTOR: Sales, Finance
│   └── SUPPLIER          CONSULTOR: Purchasing, Finance
├── contacts              OWNER: Business Partners
├── addresses             OWNER: Business Partners
│   └── fiscal            CONSULTOR: Localization
└── tags                  OWNER: Business Partners
```

**Estado: ✅ OK** — Ningún otro BC reclama ownership sobre ningún campo de Partner.

---

## 3. Análisis de eventos

### `partner.archived` — comportamiento esperado por consumidor

| Consumidor | Acción |
|---|---|
| **Sales** | - Bloquear creación de nuevas facturas/cotizaciones para este Partner<br>- Mostrar warning en vistas existentes: "Partner archivado"<br>- NO eliminar facturas existentes (solo lectura de histórico) |
| **Purchasing** | - Bloquear creación de nuevas órdenes de compra<br>- Mostrar warning en vistas existentes |
| **Finance** | - Congelar saldo pendiente<br>- Bloquear nuevos movimientos (pagos/cobros)<br>- Mantener visibilidad de movimientos históricos |

### `partner.role_assigned` / `partner.role_removed` — comportamiento esperado

| Consumidor | Acción |
|---|---|
| **Sales** | - Si se remueve rol CUSTOMER, alertar sobre facturas pendientes<br>- Si se asigna CUSTOMER, habilitar creación de facturas |
| **Purchasing** | - Si se remueve rol SUPPLIER, alertar sobre OCs pendientes<br>- Si se asigna SUPPLIER, habilitar creación de OCs |

### `partner.tags_updated` — comportamiento esperado

| Consumidor | Acción |
|---|---|
| **Reports** | Re-indexar para agrupaciones por tag |
| **Search** | Re-indexar para búsqueda por tag |

**Estado: ✅ Suficiente** — Los 9 eventos cubren todos los cambios de estado del agregado. No se identificaron eventos faltantes.

---

## 4. Política de Soft Delete

Decisión confirmada:

> **Nunca DELETE físico de un Partner.**

Estados del ciclo de vida:

```text
CREACIÓN → ACTIVE
              ↓
          INACTIVE  (operativamente detenido, datos preservados)
              ↓
          BLOCKED   (por decisión administrativa, requiere desbloqueo)
              ↓
          ARCHIVED  (soft delete, inaccesible por defecto pero consultable)
```

| Estado | ¿Visible en listados? | ¿Permite nuevas operaciones? | ¿Historial accesible? |
|--------|----------------------|------------------------------|----------------------|
| ACTIVE | ✅ Sí | ✅ Sí | ✅ Sí |
| INACTIVE | ✅ Sí (con filtro) | ❌ No | ✅ Sí |
| BLOCKED | ✅ Sí (con filtro) | ❌ No | ✅ Sí |
| ARCHIVED | ❌ No (por defecto) | ❌ No | ✅ Sí (por ID directo) |

**Regla**: El cambio de estado solo lo ejecuta Business Partners. Los consumidores
reciben el evento y actúan en consecuencia.

---

## 5. Merge de Partners

### Contemplado pero no implementado en V1

**Cuándo será necesario**: Cuando se detecten Partners duplicados (mismo taxId,
mismo legalName con variaciones tipográficas).

**Precondiciones**:
- Ambos Partners deben estar en estado ACTIVE o INACTIVE
- No se puede mergear un Partner consigo mismo
- Se debe designar un Partner "survivor" y uno "absorbed"

**Comportamiento futuro**:
```text
merge(survivorId, absorbedId)
├── Roles: unión de roles de ambos
├── Contactos: se trasladan al survivor
├── Direcciones: se trasladan al survivor
├── Etiquetas: unión de tags
├── Transacciones (Sales/Purchasing/Finance):
│   └── FK apuntan al survivor (absorbed queda ARCHIVED con referencias)
└── Evento: partner.merged { survivorId, absorbedId }
```

**V1**: No implementar. Pero la arquitectura debe permitirlo (Agregado
autocontenido, sin FKs duras desde otros BCs al ID del Partner — usar
`partnerId` como UUID referencial).

---

## 6. Split de Partners

### Explícitamente no soportado en V1

Es un caso extremadamente raro (una empresa que se divide en dos razones
sociales distintas y quiere repartir el historial). Requeriría:
- Desasignar transacciones de un Partner a otro
- Recalcular saldos y estados de cuenta
- Auditoría forense

**Decisión**: No implementar. Si ocurre, se resuelve como:
1. Crear el nuevo Partner
2. Mover direcciones/contactos manualmente
3. Las transacciones históricas quedan en el Partner original

---

## 7. Política de identificación

```
PartnerId (UUID v7) ← IDENTIDAD DEL AGREGADO (único, interno, inmutable)
    ↑
TaxIdentifier       ← ATRIBUTO FISCAL (mutable, uno por país)
    ├── type: RIF | NIT | RFC | EIN | CIF | CI | RUC | ...
    ├── country: VE | CO | MX | US | ES | ...
    └── value: string
```

**Reglas**:
- `PartnerId` es el identificador único del agregado en todo el sistema
- `TaxIdentifier` es un value object mutable (puede cambiar si el fisco lo modifica)
- No usar `TaxIdentifier` como clave foránea en ningún otro BC
- La unicidad de `TaxIdentifier` se valida por `(type, country, value)` dentro del mismo tenant

---

## 8. Política de direcciones

Modelo aprobado:

```typescript
enum AddressType {
  FISCAL    = 'FISCAL',    // domicilio fiscal
  BILLING   = 'BILLING',   // domicilio de facturación
  SHIPPING  = 'SHIPPING',  // domicilio de despacho
  BRANCH    = 'BRANCH',    // sucursal
  PRIMARY   = 'PRIMARY',   // dirección principal
  OTHER     = 'OTHER',     // otro
}
```

- Un Partner puede tener 0..n direcciones de cualquier tipo
- Solo una dirección puede ser `isPrimary = true` por Partner
- No hay límite de direcciones del mismo tipo (excepto PRIMARY)
- La dirección FISCAL es requerida para Partners tipo COMPANY

---

## 9. Política de contactos

- Un Partner puede tener 0..n contactos
- Un contacto tiene `fullName`, `position?`, `email?`, `phone?`, `mobile?`, `isPrimary`
- Solo un contacto puede ser `isPrimary = true` por Partner
- Los contactos pueden tener el mismo cargo (ej: dos "Gerentes de Compras")
- Los contactos se eliminan con soft delete (`deletedAt`)

---

## 10. Timeline / Event Sourcing

### Decisión: No implementar UI en V1, pero preparar el modelo

**Lo que se implementa en V1**:
- Los eventos de dominio se persisten en una tabla `partner_events`
- Cada mutación del agregado emite su evento correspondiente
- Los eventos son inmutables (append-only)

**Lo que NO se implementa en V1**:
- UI de timeline
- Reconstrucción de estado desde eventos
- Consulta pública de eventos

**Contrato para futuro**:
```typescript
GET /tenants/:tenantId/partners/:id/timeline
Response 200:
{
  events: {
    eventType: string,
    occurredAt: DateTime,
    payload: Record<string, unknown>,
  }[]
}
```

---

## 11. Posicionamiento arquitectónico

Decisión final:

> **Business Partners NO es un submódulo de Inventory, Sales ni Purchasing.**
> **Es un Core Domain al mismo nivel que Identity y Localization.**

```text
Core Domains
├── Identity & Access (RBAC, Auth, Users)
├── Localization (país, moneda, impuestos)
└── Business Partners (terceros, contactos, direcciones)
        ↑
        │ dependencia estructural
        │
Feature Modules
├── Sales (consume Partners como CUSTOMER)
├── Purchasing (consume Partners como SUPPLIER)
├── Finance / Cash (consume Partners como CUSTOMER + SUPPLIER)
├── Inventory (sin dependencia directa)
└── Reports (consulta transversal)
```

**Implicaciones**:
- Business Partners vive en `apps/api/src/core/business-partners/` (no en `modules/`)
- Las migraciones de Business Partners se ejecutan antes que las de módulos feature
- Business Partners no depende de ningún módulo feature
- Los módulos feature dependen de Business Partners (no al revés)

---

## 12. Resumen de decisiones V1

| Decisión | Estado | Documento |
|---|---|---|
| Ownership exclusivo de Business Partners | ✅ Confirmado | CCR-01 §2 |
| Soft delete (nunca DELETE físico) | ✅ Confirmado | CCR-01 §4 |
| Merge contemplado, no implementado | ✅ Documentado | CCR-01 §5 |
| Split no soportado | ✅ Documentado | CCR-01 §6 |
| PartnerId como identidad (no TaxId) | ✅ Confirmado | CCR-01 §7 |
| TaxIdentifier como value object mutable | ✅ Confirmado | CCR-01 §7 |
| Múltiples tipos de dirección | ✅ Confirmado | CCR-01 §8 |
| Múltiples contactos por Partner | ✅ Confirmado | CCR-01 §9 |
| Eventos persistidos, timeline sin UI | ✅ Confirmado | CCR-01 §10 |
| Business Partners como Core Domain | ✅ Confirmado | CCR-01 §11 |
| Feature flags para rollout | ✅ Planificado | 009-rollout-strategy.md |
| Adaptadores legacy `/clients` y `/vendors` | ✅ Planificado | 006-migration-plan.md |

---

## Veredicto

> **🟢 Gate BP-01 — Business Partners Domain Approved**
>
> El modelo de dominio es consistente, respeta el ownership matrix existente,
> los eventos cubren todas las mutaciones necesarias, y ningún otro Bounded
> Context resulta afectado negativamente. Se aprueba el inicio de la
> implementación siguiendo el plan de migración por fases definido en
> `006-migration-plan.md`.
