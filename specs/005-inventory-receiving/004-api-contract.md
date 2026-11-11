# API Contract — Inventory Receiving (Slice 1)

> Contrato REST para el Slice 1. Endpoints scoped por tenant.
> Acciones explícitas (POST /action) en lugar de PATCH de status.

---

## Purchase Orders

### POST /tenants/:tenantId/purchase-orders

Crear orden de compra en DRAFT.

```json
{
  "supplierId": "uuid",
  "lines": [
    {
      "productId": "uuid",
      "orderedQuantity": 10,
      "unitCost": 15.50,
      "taxRate": 0.16,
      "discountRate": 0.05
    }
  ],
  "notes": "Urgente"
}
```

Response: `201 Created`

```json
{
  "id": "uuid",
  "tenantId": "uuid",
  "status": "DRAFT",
  "supplierSnapshot": { "supplierId": "uuid", "name": "...", "taxId": "..." },
  "lines": [
    {
      "id": "uuid",
      "productSnapshot": { "productId": "uuid", "sku": "...", "name": "...", "unit": "..." },
      "orderedQuantity": 10,
      "unitCost": 15.50,
      "taxRate": 0.16,
      "discountRate": 0.05,
      "totalCost": 158.10,
      "receivedQuantity": 0
    }
  ],
  "notes": "Urgente",
  "createdAt": "2026-07-08T12:00:00Z",
  "updatedAt": "2026-07-08T12:00:00Z"
}
```

### GET /tenants/:tenantId/purchase-orders

Listar órdenes de compra.

Query params: `?status=DRAFT&supplierId=uuid&page=1&perPage=20`

### GET /tenants/:tenantId/purchase-orders/:id

Obtener orden completa con líneas.

Response: `200 OK` + PurchaseOrder aggregate

### POST /tenants/:tenantId/purchase-orders/:id/approve

Aprobar orden (DRAFT → APPROVED).

Response: `200 OK` + PurchaseOrder aggregate

### POST /tenants/:tenantId/purchase-orders/:id/start-receiving

Iniciar recepción (APPROVED → RECEIVING + crear GoodsReceipt PENDING).

```json
{
  "receivedAt": "2026-07-10T08:00:00Z"
}
```

Response: `200 OK`

```json
{
  "purchaseOrder": { ... },
  "goodsReceipt": {
    "id": "uuid",
    "status": "PENDING",
    "receivedAt": "2026-07-10T08:00:00Z",
    "lines": [
      {
        "id": "uuid",
        "purchaseOrderLineId": "uuid",
        "receivedQuantity": 0,
        "damagedQuantity": 0
      }
    ]
  }
}
```

---

## Goods Receipts

### POST /tenants/:tenantId/goods-receipts/:id/receive

Registrar entrada de mercancía (PENDING → RECEIVED + PO → COMPLETED).

```json
{
  "lines": [
    {
      "purchaseOrderLineId": "uuid",
      "receivedQuantity": 10,
      "damagedQuantity": 0
    }
  ]
}
```

Response: `200 OK`

```json
{
  "goodsReceipt": {
    "id": "uuid",
    "status": "RECEIVED",
    "receivedAt": "2026-07-10T08:00:00Z",
    "lines": [
      {
        "id": "uuid",
        "purchaseOrderLineId": "uuid",
        "receivedQuantity": 10,
        "damagedQuantity": 0
      }
    ]
  },
  "purchaseOrder": {
    "id": "uuid",
    "status": "COMPLETED",
    "completedAt": "2026-07-10T08:00:00Z",
    ...
  }
}
```

### GET /tenants/:tenantId/goods-receipts/:id

Obtener recepción con líneas.

---

## Events (publicados al Event Bus)

| Evento                          | Cuándo                         | Payload                                |
|---------------------------------|--------------------------------|----------------------------------------|
| `purchasing.order.created`      | UC-01                          | purchaseOrderId, status=DRAFT          |
| `purchasing.order.approved`     | UC-02                          | purchaseOrderId, status=APPROVED       |
| `purchasing.receiving.started`  | UC-03                          | purchaseOrderId, goodsReceiptId        |
| `purchasing.receiving.completed`| UC-04                          | purchaseOrderId, goodsReceiptId, lines[] con receivedQuantity, damagedQuantity |
