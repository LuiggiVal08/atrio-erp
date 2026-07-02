# REST API: Reportes ERP

Base path: `/api/v1/reports`

## Dashboard

| Método | Path | Descripción |
|--------|------|-------------|
| GET | /dashboard/summary | KPIs principales del dashboard ejecutivo |
| GET | /dashboard/sales-trend | Tendencia de ventas (diario/semanal/mensual) |
| GET | /dashboard/top-products | Top N productos más vendidos |
| GET | /dashboard/low-stock | Productos con stock bajo el umbral |
| GET | /widgets | Widgets configurados del dashboard |
| POST | /widgets | Agregar widget al dashboard |
| PATCH | /widgets/:id | Actualizar widget |
| DELETE | /widgets/:id | Eliminar widget |
| PUT | /widgets/reorder | Reordenar widgets |

## Reportes (ad-hoc)

| Método | Path | Descripción |
|--------|------|-------------|
| POST | /exports/request | Solicitar exportación de reporte (async) |
| GET | /exports/:taskId/status | Consultar estado de una exportación |
| GET | /history | Historial de reportes generados (últimas 48h) |
| GET | /history/:id/download | Obtener URL de descarga firmada |
| DELETE | /history/:id | Eliminar reporte del historial |

## Report Definitions (programados)

| Método | Path | Descripción |
|--------|------|-------------|
| GET | /definitions | Listar definiciones de reportes |
| POST | /definitions | Crear definición de reporte |
| GET | /definitions/:id | Obtener definición |
| PATCH | /definitions/:id | Actualizar definición |
| DELETE | /definitions/:id | Eliminar definición |
| POST | /definitions/:id/execute | Ejecutar reporte ahora |
| GET | /definitions/:id/executions | Historial de ejecuciones |

## Query Parameters (comunes)

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| dateFrom | ISO date | No | Inicio del período |
| dateTo | ISO date | No | Fin del período |
| clientId | string | No | Filtrar por cliente |
| productId | string | No | Filtrar por producto |
| vendorId | string | No | Filtrar por vendedor |
| warehouseId | string | No | Filtrar por almacén |
| paymentMethodId | string | No | Filtrar por método de pago |
| format | pdf/xlsx/csv | Sí (exports) | Formato de exportación |

## WebSocket Events

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| report.processing | Server → Client | `{ taskId, reportType }` | Exportación comenzó |
| report.completed | Server → Client | `{ taskId, reportType, downloadUrl, expiresAt }` | Exportación lista |
| report.failed | Server → Client | `{ taskId, reportType, error }` | Exportación falló |

## Error Response Format

Todos los endpoints usan el formato estándar de error:

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request",
  "timestamp": "2026-06-30T12:00:00Z",
  "path": "/api/v1/reports/exports/request"
}
```

| Código | Significado |
|--------|-------------|
| 400 | Bad Request — parámetros inválidos o faltantes |
| 403 | Forbidden — módulo no activo para el tenant o sin permiso |
| 404 | Not Found — recurso no encontrado |
| 409 | Conflict — reporte ya en ejecución |
| 422 | Unprocessable — filtros inválidos para el tipo de reporte |
| 500 | Internal Server Error — error en generación |

## Response Examples

### POST /exports/request
```json
{
  "taskId": "bull-job-abc123",
  "status": "pending",
  "reportType": "SALES",
  "format": "PDF"
}
```

### GET /exports/:taskId/status
```json
{
  "taskId": "bull-job-abc123",
  "status": "completed",
  "downloadUrl": "/api/v1/reports/history/xyz789/download",
  "fileSize": 245760,
  "expiresAt": "2026-07-02T17:00:00Z"
}
```

### GET /dashboard/summary
```json
{
  "todaySales": 1250.00,
  "monthSales": 45230.00,
  "monthSalesPrev": 38900.00,
  "salesChange": 16.3,
  "activeClients": 45,
  "lowStockProducts": 8,
  "todayCashMovements": 15,
  "pendingOrders": 23
}
```
