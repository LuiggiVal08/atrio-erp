# Observability

> Cómo se monitorea, depura y entiende Atrio en producción. Logging, métricas, tracing y health checks.

---

## 1. Logging estructurado

Todos los logs en formato JSON con campos comunes:

```json
{
  "timestamp": "2026-07-06T14:30:00.000Z",
  "level": "info",
  "message": "Sale confirmed",
  "context": {
    "requestId": "req-abc-123",
    "tenantId": "tenant-xyz",
    "userId": "user-456",
    "orderId": "ord-789"
  },
  "service": "sales",
  "environment": "production"
}
```

### Niveles

| Nivel | Uso |
|-------|-----|
| `error` | Excepciones no manejadas, errores de infraestructura, violaciones de seguridad |
| `warn` | Recuperables: rate limit, reintentos, baja disponibilidad de servicio externo |
| `info` | Eventos de dominio importantes (`SaleConfirmed`, `InvoiceIssued`, `EmployeeHired`) |
| `debug` | Traza de requests (solo desarrollo/QA, no producción) |

### Prohibido

```ts
// ✖ Prohibido: console.log en producción
console.log('Order created')

// ✔ Correcto: logger estructurado
this.logger.info('Sale confirmed', { orderId, tenantId, total })
```

---

## 2. Métricas

### Técnicas

| Métrica | Descripción |
|---------|-------------|
| `http_requests_total` | Total de requests por endpoint, método, status |
| `http_request_duration_ms` | Latencia por endpoint (p50, p95, p99) |
| `http_requests_active` | Requests concurrentes |
| `db_query_duration_ms` | Latencia de queries a PostgreSQL |
| `db_connections_active` | Conexiones activas a la DB |
| `event_bus_messages_total` | Eventos emitidos/consumidos |

### De negocio

| Métrica | Descripción |
|---------|-------------|
| `sales_confirmed_total` | Ventas confirmadas por período |
| `sales_revenue_total` | Ingresos totales por período |
| `inventory_low_stock_total` | Alertas de stock bajo |
| `cash_registers_open` | Cajas abiertas actualmente |
| `payroll_processed_total` | Nóminas procesadas por período |

Las métricas de negocio se derivan de los Domain Events.

---

## 3. Health checks

Endpoints de health check por servicio:

```
GET /api/v1/health         → { status: "ok", uptime: 3600 }
GET /api/v1/health/ready   → { status: "ok", dependencies: { db: "ok" } }
GET /api/v1/health/live    → { status: "ok" }
```

### Dependencias verificadas

- PostgreSQL (prisma.$queryRaw`SELECT 1`)
- Redis (ping)
- Servicios externos (según contexto)

---

## 4. Distributed tracing

Cada request recibe un `traceId` que se propaga:

- A través de la cadena de middlewares
- A través de los Domain Events (in-process)
- A través de logs y métricas
- A través de llamadas a servicios externos (cuando existan)

```ts
// middleware que genera/inyecta traceId
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceId = req.headers['x-trace-id'] || uuid()
    req['traceId'] = traceId
    res.setHeader('x-trace-id', traceId)
    next()
  }
}
```

---

## 5. Dashboard operativo

Métricas disponibles en Grafana (o similar):

- **Resumen**: requests/s, error rate, latencia p95
- **Por endpoint**: latencia, tasa de error, volumen
- **Por tenant**: uso de API, errores más frecuentes
- **Por contexto**: eventos emitidos/consumidos, errores de dominio
- **Infraestructura**: CPU, memoria, conexiones DB, disco

---

## 6. Alertas

| Alerta | Condición | Canal |
|--------|-----------|-------|
| Error rate alto | > 5% de errores 5xx en 5 minutos | Email + Slack |
| Latencia alta | p95 > 1s en 5 minutos | Slack |
| DB caída | Health check falla | Pager |
| Tenant bloqueado | Rate limit excedido repetidamente | Slack |
| Stock crítico | LowStockAlert para producto sin movimientos | Email (a inventory manager) |

---

## 7. Logging de auditoría

Los Domain Events se persisten en la tabla `audit_logs`:

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String
  event       String
  entityId    String
  entityType  String
  oldValue    Json?
  newValue    Json?
  occurredAt  DateTime @default(now())

  @@index([tenantId, event, occurredAt])
  @@index([entityType, entityId])
}
```

- Append-only (no se modifica ni elimina)
- Retención: 2 años
- Consultable solo por rol `audit:read`

---

## 8. Lo que NO se loggea

- Contraseñas (ni hasheadas)
- Tokens JWT completos
- Datos de tarjetas de crédito
- APIs keys de terceros
- Información PII innecesaria para la operación
