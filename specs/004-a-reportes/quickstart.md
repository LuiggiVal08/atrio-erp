# Quickstart: Reportes ERP

## Prerequisitos

- API corriendo (`docker compose up -d` o `npx nest start --watch`)
- MinIO corriendo (`docker compose up -d minio`)
- Redis corriendo (ya incluido en docker-compose)
- Seed data con ventas, inventario y clientes (al menos 10 transacciones)

## Escenarios de Validación

### Dashboard
```bash
# 1. Ver KPIs del dashboard
curl -s http://localhost/api/v1/reports/dashboard/summary | jq .

# 2. Ver tendencia de ventas
curl -s "http://localhost/api/v1/reports/dashboard/sales-trend?dateFrom=2026-06-01&dateTo=2026-06-30" | jq .

# 3. Ver top productos
curl -s "http://localhost/api/v1/reports/dashboard/top-products?limit=5" | jq .
```

### Exportación Async
```bash
# 4. Solicitar exportación de ventas
EXPORT=$(curl -s -X POST http://localhost/api/v1/reports/exports/request \
  -H "Content-Type: application/json" \
  -d '{"reportType": "SALES", "format": "PDF", "dateFrom": "2026-06-01", "dateTo": "2026-06-30"}')
echo $EXPORT
TASK_ID=$(echo $EXPORT | jq -r '.taskId')

# 5. Consultar estado hasta completar
sleep 5
curl -s "http://localhost/api/v1/reports/exports/$TASK_ID/status" | jq .

# 6. Descargar reporte
DOWNLOAD_URL=$(curl -s "http://localhost/api/v1/reports/exports/$TASK_ID/status" | jq -r '.downloadUrl')
curl -s -o reporte.pdf "http://localhost$DOWNLOAD_URL"
ls -la reporte.pdf
```

### Reportes Programados
```bash
# 7. Crear definición de reporte semanal
curl -s -X POST http://localhost/api/v1/reports/definitions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Reporte Semanal de Ventas",
    "type": "SALES",
    "format": "XLSX",
    "schedule": "0 8 * * 1",
    "recipients": ["admin@example.com"],
    "config": {
      "columns": ["date", "client", "total", "status"]
    }
  }' | jq .

# 8. Listar definiciones
curl -s http://localhost/api/v1/reports/definitions | jq .

# 9. Ejecutar ahora
DEF_ID=$(curl -s http://localhost/api/v1/reports/definitions | jq -r '.[0].id')
curl -s -X POST "http://localhost/api/v1/reports/definitions/$DEF_ID/execute" | jq .
```

### Widgets Dashboard
```bash
# 10. Crear widget
curl -s -X POST http://localhost/api/v1/reports/widgets \
  -H "Content-Type: application/json" \
  -d '{
    "type": "kpi",
    "config": {
      "metric": "today_sales",
      "period": "today",
      "comparison": "yesterday"
    },
    "positionX": 0,
    "positionY": 0,
    "width": 2,
    "height": 1
  }' | jq .
```

## Resultados Esperados

| # | Escenario | Resultado Esperado |
|---|-----------|--------------------|
| 1 | Dashboard KPIs | JSON con ventas hoy, mes, comparativa, stock bajo |
| 2 | Tendencia ventas | Array de { date, total } últimos 30 días |
| 3 | Top productos | Array de { product, quantity, total } ordenado por total |
| 4 | Solicitar exportación | `{ taskId, status: "pending" }` |
| 5 | Estado exportación | `{ status: "completed", downloadUrl }` |
| 6 | Descargar | Archivo PDF válido (> 1KB) |
| 7 | Crear definición | `{ id, name, schedule }` |
| 8 | Listar definiciones | Array con la definición creada |
| 9 | Ejecutar ahora | `{ taskId, status: "pending" }` |
| 10 | Crear widget | `{ id, type: "kpi" }` |
