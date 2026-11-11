# API Guidelines

> Convenciones para la API REST de Atrio. Después de leer esto, un desarrollador debe poder crear un nuevo endpoint consistente con el resto de la API.

---

## Versionado

```
/api/v1/...
/api/v2/...  (cuando sea necesario)
```

La versión va en el path. v1 es la versión actual. Cuando un endpoint cambia de forma incompatible, se crea `v2`.

---

## URL structure

```
/api/v1/{context}/{resource}[/{id}][/{action}]
```

| Ejemplo | Descripción |
|---------|-------------|
| `GET /api/v1/sales/orders` | Listar órdenes |
| `GET /api/v1/sales/orders/:id` | Obtener una orden |
| `POST /api/v1/sales/orders` | Crear orden |
| `PATCH /api/v1/sales/orders/:id` | Actualizar orden |
| `DELETE /api/v1/sales/orders/:id` | Eliminar orden |
| `POST /api/v1/sales/orders/:id/confirm` | Acción: confirmar orden |
| `GET /api/v1/catalog/products` | Listar productos |
| `GET /api/v1/inventory/stock?warehouseId=:id` | Consultar stock |

**Regla:** Recursos en plural. Acciones como sub-recursos con POST.

---

## Métodos HTTP

| Método | Uso | Idempotente |
|--------|-----|-------------|
| `GET` | Obtener recurso(s) | Sí |
| `POST` | Crear recurso o ejecutar acción | No |
| `PUT` | Reemplazar recurso completo | Sí |
| `PATCH` | Actualización parcial | Sí |
| `DELETE` | Eliminar recurso | Sí |

---

## Request headers

| Header | Obligatorio | Descripción |
|--------|-------------|-------------|
| `Authorization` | Sí (excepto login) | `Bearer <token>` |
| `X-Tenant-ID` | Sí (en requests sin JWT) | Identificador del tenant |
| `Content-Type` | Sí | `application/json` |
| `Accept-Language` | No | `es`, `en` (para i18n) |
| `Idempotency-Key` | Recomendado para POST | UUID para evitar duplicados |

---

## Response format

### Éxito

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150
  }
}
```

### Error

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Stock insuficiente para el producto X",
    "details": {
      "productId": "abc-123",
      "requested": 10,
      "available": 3
    }
  }
}
```

### Códigos HTTP

| Código | Uso |
|--------|-----|
| `200` | Éxito (GET, PATCH) |
| `201` | Creado (POST) |
| `204` | Sin contenido (DELETE) |
| `400` | Bad request (validación) |
| `401` | No autenticado |
| `403` | No autorizado (rol/permiso) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: duplicado) |
| `422` | Error de negocio (stock insuficiente, orden cancelada) |
| `429` | Rate limit excedido |
| `500` | Error interno (no exponer detalles) |

---

## Paginación

```json
GET /api/v1/sales/orders?page=1&pageSize=20

Response:
{
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Filtros

```
GET /api/v1/sales/orders?status=confirmed&customerId=abc&dateFrom=2026-01-01&dateTo=2026-06-30
```

- Filtros exactos: `?status=confirmed`
- Rangos: `?dateFrom=...&dateTo=...`, `?minTotal=...&maxTotal=...`
- Búsqueda: `?q=texto` (search genérico)

---

## Idempotencia

Para operaciones que no deben ejecutarse dos veces (crear factura, pagar orden):

```ts
POST /api/v1/sales/invoices
Headers: { Idempotency-Key: "unique-key-123" }
```

- Si el key ya fue procesado, devuelve la respuesta anterior sin ejecutar la operación
- TTL del key: 24 horas
- Response code en retry: `200` (no `201`)

---

## Serialización

- `snake_case` en JSON (convención API REST)
- Fechas en ISO 8601 (UTC)
- `null` para valores ausentes (no omitir campos)
- IDs como strings (no números, no UUID binarios)

---

## Lo que NO se expone en la API

- IDs internos de base de datos
- Passwords, tokens, secrets
- Información de otros tenants
- Stack traces (errores 500 genéricos)
- Nombres de tablas o columnas
- Estructura interna del dominio
