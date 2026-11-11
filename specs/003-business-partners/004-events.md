# Events — Business Partners

> Eventos de dominio emitidos por el Bounded Context Business Partners.
> Siguen el formato definido en ADR-0005 (Domain Events).

---

## Formato

```typescript
interface DomainEvent {
  eventId: string;         // UUID v7
  eventType: string;       // "partner.{eventName}"
  aggregateType: string;   // "Partner"
  aggregateId: string;     // PartnerId
  occurredAt: DateTime;
  payload: Record<string, unknown>;
}
```

---

## Catálogo de eventos

### `partner.created`

```typescript
{
  eventType: "partner.created",
  aggregateId: "uuid-v7",
  payload: {
    type: PartnerType,
    legalName: string,
    taxId?: { value: string, country: string, type: string },
    status: PartnerStatus,
    initialRole: PartnerRole,
  }
}
```

Emitido por: UC-01 (Create Partner)
Consumido por: Audit, Search Index, Analytics

### `partner.updated`

```typescript
{
  eventType: "partner.updated",
  aggregateId: "uuid-v7",
  payload: {
    changes: { field: string, oldValue: unknown, newValue: unknown }[],
  }
}
```

Emitido por: UC-02 (Update Partner), UC-06 (Reactivate Partner)
Consumido por: Audit, Search Index

### `partner.archived`

```typescript
{
  eventType: "partner.archived",
  aggregateId: "uuid-v7",
  payload: {
    archivedAt: DateTime,
  }
}
```

Emitido por: UC-05 (Deactivate Partner)
Consumido por: Audit, Sales (suspender crédito), Finance (congelar saldo)

### `partner.role_assigned`

```typescript
{
  eventType: "partner.role_assigned",
  aggregateId: "uuid-v7",
  payload: {
    role: PartnerRole,
    assignedAt: DateTime,
  }
}
```

Emitido por: UC-07 (Assign Role)
Consumido por: Audit, Search Index

### `partner.role_removed`

```typescript
{
  eventType: "partner.role_removed",
  aggregateId: "uuid-v7",
  payload: {
    role: PartnerRole,
  }
}
```

Emitido por: UC-08 (Remove Role)
Consumido por: Audit, Sales (si era CUSTOMER, alertar), Purchasing (si era SUPPLIER, alertar)

### `partner.contact_added`

```typescript
{
  eventType: "partner.contact_added",
  aggregateId: "uuid-v7",
  payload: {
    contactId: string,
    fullName: string,
    isPrimary: boolean,
  }
}
```

Emitido por: UC-09 (Add Contact)
Consumido por: Audit

### `partner.contact_removed`

```typescript
{
  eventType: "partner.contact_removed",
  aggregateId: "uuid-v7",
  payload: {
    contactId: string,
    fullName: string,
  }
}
```

Emitido por: UC-11 (Remove Contact)
Consumido por: Audit

### `partner.address_added`

```typescript
{
  eventType: "partner.address_added",
  aggregateId: "uuid-v7",
  payload: {
    addressId: string,
    type: AddressType,
    country: string,
  }
}
```

Emitido por: UC-12 (Add Address)
Consumido por: Audit, Localization (si cambia país fiscal)

### `partner.tags_updated`

```typescript
{
  eventType: "partner.tags_updated",
  aggregateId: "uuid-v7",
  payload: {
    added: string[],
    removed: string[],
  }
}
```

Emitido por: UC-15 / UC-16 (Add / Remove Tags)
Consumido por: Audit, Search Index

---

## Tabla de consumidores

| Evento | Audit | Search | Sales | Finance | Localization |
|--------|-------|--------|-------|---------|--------------|
| partner.created | ✓ | ✓ | | | |
| partner.updated | ✓ | ✓ | | | |
| partner.archived | ✓ | | ✓ | ✓ | |
| partner.role_assigned | ✓ | ✓ | | | |
| partner.role_removed | ✓ | | ✓ | | |
| partner.contact_added | ✓ | | | | |
| partner.contact_removed | ✓ | | | | |
| partner.address_added | ✓ | | | | ✓ |
| partner.tags_updated | ✓ | ✓ | | | |
