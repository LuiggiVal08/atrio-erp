# Contract: Employees (Empleados)

**Prefijo**: `/api/v1/tenants/:tenantId/employees`
**Scope**: Admin del tenant

## POST / — Crear Empleado
```json
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "identityDoc": "V-12345678",
  "hireDate": "2024-01-15",
  "department": "Contabilidad",
  "position": "Contador Senior",
  "baseSalary": 1200.00
}
```

## GET / — Listar Empleados
**Query**: `?status=active&department=Contabilidad&page=1&perPage=20`

## GET /:id — Obtener Empleado (incluye user vinculado si existe)
## PATCH /:id — Actualizar Empleado
## DELETE /:id — Soft delete (no afecta User vinculado)
## POST /:id/link-user — Vincular a Usuario
```json
{
  "userId": "uuid-usuario"
}
```

## POST /:id/unlink-user — Desvincular Usuario
```json
{
  "userId": "uuid-usuario"
}
```
