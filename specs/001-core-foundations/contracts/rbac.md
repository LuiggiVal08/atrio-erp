# Contract: RBAC (Roles y Permisos)

**Prefijo**: `/api/v1/tenants/:tenantId/rbac`
**Scope**: Admin del tenant

## Roles

### POST /roles — Crear Rol
```json
{
  "name": "Contador",
  "description": "Acceso a módulos contables",
  "permissionIds": ["uuid1", "uuid2"]
}
```

### GET /roles — Listar Roles
### GET /roles/:id — Obtener Rol (con permisos)
### PATCH /roles/:id — Actualizar Rol
### DELETE /roles/:id — Eliminar Rol (rechazar si tiene usuarios asignados)
### PUT /roles/:id/permissions — Asignar Permisos a Rol
```json
{
  "permissionIds": ["uuid1", "uuid2", "uuid3"]
}
```

## Permisos (solo lectura, definidos por el sistema)

### GET /permissions — Listar Permisos

**Query**: `?module=invoice`

**Response**:
```json
{
  "data": [
    { "id": "uuid", "code": "invoice.create", "module": "invoice", "action": "create", "name": "Crear Facturas" },
    { "id": "uuid", "code": "invoice.read", "module": "invoice", "action": "read", "name": "Ver Facturas" }
  ]
}
```

## Asignación User-Rol

### GET /users/:userId/roles — Obtener Roles del Usuario
### PUT /users/:userId/roles — Asignar Roles a Usuario
```json
{
  "roleIds": ["uuid-rol-1", "uuid-rol-2"]
}
```

## Validación de Permisos (interna, no expuesta como API)

El guard/middleware RBAC debe:

1. Extraer `userId` y `tenantId` del token JWT
2. Cargar los roles del usuario (cacheados en Redis, TTL 5 min)
3. Cargar los permisos de esos roles
4. Verificar que el permiso requerido esté en la lista
5. Si no: responder `403 Forbidden { "error": { "code": "INSUFFICIENT_PERMISSIONS", "message": "..." } }`
