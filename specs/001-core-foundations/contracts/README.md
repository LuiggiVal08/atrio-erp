# API Contracts: Core Foundations

Contratos de la API RESTful para los módulos core de Atrio ERP.

**Base URL**: `/api/v1`

**Autenticación**: `Authorization: Bearer <token>` (JWT)

**Tenant Scope**: Incluir `X-Tenant-ID` header o extraer del JWT.

**Formato respuesta exitosa**:
```json
{
  "data": { ... },
  "meta": { "page": 1, "perPage": 20, "total": 100 }
}
```

**Formato error**:
```json
{
  "error": {
    "code": "TENANT_NOT_FOUND",
    "message": "Tenant no encontrado",
    "details": { ... }
  }
}
```

## Módulos

| Módulo | Archivo | Prefijo |
|--------|---------|---------|
| Tenants | [tenants.md](tenants.md) | `/api/v1/admin/tenants` |
| Auth | [auth.md](auth.md) | `/api/v1/auth` |
| RBAC | [rbac.md](rbac.md) | `/api/v1/tenants/:tenantId/rbac` |
| Users | [users.md](users.md) | `/api/v1/tenants/:tenantId/users` |
| Employees | [employees.md](employees.md) | `/api/v1/tenants/:tenantId/employees` |
