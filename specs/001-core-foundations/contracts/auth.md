# Contract: Auth (Autenticación)

**Prefijo**: `/api/v1/auth`
**Scope**: Público (no requiere token)

## POST /login — Iniciar Sesión

**Request**:
```json
{
  "email": "admin@acme.com",
  "password": "********",
  "tenantId": "uuid-del-tenant"
}
```

**Response 200**:
```json
{
  "data": {
    "token": "jwt.token.aqui",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "name": "Admin Acme",
      "roles": ["tenant_admin"]
    }
  }
}
```

**Errores**: `401` credenciales inválidas, `403` tenant suspendido,
`429` demasiados intentos.

## POST /logout — Cerrar Sesión

**Headers**: `Authorization: Bearer <token>`

**Response 200**: `{ "data": { "message": "Sesión cerrada" } }`

## POST /password-reset/request — Solicitar Reset

**Request**:
```json
{
  "email": "admin@acme.com",
  "tenantId": "uuid"
}
```

**Response 200**: `{ "data": { "message": "Si el email existe, recibirá instrucciones" } }`

## POST /password-reset/confirm — Confirmar Reset

**Request**:
```json
{
  "token": "reset-token",
  "newPassword": "nueva-contraseña"
}
```
