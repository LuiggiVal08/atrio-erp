# Contract: Users (Usuarios)

**Prefijo**: `/api/v1/tenants/:tenantId/users`
**Scope**: Admin del tenant

## POST / — Crear Usuario
```json
{
  "email": "nuevo@acme.com",
  "password": "TempPass123!",
  "name": "Nuevo Usuario",
  "employeeId": "uuid-empleado" (opcional)
}
```

## GET / — Listar Usuarios
**Query**: `?status=active&roleId=uuid&page=1&perPage=20`

## GET /:id — Obtener Usuario (incluye roles, empleado vinculado)
## PATCH /:id — Actualizar Usuario (email, name, status)
## DELETE /:id — Soft delete (deletedAt)
## POST /:id/block — Bloquear Usuario
## POST /:id/unlock — Desbloquear Usuario
## POST /:id/reset-password — Resetear contraseña (admin force)
