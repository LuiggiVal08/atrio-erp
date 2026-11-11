# Use Cases — Business Partners

> Casos de uso del módulo Business Partners, organizados por capacidad.
> Cada caso de uso describe la interacción, sus entradas, invariantes y eventos resultantes.

---

## Gestión de Partners

### UC-01: Create Partner

```
Actor:         Usuario autenticado (Admin, User)
Entrada:       type, legalName, taxId?, commercialName?, website?, tags?
Invariantes:   - legalName requerido
               - taxId requerido si type = COMPANY
               - taxId único por país (si se provee)
               - Si no se especifican roles, se asigna PROSPECT por defecto
Evento:        PartnerCreated
```

### UC-02: Update Partner

```
Actor:         Usuario autenticado
Entrada:       partnerId, campos a actualizar
Invariantes:   - No se puede cambiar type si ya tiene transacciones
               - No se puede reactivar un Partner BLOCKED sin autorización
Evento:        PartnerUpdated
```

### UC-03: Get Partner

```
Actor:         Usuario autenticado
Entrada:       partnerId
Salida:        Partner completo con contacts, addresses, roles, tags
Invariantes:   - Si deletedAt no es null, retorna 404
```

### UC-04: Search Partners

```
Actor:         Usuario autenticado
Entrada:       search?, roles[], types[], statuses[], tags[], page, pageSize
Salida:        Lista paginada de Partners
Reglas:        - search busca en legalName, commercialName, taxIdValue
               - roles filtra por PartnerRole (OR)
               - Se puede omitir search para listar todo
```

### UC-05: Deactivate Partner

```
Actor:         Usuario con permiso
Entrada:       partnerId
Efecto:        deletedAt = now()
Invariantes:   - No se puede eliminar físicamente
               - Los roles se preservan (histórico)
Evento:        PartnerArchived
```

### UC-06: Reactivate Partner

```
Actor:         Usuario con permiso
Entrada:       partnerId
Efecto:        deletedAt = null
Evento:        PartnerUpdated
```

---

## Gestión de Roles

### UC-07: Assign Role

```
Actor:         Usuario autenticado
Entrada:       partnerId, role (PartnerRole)
Invariantes:   - No se puede asignar el mismo rol dos veces
               - Partner no puede estar archivado
Evento:        PartnerRoleAssigned
```

### UC-08: Remove Role

```
Actor:         Usuario autenticado
Entrada:       partnerId, role
Invariantes:   - No se puede remover el último rol si el Partner está ACTIVE
               - Se puede remover el último rol si el Partner será archivado
Evento:        PartnerRoleRemoved
```

---

## Gestión de Contactos

### UC-09: Add Contact

```
Actor:         Usuario autenticado
Entrada:       partnerId, fullName, position?, email?, phone?, mobile?
Invariantes:   - Si isPrimary y ya existe un primary, se revoca el anterior
Evento:        ContactAdded
```

### UC-10: Update Contact

```
Actor:         Usuario autenticado
Entrada:       contactId, campos a actualizar
Evento:        ContactUpdated
```

### UC-11: Remove Contact

```
Actor:         Usuario autenticado
Entrada:       contactId
Efecto:        deletedAt = now()
Evento:        ContactRemoved
```

---

## Gestión de Direcciones

### UC-12: Add Address

```
Actor:         Usuario autenticado
Entrada:       partnerId, type, line1, line2?, city, state, country, postalCode?
Invariantes:   - Si isPrimary y ya existe una primary del mismo type, se revoca la anterior
Evento:        AddressAdded
```

### UC-13: Update Address

```
Actor:         Usuario autenticado
Entrada:       addressId, campos a actualizar
Evento:        AddressUpdated
```

### UC-14: Remove Address

```
Actor:         Usuario autenticado
Entrada:       addressId
Efecto:        deletedAt = now()
Evento:        AddressRemoved
```

---

## Gestión de Etiquetas

### UC-15: Add Tags

```
Actor:         Usuario autenticado
Entrada:       partnerId, tags: string[]
Invariantes:   - Tags duplicados se ignoran (upsert)
Evento:        PartnerTagsUpdated
```

### UC-16: Remove Tags

```
Actor:         Usuario autenticado
Entrada:       partnerId, tags: string[]
Evento:        PartnerTagsUpdated
```

---

## Consultas de solo lectura (desde otros BCs)

### UC-17: Get Partner Commercial History

```
Actor:         Business Partners UI (consume desde Ventas/Compras)
Entrada:       partnerId
Origen:        Consulta a Sales / Purchasing / Finance BCs
Salida:        Últimas ventas, últimos pagos, facturas pendientes, estado de cuenta
Nota:          Este UC NO se implementa dentro de Business Partners.
               Business Partners solo expone el endpoint de consulta delegada.
```

### UC-18: Get Partner Timeline (preparación futura)

```
Actor:         UI de Business Partners
Entrada:       partnerId
Salida:        Eventos chronológicos del Partner (creación, roles asignados/removidos,
               contactos agregados, direcciones cambiadas, estado modificado)
Nota:          V1 guarda los eventos en la BD. La UI de timeline se implementa
               en una versión posterior.
```
