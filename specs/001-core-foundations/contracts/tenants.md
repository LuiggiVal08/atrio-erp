# Contract: Tenants (Multi-Tenant)

**Prefijo**: `/api/v1/admin/tenants`
**Scope**: Solo super-admin

## POST / — Crear Tenant

**Request**:
```json
{
  "legalName": "Acme Corp, C.A.",
  "taxId": "J-12345678-0",
  "baseCurrency": "VED",
  "timezone": "America/Caracas",
  "subscriptionPlan": "business",
  "adminEmail": "admin@acme.com",
  "adminName": "Admin Acme"
}
```

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "legalName": "Acme Corp, C.A.",
    "taxId": "J-12345678-0",
    "baseCurrency": "VED",
    "timezone": "America/Caracas",
    "subscriptionPlan": "business",
    "status": "active",
    "createdAt": "2026-06-19T00:00:00Z"
  }
}
```

**Errores**: `409` si taxId ya existe, `422` si datos inválidos.

## GET / — Listar Tenants

**Query**: `?status=active&page=1&perPage=20`

**Response 200**:
```json
{
  "data": [ { "id": "uuid", "legalName": "...", "status": "active", ... } ],
  "meta": { "page": 1, "perPage": 20, "total": 5 }
}
```

## GET /:id — Obtener Tenant

**Response 200**: Objeto Tenant completo.

## PATCH /:id — Actualizar Tenant

**Request**: Campos parciales (subscriptionPlan, timezone, etc.)

## DELETE /:id — Desactivar Tenant

**Response 200**: `{ "data": { "status": "suspended" } }`

## POST /:id/reactivate — Reactivar Tenant

**Response 200**: `{ "data": { "status": "active" } }`
