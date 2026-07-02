# Quickstart: Core Architecture & Domain Modules

## Prerequisites

- PostgreSQL 16 running (`docker compose up -d postgres`)
- NestJS backend running (`npm run start:dev` from `apps/api/`)
- Database migrated: `npm run prisma:migrate`
- Tenant + JWT token (use `001-core-foundations` flows)
- Document Engine migration applied (002)

## Setup

```bash
# From apps/api/
npm run prisma:migrate --name add_core_architecture
npm run start:dev
```

## Validation Scenarios

### Scenario 1: Activar Módulos del Tenant (US1)

```bash
# Ver módulos activos
curl -X GET http://localhost:3000/api/v1/admin/tenants/{tenantId}/modules \
  -H "Authorization: Bearer {token}"

# Activar inventario + ventas
curl -X PATCH http://localhost:3000/api/v1/admin/tenants/{tenantId}/modules \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"enabledModules": ["sales", "inventory", "cash-payments", "purchasing"]}'
```

**Expected**: HTTP 200, `enabledModules` actualizado.

### Scenario 2: Crear Categoría y Producto (US2)

```bash
# Crear categoría
CAT_ID=$(curl -s -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/inventory/categories \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Electrónicos"}' | jq -r '.id')

# Crear producto
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/inventory/products \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d "{
    \"sku\": \"LAP-001\",
    \"name\": \"Laptop Pro\",
    \"categoryId\": \"$CAT_ID\",
    \"unitPrice\": 1200.00,
    \"costPrice\": 800.00,
    \"isService\": false
  }"
```

**Expected**: HTTP 201, producto creado en estado activo.

### Scenario 3: Registrar Cliente (US3)

```bash
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/clients \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "J-12345678-0",
    "legalName": "Acme Corp, C.A.",
    "email": "info@acme.com"
  }'
```

**Expected**: HTTP 201, cliente registrado.

### Scenario 4: Configurar Impuesto y Tasa (US4)

```bash
# Crear impuesto
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/localization/taxes \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "IVA 16%", "rate": 16.000, "type": "iva", "country": "VE"}'

# Crear tasa de cambio
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/localization/currency-rates \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"from": "USD", "to": "VES", "rate": 89.50, "date": "2026-06-20"}'
```

**Expected**: HTTP 201, impuesto y tasa creados.

### Scenario 5: Caja + Método de Pago (US5)

```bash
# Crear caja
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/cash-payments/registers \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Caja Principal", "currency": "USD"}'

# Crear método de pago
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/cash-payments/payment-methods \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Efectivo USD", "type": "cash"}'
```

**Expected**: HTTP 201.

### Scenario 6: Flujo de Venta Completo (US6 + US8)

```bash
# 1. Crear factura como documento (usando 002 endpoint)
DOC_ID=$(curl -s -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "sales_invoice",
    "currency": "USD",
    "clientId": "<client-uuid>",
    "lines": [
      {"productId": "<product-uuid>", "description": "Laptop Pro", "quantity": 1, "unitPrice": 1200.00, "taxRate": 16.00}
    ]
  }' | jq -r '.id')

# 2. Someter
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/$DOC_ID/submit \
  -H "Authorization: Bearer {token}"

# 3. Aprobar — debe disparar descuento de stock automático
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/$DOC_ID/approve \
  -H "Authorization: Bearer {token}"

# 4. Verificar stock descontado
curl -X GET "http://localhost:3000/api/v1/admin/tenants/{tenantId}/inventory/stock?productId=<product-uuid>&warehouseId=<wh-uuid>" \
  -H "Authorization: Bearer {token}"
```

**Expected**: 
- Documento creado → submitted → approved
- Stock del producto disminuido en 1
- Cash register con cuenta por cobrar (o movimiento de caja si se pagó)

### Scenario 7: Orden de Compra + Recepción (US7 + US8)

```bash
# 1. Crear OC
PO_ID=$(curl -s -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/purchasing/orders \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorId": "<vendor-uuid>",
    "currency": "USD",
    "lines": [
      {"productId": "<product-uuid>", "description": "Laptop Pro", "quantity": 10, "unitPrice": 800.00, "taxRate": 16.00}
    ]
  }' | jq -r '.id')

# 2. Aprobar
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/documents/$PO_ID/approve \
  -H "Authorization: Bearer {token}"

# 3. Recibir parcialmente
curl -X POST http://localhost:3000/api/v1/admin/tenants/{tenantId}/purchasing/orders/$PO_ID/receive \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "warehouseId": "<wh-uuid>",
    "items": [{"productId": "<product-uuid>", "quantityReceived": 3}]
  }'

# 4. Verificar stock incrementado
curl -X GET "http://localhost:3000/api/v1/admin/tenants/{tenantId}/inventory/stock?productId=<product-uuid>&warehouseId=<wh-uuid>" \
  -H "Authorization: Bearer {token}"
```

**Expected**: Stock incrementado en 3.

### Scenario 8: Ver Auditoría (US9)

```bash
curl -X GET "http://localhost:3000/api/v1/admin/tenants/{tenantId}/audit-logs?action=product.create" \
  -H "Authorization: Bearer {token}"
```

**Expected**: Lista de eventos de creación de productos con usuario y timestamp.

### Scenario 9: Cambiar Idioma (US10)

```bash
curl -X PATCH http://localhost:3000/api/v1/admin/tenants/{tenantId}/users/me/locale \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"locale": "en"}'
```

**Expected**: HTTP 200, JWT rotado con `locale: "en"`.

## Test Suite

```bash
# Unit tests por módulo
cd apps/api && npx jest --testPathPattern='tests/unit/inventory'
npx jest --testPathPattern='tests/unit/client-vendor'
npx jest --testPathPattern='tests/unit/localization'
npx jest --testPathPattern='tests/unit/cash-payments'
npx jest --testPathPattern='tests/unit/sales'
npx jest --testPathPattern='tests/unit/purchasing'

# Contract tests
npx jest --testPathPattern='tests/contract'

# All tests
npm test
```

## Expected Outcomes

| Scenario | Validate |
|----------|----------|
| 1. Module toggle | US1 |
| 2. Category + Product CRUD | US2 |
| 3. Client registration | US3 |
| 4. Tax + currency rate | US4 |
| 5. Cash register + payment | US5 |
| 6. Full sales flow + stock impact | US6, US8 |
| 7. Purchase + stock increment | US7, US8 |
| 8. Audit log | US9 |
| 9. Locale change | US10 |

For full data model details, see [data-model.md](data-model.md).
For API contract details, see [contracts/rest-api.md](contracts/rest-api.md).
