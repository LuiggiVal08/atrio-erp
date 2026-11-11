# API Contract — Business Partners

> Contrato de API REST para el módulo Business Partners.
> Sigue el prefijo `/api/v1/tenants/:tenantId/partners`.

---

## Endpoints

### `GET /tenants/:tenantId/partners`

Lista paginada de Partners.

```
Query params:
  search?: string              — búsqueda en legalName, commercialName, taxIdValue
  roles?: PartnerRole[]        — filtrar por rol (OR)
  types?: PartnerType[]        — PERSON | COMPANY
  statuses?: PartnerStatus[]   — ACTIVE | INACTIVE | BLOCKED
  tags?: string[]              — filtrar por etiqueta
  page?: number                — default 1
  pageSize?: number            — default 50, max 200
  sortBy?: string              — legalName | createdAt | status
  sortOrder?: asc | desc

Response 200:
{
  data: PartnerSummary[],
  total: number,
  page: number,
  pageSize: number,
}

PartnerSummary: {
  id: string,
  type: PartnerType,
  legalName: string,
  commercialName?: string,
  taxId?: { value: string, country: string, type: string },
  status: PartnerStatus,
  roles: PartnerRole[],
  tags: string[],
  primaryContact?: { fullName: string, email?: string, phone?: string },
  createdAt: DateTime,
}
```

### `POST /tenants/:tenantId/partners`

Crear Partner.

```
Body:
{
  type: PartnerType,                  // requerido
  legalName: string,                  // requerido
  taxId?: { value, country, type },
  commercialName?: string,
  website?: string,
  tags?: string[],
  contacts?: {
    fullName: string,                 // requerido
    position?: string,
    email?: string,
    phone?: string,
    mobile?: string,
    isPrimary?: boolean,
  }[],
  addresses?: {
    type: AddressType,
    line1: string,                    // requerido
    line2?: string,
    city: string,                     // requerido
    state: string,                    // requerido
    country: string,                  // requerido, ISO 3166-1 alpha-2
    postalCode?: string,
    isPrimary?: boolean,
  }[],
}

Response 201: PartnerDetail
```

### `GET /tenants/:tenantId/partners/:id`

Detalle completo.

```
Response 200: PartnerDetail

PartnerDetail: {
  ...PartnerSummary,
  metadata: { source?, externalId?, notes? },
  contacts: ContactDetail[],
  addresses: AddressDetail[],
  audit: { createdBy, updatedBy, createdAt, updatedAt },
  deletedAt?: DateTime,
}

ContactDetail: {
  id: string,
  fullName: string,
  position?: string,
  email?: string,
  phone?: string,
  mobile?: string,
  isPrimary: boolean,
}

AddressDetail: {
  id: string,
  type: AddressType,
  line1: string,
  line2?: string,
  city: string,
  state: string,
  country: string,
  postalCode?: string,
  isPrimary: boolean,
}
```

### `PATCH /tenants/:tenantId/partners/:id`

Actualizar Partner.

```
Body: Partial de los campos de Partner
Response 200: PartnerDetail
```

### `DELETE /tenants/:tenantId/partners/:id`

Archivar Partner (soft delete).

```
Response 204
```

---

## Endpoints de Roles

### `POST /tenants/:tenantId/partners/:id/roles`

Asignar rol.

```
Body: { role: PartnerRole }
Response 200: { role: PartnerRole, assignedAt: DateTime }
```

### `DELETE /tenants/:tenantId/partners/:id/roles/:role`

Remover rol.

```
Response 204
```

---

## Endpoints de Contactos

### `POST /tenants/:tenantId/partners/:id/contacts`

### `PATCH /tenants/:tenantId/partners/:id/contacts/:contactId`

### `DELETE /tenants/:tenantId/partners/:id/contacts/:contactId`

---

## Endpoints de Direcciones

### `POST /tenants/:tenantId/partners/:id/addresses`

### `PATCH /tenants/:tenantId/partners/:id/addresses/:addressId`

### `DELETE /tenants/:tenantId/partners/:id/addresses/:addressId`

---

## Endpoints de Etiquetas

### `POST /tenants/:tenantId/partners/:id/tags`

Agregar etiquetas.

```
Body: { tags: string[] }
Response 200: { tags: string[] }
```

### `DELETE /tenants/:tenantId/partners/:id/tags`

Remover etiquetas.

```
Body: { tags: string[] }
Response 200: { tags: string[] }
```

---

## Compatibilidad hacia atrás (adaptadores)

Los siguientes endpoints se mantienen como **adaptadores** temporales.
Internamente delegan al servicio de Partners.

```
GET  /tenants/:tenantId/clients          → GET /partners?role=CUSTOMER
GET  /tenants/:tenantId/vendors          → GET /partners?role=SUPPLIER
POST /tenants/:tenantId/clients          → POST /partners (con role=CUSTOMER)
POST /tenants/:tenantId/vendors          → POST /partners (con role=SUPPLIER)
```

Plan de deprecación en `006-migration-plan.md`.

---

## Historial comercial (solo lectura)

### `GET /tenants/:tenantId/partners/:id/commercial-history`

Consulta delegada a Sales / Purchasing / Finance.

```
Response 200:
{
  sales: {
    lastInvoices: InvoiceSummary[],
    pendingInvoices: InvoiceSummary[],
    totalPaid: Money,
    totalPending: Money,
  },
  purchases: {
    lastOrders: OrderSummary[],
    totalSpent: Money,
  },
  credit: {
    limit: Money,
    currentBalance: Money,
    available: Money,
  },
}
```
