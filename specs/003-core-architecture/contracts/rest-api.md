# REST API: Core Architecture & Domain Modules

**Base URL**: `/api/v1/admin/tenants/{tenantId}`

**Auth**: All endpoints require `Authorization: Bearer {jwt}` + `X-Tenant-ID` header (o tenant en path)

**RBAC**: Each endpoint requires specific permission via `@RequirePermission('module.action')`

---

## Module Guards

Every endpoint below is automatically guarded by `ModuleEnabledGuard`. If the tenant does not have the corresponding module enabled (`tenants.enabled_modules`), the API returns `403 Module Not Enabled`.

---

## 1. Module Activation (US1)

### GET /tenants/{tenantId}/modules
**Permission**: `tenant.modules.read`
**Response**: `{ enabledModules: string[] }`

### PATCH /tenants/{tenantId}/modules
**Permission**: `tenant.modules.write`
**Body**:
```json
{ "enabledModules": ["sales", "inventory", "cash-payments", "purchasing"] }
```
**Response**: `{ enabledModules: string[] }`

---

## 2. Product Categories (US2)

### `GET /inventory/categories`
**Permission**: `inventory.categories.read`

### `POST /inventory/categories`
**Permission**: `inventory.categories.write`
**Body**:
```json
{ "name": "Electrónicos", "parentId": "uuid-nullable" }
```

### `PATCH /inventory/categories/{id}`
**Permission**: `inventory.categories.write`

### `DELETE /inventory/categories/{id}`
**Permission**: `inventory.categories.write`

---

## 3. Products (US2)

### `GET /inventory/products`
**Permission**: `inventory.products.read`
**Query**: `?categoryId=&isActive=&search=&page=1&limit=20`

### `POST /inventory/products`
**Permission**: `inventory.products.write`
**Body**:
```json
{
  "sku": "WIDGET-001",
  "name": "Widget A",
  "description": "...",
  "categoryId": "uuid",
  "unitPrice": 100.00,
  "costPrice": 60.00,
  "taxId": "uuid",
  "isService": false
}
```

### `GET /inventory/products/{id}`
**Permission**: `inventory.products.read`

### `PATCH /inventory/products/{id}`
**Permission**: `inventory.products.write`

### `DELETE /inventory/products/{id}` (soft)
**Permission**: `inventory.products.write`

---

## 4. Warehouses (US2)

### `GET /inventory/warehouses`
**Permission**: `inventory.warehouses.read`

### `POST /inventory/warehouses`
**Permission**: `inventory.warehouses.write`

### `DELETE /inventory/warehouses/{id}` (soft)
**Permission**: `inventory.warehouses.write`

---

## 5. Stock (US2)

### `GET /inventory/stock?productId=&warehouseId=`
**Permission**: `inventory.stock.read`
**Response**: `{ productId, warehouseId, quantity }`

### `GET /inventory/stock/movements?productId=&warehouseId=&page=1&limit=20`
**Permission**: `inventory.stock.read`

### `POST /inventory/stock/adjust`
**Permission**: `inventory.stock.adjust`
**Body**:
```json
{
  "productId": "uuid",
  "warehouseId": "uuid",
  "type": "in",
  "quantity": 10.00,
  "reason": "Ajuste manual"
}
```

---

## 6. Clients (US3)

### `GET /clients`
**Permission**: `clients.read`

### `POST /clients`
**Permission**: `clients.write`
**Body**:
```json
{
  "documentId": "J-12345678-0",
  "legalName": "Acme Corp",
  "email": "info@acme.com",
  "phone": "+584141234567"
}
```

### `GET /clients/{id}`
**Permission**: `clients.read`

### `PATCH /clients/{id}`
**Permission**: `clients.write`

### `DELETE /clients/{id}` (soft)
**Permission**: `clients.write`

---

## 7. Vendors (US3)

Same pattern as Clients with `vendors.*` permissions and `/vendors` base path.

---

## 8. Localization Taxes (US4)

### `GET /localization/taxes`
**Permission**: `localization.taxes.read`

### `POST /localization/taxes`
**Permission**: `localization.taxes.write`
**Body**:
```json
{
  "name": "IVA 16%",
  "rate": 16.000,
  "type": "iva",
  "country": "VE"
}
```

---

## 9. Currency Rates (US4)

### `GET /localization/currency-rates`
**Permission**: `localization.currency-rates.read`

### `POST /localization/currency-rates`
**Permission**: `localization.currency-rates.write`
**Body**:
```json
{
  "from": "USD",
  "to": "VES",
  "rate": 89.50,
  "date": "2026-06-20T00:00:00Z"
}
```

---

## 10. Cash Registers (US5)

### `GET /cash-payments/registers`
**Permission**: `cash-payments.registers.read`

### `POST /cash-payments/registers`
**Permission**: `cash-payments.registers.write`

---

## 11. Payment Methods (US5)

### `GET /cash-payments/payment-methods`
**Permission**: `cash-payments.payment-methods.read`

### `POST /cash-payments/payment-methods`
**Permission**: `cash-payments.payment-methods.write`

---

## 12. Cash Movements (US5)

### `GET /cash-payments/movements?registerId=&page=1&limit=20`
**Permission**: `cash-payments.movements.read`

### `POST /cash-payments/movements`
**Permission**: `cash-payments.movements.write`
**Body**:
```json
{
  "registerId": "uuid",
  "type": "in",
  "amount": 500.00,
  "referenceType": "document",
  "referenceId": "doc-uuid",
  "description": "Pago de factura INV-001"
}
```

---

## 13. Sales Flows (US6)

### `POST /sales/quotes`
**Permission**: `sales.quotes.write`
**Body**: Similar a `POST /documents` con `documentType: "quote"`

### `POST /sales/orders`
**Permission**: `sales.orders.write`
**Body**: Similar a `POST /documents` con `documentType: "order"`

### `POST /sales/orders/{id}/convert-to-invoice`
**Permission**: `sales.invoices.write`
**Response**: Nuevo documento tipo `sales_invoice`

---

## 14. Purchasing (US7)

### `POST /purchasing/orders`
**Permission**: `purchasing.orders.write`

### `POST /purchasing/orders/{id}/receive`
**Permission**: `purchasing.orders.receive`
**Body**:
```json
{
  "warehouseId": "uuid",
  "items": [{ "productId": "uuid", "quantityReceived": 5 }]
}
```

---

## 15. Audit Logs (US9)

### `GET /admin/audit-logs?action=&entityType=&from=&to=&page=1&limit=50`
**Permission**: `admin.audit-logs.read`

---

## 16. User Locale (US10)

### `PATCH /users/me/locale`
**Permission**: `users.profile.write`
**Body**:
```json
{ "locale": "en" }
```
**Response**: JWT rotado con nuevo locale
