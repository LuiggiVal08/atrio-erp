# Security Model

> Cómo se protege Atrio: autenticación, autorización, aislamiento multi-tenant, auditoría y manejo de datos sensibles.

---

## 1. Autenticación (AuthN)

### JWT con refresh tokens

- Access token: 15 minutos por defecto, configurable con `JWT_EXPIRATION`
- Refresh token: 7 días por defecto, rotativo y de un solo uso, en cookie `HttpOnly`
- El access token se renueva cerca de su vencimiento o tras un `401`; las peticiones normales no lo renuevan
- La sesión se mantiene activa mientras haya actividad del usuario dentro del límite de inactividad configurado por tenant (`settings.sessionTimeout`, 60 minutos por defecto; máximo 24 horas)
- El estado de sesión y la revocación del refresh token se mantienen en Redis

```ts
interface JwtPayload {
  sub: string          // userId
  tenantId: string     // tenant primario
  sid: string          // session id
  iat: number
  exp: number
}
```

### Flujo de login

```
POST /api/v1/auth/login
  Body: { tenant: string, email: string, password: string }
  Response: { accessToken, user }
  Set-Cookie: atrio_refresh (HttpOnly, SameSite=Lax)

POST /api/v1/auth/refresh
  Cookie: atrio_refresh
  Response: { accessToken }
  Set-Cookie: atrio_refresh (rotated)

POST /api/v1/auth/logout
  → Revoca la sesión y elimina la cookie

POST /api/v1/auth/activity
  Authorization: Bearer <accessToken>
  → Actualiza la última actividad de usuario; no renueva el token
```

---

## 2. Autorización (AuthZ)

### RBAC por tenant

- Cada tenant tiene sus propios roles
- Los roles tienen permisos sobre entidades y operaciones
- Un usuario puede tener múltiples roles dentro del mismo tenant
- Los roles se verifican en el TenantAccessGuard

```ts
@Post()
@Roles('sales:create')              // ← permiso requerido
@UseGuards(AuthGuard, RolesGuard)    // ← guards
async create(@Body() dto: CreateSaleDto) {
  return this.useCase.execute(dto)
}
```

### Permisos por operación

```
sales:create
sales:read
sales:update
sales:cancel
inventory:read
inventory:adjust
hr:create
hr:terminate
```

### Switch de tenant

- `POST /auth/switch-tenant` cambia el tenant activo
- Valida que el usuario tenga `UserAccess` activo al tenant destino
- Genera nuevo JWT con el `tenantId` actualizado

---

## 3. Multi-tenant

### Aislamiento de datos

- Todos los repositorios filtran por `tenantId`
- El `TenantAccessGuard` inyecta `effectiveTenantId` en el request
- Ninguna query puede omitir el filtro de tenant

```ts
class PrismaSaleOrderRepository {
  async findById(id: string, tenantId: string): Promise<SaleOrder | null> {
    return this.prisma.saleOrder.findFirst({
      where: { id, tenantId },  // ← siempre con tenantId
      include: { lines: true },
    })
  }
}
```

### Prohibido

```ts
// ✖ Prohibido: query sin filtro de tenant
this.prisma.saleOrder.findUnique({ where: { id } })

// ✔ Correcto
this.prisma.saleOrder.findFirst({ where: { id, tenantId } })
```

---

## 4. Protección de datos sensibles

| Dato | Medida |
|------|--------|
| Contraseñas | Bcrypt (costo ≥ 10) |
| Tokens JWT | Firmados con RS256 |
| Refresh tokens | Hash en DB (no texto plano) |
| Datos de tarjetas | Nunca se almacenan (solo token de pasarela) |
| RIF/NIT | Cifrados en reposo (PostgreSQL pgcrypto) |
| Email, teléfono | Almacenados en texto plano (son datos de contacto del ERP) |

### Headers de seguridad

```ts
// main.ts
app.use(helmet({
  contentSecurityPolicy: { /* CSP rules */ },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
}))
app.enableCors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
})
```

---

## 5. Rate limiting

- Por endpoint y por tenant
- Límite general: 100 requests/minuto por tenant
- Endpoints sensibles (login, register): 5 requests/minuto por IP
- Implementado con `@nestjs/throttler` + Redis

---

## 6. Auditoría

Todos los Domain Events generan entradas de auditoría:

```ts
interface AuditEntry {
  id: string
  tenantId: string
  userId: string
  event: string           // "SaleConfirmed"
  entityId: string        // ID de la entidad afectada
  entityType: string      // "SaleOrder"
  oldValue: any           // null si es creación
  newValue: any
  occurredAt: Date
  ipAddress?: string
  userAgent?: string
}
```

- Los logs de auditoría son inmutables (append-only)
- Retención mínima: 2 años
- Acceso restringido a role `audit:read`

---

## 7. Perímetro

```
[Internet]
    │
    ▼
[Cloudflare / CDN]      ← DDoS protection, WAF
    │
    ▼
[Nginx]                 ← TLS termination, rate limiting
    │
    ▼
[NestJS API]            ← Auth, Tenant, Roles, Validation
    │
    ▼
[PostgreSQL]            ← Red interna (no accesible desde Internet)
```

---

## 8. Checklist de seguridad por endpoint

- [ ] Requiere autenticación (`@UseGuards(AuthGuard)`)
- [ ] Requiere permisos específicos (`@Roles(...)`)
- [ ] Filtra por tenant (query incluye `tenantId`)
- [ ] Valida input (class-validator, zod)
- [ ] Rate limiting aplicado
- [ ] No expone datos sensibles en la respuesta
- [ ] Log de auditoría para operaciones críticas
- [ ] Timeout (no dejar conexiones abiertas indefinidamente)
