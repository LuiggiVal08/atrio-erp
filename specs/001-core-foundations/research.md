# Research: Core Foundations Tech Stack

## Unknown 1: Language & Framework

**Context**: Atrio ERP necesita un lenguaje y framework para construir un
SaaS multi-tenant con API RESTful, tipado fuerte, buen soporte PostgreSQL,
y arquitectura modular/plug-in (Constitución v1.1.0, Principio I).

### Opciones evaluadas

| Opción | Framework | Performance | Modularidad | Ecosistema PostgreSQL |
|--------|-----------|-------------|-------------|----------------------|
| A | NestJS (TypeScript/Node.js) | Alta | Excelente (módulos, DI) | Excelente (TypeORM, Prisma) |
| B | FastAPI (Python) | Alta (asyncio) | Buena (APIRouter) | Excelente (SQLAlchemy, Alembic) |
| C | Go (net/http + chi/gin) | Muy alta | Básica (paquetes) | Excelente (pgx, sqlc) |

### Decisión: **A - NestJS (TypeScript/Node.js)**

**Rationale**:
- Arquitectura modular con inyección de dependencias nativa. Cada dominio
  (tenant, auth, rbac, user, employee) puede ser un módulo NestJS
  independiente, alineado con el Principio I de la Constitución.
- TypeScript proporciona tipado fuerte para entidades de negocio críticas.
- Prisma ORM como capa de datos: generación de tipos, migraciones
  backward-compatibles, soporte nativo de PostgreSQL RLS.
- Ecosistema maduro de autenticación (Passport, JWT), hashing (bcrypt), RBAC
  (CASL o custom guards).
- Docker multi-stage para builds optimizados, desplegable en VPS.
- Rendimiento suficiente para 100+ tenants concurrentes (SC-005).

**Alternativas consideradas**:
- **FastAPI (Python)**: Excelente para prototipado rápido, pero la
  modularidad no es nativa del framework; requiere estructura manual.
- **Go**: Rendimiento superior pero mayor tiempo de desarrollo y ecosistema
  de terceros más pequeño para ERP. Ideal para microservicios de alta
  frecuencia si se requiere en el futuro.

## Unknown 2: ORM & Persistencia

**Decisión**: **Prisma ORM + PostgreSQL**

**Rationale**:
- Prisma genera tipos TypeScript automáticamente desde el schema,
  garantizando type-safety entre DB y aplicación.
- Migraciones declarativas con `prisma migrate` — backward-compatibles por
  diseño (no permite cambios destructivos sin confirmación).
- Soporte de esquemas PostgreSQL para estrategia multi-tenant con
  `tenant_id` column + Row-Level Security (RLS) como capa de defensa
  adicional.
- Pool de conexiones gestionado con `pgBouncer` para escalar a 100+ tenants.

## Unknown 3: Testing Framework

**Decisión**: **Jest + Supertest (unit + integration) + Playwright (E2E)**

**Rationale**:
- Jest: estándar en ecosistema NestJS/TypeScript, excellent mocking.
- Supertest: testing de endpoints HTTP sin levantar servidor completo.
- Playwright: E2E para flujos críticos (registro tenant, login, RBAC).
- Contract tests: Supertest validando schemas de respuesta.
- Cobertura mínima requerida: 80% en módulos core, 100% en lógica de
  autorización (RBAC enforcement).

## Unknown 4: Dependencias Principales

| Propósito | Dependencia | Justificación |
|-----------|------------|---------------|
| Framework | `@nestjs/core`, `@nestjs/common` | Modular, DI, guards, pipes |
| ORM | `prisma` + `@prisma/client` | Type-safe, migraciones, RLS |
| Auth | `@nestjs/passport` + `passport-jwt` + `bcrypt` | JWT, hashing seguro |
| RBAC | Guards personalizados + CASL | Permisos granulares por módulo/acción |
| Validación | `class-validator` + `class-transformer` | DTOs con decoradores |
| Documentación API | `@nestjs/swagger` (OpenAPI) | Documentación automática |
| Testing | `jest`, `supertest`, `playwright` | Unit, integration, E2E |
| Base de datos | `postgresql:16` + `pgBouncer` | Multi-tenant, conexiones |
| Cache | `redis` | Sesiones, rate-limiting, caché de permisos |
| Contenedor | `docker` + `docker-compose` | Desarrollo local (WSL2) |

---

## Frontend: Framework

**Context**: Atrio ERP necesita una interfaz web que consuma la API REST
multi-tenant, gestione estado global de sesión/tenant, y aplique el tema
Premium Dark definido en la Constitución (UI/UX Design Token Standardization).

### Opciones evaluadas

| Opción | Framework | Estado | Fetching | Bundle | Ecosistema UI |
|--------|-----------|--------|----------|-------|---------------|
| A | React 19 + Vite | Zustand | TanStack Query v5 | Pequeño | Tailwind + shadcn/ui |
| B | Next.js 15 (App Router) | Zustand | TanStack Query v5 | SSR/SSG | Tailwind + shadcn/ui |
| C | Vue 3 + Vite | Pinia | TanStack Vue Query | Pequeño | Tailwind + shadcn/vue |

### Decisión: **B - React 19 + TypeScript + Vite + React Router v7**

**Rationale**:
- React 19 con Server Components no es necesario para una SPA de gestión
  empresarial; Vite + SPA es más simple, rápido en dev, y suficiente para
  ERP donde el SEO no es crítico.
- **Zustand**: Estado global mínimo (sesión, tenant activo, preferencias).
  Sin boilerplate, sin providers, rendimiento excelente.
- **TanStack Query v5**: Toda la comunicación con el backend. Caché,
  deduplicación, stale-while-revalidate, paginación, mutaciones optimistas.
  Clave para multi-tenant: query keys incluyen `tenantId` para aislamiento
  de caché entre empresas.
- **Axios + Interceptor**: Capa HTTP que adjunta automáticamente:
  `X-Tenant-ID` desde Zustand store y `Authorization: Bearer <token>`.
  Maneja 401 → redirect a login, 403 → notificación.
- **Tailwind CSS 4**: Utilidades para construir el tema Premium Dark con
  tokens personalizados. Paleta base: `#1b1b1b` como canvas principal.

**Alternativas consideradas**:
- **Next.js**: Overkill para SPA administrativa. Si se requiere SSR en el
  futuro (reportes público, landing), se puede migrar parcialmente.
- **Vue 3**: Excelente, pero la decisión de backend NestJS hace que
  TypeScript + React unifique el stack.

## Frontend: HTTP Interceptor (Axios)

**Decisión**: Axios instance singleton con interceptor request/response.

**Patrón**:
```typescript
// shared/lib/api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/core/auth/store';
import { useTenantStore } from '@/core/tenant/store';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const tenantId = useTenantStore.getState().activeTenantId;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

**Rationale**: Acceso a stores Zustand fuera de React vía `.getState()`.
Interceptor único evita repetir headers en cada llamada.

## Frontend: Estructura de Carpetas (Domain-Driven)

**Decisión**: feature-first / domain-modules. Cada módulo de dominio del
backend tiene su espejo en frontend.

```
web/
├── src/
│   ├── core/                        # Domain modules (espejo del backend)
│   │   ├── auth/                    # Login, logout, password-reset
│   │   │   ├── store.ts             #   Zustand store
│   │   │   ├── api.ts               #   TanStack Query hooks + API calls
│   │   │   ├── components/          #   Componentes de UI
│   │   │   └── pages/               #   Páginas (login, reset-password)
│   │   ├── tenant/                  # Gestión multi-tenant
│   │   │   ├── store.ts
│   │   │   ├── api.ts
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── rbac/                    # Roles y permisos
│   │   │   ├── store.ts
│   │   │   ├── api.ts
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── users/                   # Usuarios
│   │   │   ├── store.ts
│   │   │   ├── api.ts
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── employees/               # Empleados
│   │       ├── store.ts
│   │       ├── api.ts
│   │       ├── components/
│   │       └── pages/
│   ├── shared/                      # Capa compartida
│   │   ├── ui/                      #   Design system (shadcn/ui + Premium Dark)
│   │   │   ├── Button/
│   │   │   ├── Card/
│   │   │   ├── DataTable/
│   │   │   ├── Form/
│   │   │   └── Layout/
│   │   ├── lib/                     #   Utilidades
│   │   │   ├── api/                 #     Axios instance + interceptors
│   │   │   ├── utils.ts             #     Funciones helper
│   │   │   └── permissions.ts       #     Guards de permisos frontend
│   │   └── hooks/                   #   Hooks compartidos
│   │       ├── useTenant.ts
│   │       └── usePermissions.ts
│   ├── app/                         # Configuración de la app
│   │   ├── router.tsx               #   React Router config
│   │   ├── providers.tsx            #   QueryClient + providers
│   │   └── App.tsx
│   └── styles/                      # Estilos y tema
│       ├── globals.css              #   Tailwind base
│       └── theme.ts                 #   Tokens Premium Dark
├── public/
│   └── favicon.svg
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

**Rationale**: Cada módulo de dominio es autocontenido: store + API + UI.
La carpeta `shared/` evita duplicación de componentes y utilidades.
La separación store/api/components/pages permite testing granular.

## Frontend: Premium Dark Theme (Tokens)

**Decisión**: Tailwind CSS con tokens CSS personalizados basados en
`#1b1b1b`.

**Paleta Base** (de la Constitución):
- Canvas principal: `#1b1b1b`
- Superficies elevadas: escalas desde `#1b1b1b` hasta `#2a2a2a`
- Texto primario: `#e5e5e5`
- Texto secundario: `#a0a0a0`
- Acento primario: tono azul oscuro (#2563eb → ajustado a la paleta dark)
- Bordes: `#333333`
- Éxito: `#22c55e`
- Error: `#ef4444`
- Advertencia: `#f59e0b`

**Implementación**: `tailwind.config.ts` con `darkMode: 'class'` fijo en
modo oscuro. Extensiones de color custom en la configuración.

## Multi-Tenant Strategy

**Decisión**: **Shared schema + `tenant_id` column + PostgreSQL RLS**

**Rationale**:
- Escala hasta 500+ tenants sin problemas (schema-per-tenant es overkill
  para < 1000 tenants).
- RLS como defensa en profundidad: incluso si un query olvida el filtro
  `tenant_id`, la política RLS lo enforcea a nivel DB.
- Cross-tenant analytics posible para el super-admin.
- Migraciones simples (Alembic/Prisma funcionan con un solo schema).
- Consistente con la Constitución (Principio V: "Every database query MUST
  strictly scope data within the authenticated tenant context boundary").

---

## Redis: Caching & Rate Limiting

**Context**: Atrio ERP necesita caché de configuraciones por tenant,
rate-limiting por IP/tenant, y blacklist de JWT revocados.

### Caching

**Decisión**: Redis como caché central con TTL por tipo de dato.

| Dato | Key Pattern | TTL | Justificación |
|------|-------------|-----|---------------|
| Config tenant | `tenant:{id}:config` | 5 min | Se modifica poco, reduce queries DB |
| Permisos por rol | `rbac:role:{id}:permissions` | 10 min | Cambia solo con asignación admin |
| Permisos por usuario | `rbac:user:{id}:permissions` | 5 min | Se invalida al cambiar roles |
| Preferencias UI | `tenant:{id}:prefs:{userId}` | 30 min | Cambia con poca frecuencia |

**Invalidación**: Al modificar un recurso, se elimina la clave Redis
correspondiente (cache-aside pattern). Para cambios globales (editar permiso),
se usa Redis Pub/Sub o se barren keys por patrón (`rbac:role:*`).

### Rate Limiting

**Decisión**: Rate limiting en dos capas: IP (global) y Tenant (por compañía).

**Capa 1 - IP (bypass de tenant)**:
```typescript
// Estrategia: Sliding Window con Redis Sorted Sets
// Key: ratelimit:ip:{clientIp}:{endpoint}
// Score: timestamp, Member: timestamp
// Ventana: 60s, Max: 100 requests
```

**Capa 2 - Tenant (por usuario autenticado)**:
```typescript
// Key: ratelimit:tenant:{tenantId}:{userId}:{endpoint}
// Ventana: 60s, Max: 500 requests (depende del plan)
```

**Planes de suscripción y límites**:
| Plan | RPM por usuario | RPM por tenant (global) |
|------|----------------|------------------------|
| Free | 30 | 500 |
| Starter | 60 | 2000 |
| Business | 120 | 10000 |
| Enterprise | Ilimitado | Ilimitado |

Los límites se almacenan en Redis como hash: `plan:limits:{planName}`.

### JWT Blacklist

**Decisión**: JWT revocados se almacenan en Redis hasta su expiración natural.

```typescript
// Al hacer logout o revocar token:
// SET jtl:{jti} 1 EX {remainingTTL}
// Verificación en JWT Guard:
//   if (await redis.exists(`jtl:${jti}`)) throw new UnauthorizedException();
```

**Rationale**: No requiere tabla DB; el TTL de Redis coincide con la
expiración del JWT, auto-limpieza. Performance O(1) en verificación.

---

## WebSockets: Comunicación en Tiempo Real

**Context**: El frontend React necesita recibir eventos del backend sin
polling: notificaciones de auditoría, actualizaciones de datos compartidos,
alertas del sistema.

**Decisión**: NestJS Gateways + Socket.IO con autenticación JWT + ámbito
multi-tenant.

### Arquitectura

```
Frontend (Socket.IO client)
  │
  ▼
NestJS Gateway
  │
  ├─► WsGuard (JWT validation + tenant extraction)
  ├─► Redis Adapter (escalable multi-instancia)
  └─► Event Handlers (por módulo)
```

### Autenticación

```typescript
// Client conecta con token en handshake
const socket = io('ws://localhost:3000', {
  auth: { token: 'Bearer <jwt>', tenantId: '<uuid>' }
});

// WsGuard verifica JWT y tenant, luego suscribe a rooms por tenant
@WebSocketGateway({ namespace: '/ws' })
export class MainGateway {
  @WebSocketServer() server: Server;

  afterInit() {
    // Autenticación vía middleware
    this.server.use(async (socket, next) => {
      const token = socket.handshake.auth.token;
      const tenantId = socket.handshake.auth.tenantId;
      // Validar JWT y tenant, luego next()
    });
  }

  handleConnection(client: Socket) {
    // Suscribir a room del tenant
    client.join(`tenant:${client.data.tenantId}`);
  }
}
```

### Canales (Rooms)

| Room | Eventos | Descripción |
|------|---------|-------------|
| `tenant:{id}:audit` | `audit:create` | Nuevo registro de auditoría |
| `tenant:{id}:users` | `user:updated`, `user:deleted` | Cambios en usuarios |
| `tenant:{id}:employees` | `employee:updated`, `employee:deleted` | Cambios en empleados |
| `tenant:{id}:rbac` | `role:assigned`, `permission:changed` | Cambios RBAC |
| `tenant:{id}:system` | `system:alert`, `system:maintenance` | Alertas del sistema |
| `user:{id}:private` | `session:expired`, `password:changed` | Eventos privados por usuario |

### Emisión desde Servicios

```typescript
// En cualquier servicio NestJS
@Inject() private gateway: MainGateway;

this.gateway.server
  .to(`tenant:${tenantId}`)
  .emit('audit:create', { entityType, entityId, action, timestamp });
```

**Rationale**: Socket.IO sobre WebSocket nativo porque proporciona
reconexión automática, fallback a long-polling, y rooms por namespace.
Redis Adapter permite escalar horizontalmente múltiples instancias de
NestJS compartiendo eventos.

---

## Audit Trail: Inmutabilidad en PostgreSQL

**Context**: La Constitución exige auditoría immutable de todas las
mutaciones (Principio III). No se puede usar un servicio externo; debe
residir en PostgreSQL.

**Decisión**: Tablas de auditoría independientes (una por entidad core),
solo INSERT, con políticas RLS y triggers desde la aplicación.

### Esquema

```sql
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50)   NOT NULL,  -- 'User', 'Tenant', 'Employee', 'Role'
  entity_id   UUID           NOT NULL,
  action      VARCHAR(10)    NOT NULL,  -- 'CREATE', 'UPDATE', 'DELETE'
  before      JSONB,                     -- Estado anterior (NULL en CREATE)
  after       JSONB,                     -- Estado nuevo (NULL en DELETE)
  user_id     UUID           NOT NULL,
  tenant_id   UUID           NOT NULL,
  ip_address  INET,
  user_agent  VARCHAR(255),
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Índices para consultas de auditoría
CREATE INDEX idx_audit_tenant ON audit_log (tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_user   ON audit_log (user_id, created_at DESC);
```

### Inmutabilidad

1. Solo `INSERT` — nunca `UPDATE` o `DELETE` en `audit_log`.
2. Política RLS que permite INSERT pero bloquea UPDATE/DELETE incluso para
   super-admin (a nivel DB).
3. `created_at` con `DEFAULT NOW()` y `NOT NULL` — no se puede falsear.
4. Los datos sensibles (passwords) se excluyen de `before`/`after` (se
   reemplazan con `"***"`).

### Triggers vs Aplicación

**Decisión**: Los registros de auditoría se generan desde la aplicación
(NestJS interceptors/decorators), NO desde triggers SQL.

**Rationale**:
- Los triggers SQL no tienen acceso al `userId` que realizó la operación
  (el usuario autenticado viene del JWT, no de la conexión DB).
- Un interceptor NestJS puede capturar `before`/`after` state, el usuario
  del request, IP, user-agent, y tenant ID.
- Los triggers serían una capa extra de complejidad sin beneficio real ya
  que la app siempre es la que escribe.

### Interceptor de Auditoría

```typescript
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { user, tenantId, method, originalUrl } = request;

    return next.handle().pipe(
      tap(async (responseBody) => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          await this.prisma.auditLog.create({
            data: {
              entityType: this.extractEntityType(originalUrl),
              entityId: responseBody?.id || request.params.id,
              action: this.mapMethodToAction(method),
              before: request.originalBody || null,
              after: responseBody || null,
              userId: user?.id,
              tenantId: tenantId,
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'],
            },
          });
        }
      }),
    );
  }
}
```

---

## Docker Compose: Infraestructura Local

**Context**: Desarrollo local necesita PostgreSQL, Redis y pgBouncer
orquestados.

**Decisión**: Un solo `docker-compose.yml` en la raíz del repositorio.

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: atrio-postgres
    environment:
      POSTGRES_DB: atrio_erp
      POSTGRES_USER: atrio
      POSTGRES_PASSWORD: atrio_dev_pass
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U atrio -d atrio_erp']
      interval: 5s
      timeout: 5s
      retries: 5

  pgbouncer:
    image: edoburu/pgbouncer:latest
    container_name: atrio-pgbouncer
    environment:
      DB_USER: atrio
      DB_PASSWORD: atrio_dev_pass
      DB_HOST: postgres
      DB_PORT: '5432'
      DB_NAME: atrio_erp
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
    ports:
      - '6432:5432'
    depends_on:
      postgres:
        condition: service_healthy

  redis:
    image: redis:7-alpine
    container_name: atrio-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

**Rationale**:
- PostgreSQL 16 Alpine: imagen ligera, healthcheck para dependencias.
- pgBouncer: pool de conexiones en modo transaccional para escalar conexiones
  (especialmente importante con Prisma que abre múltiples conexiones).
- Redis 7 Alpine: imagen ligera con persistencia RDB por defecto.
- Volúmenes nombrados para persistencia entre reinicios.
- Puerto 6432 para pgBouncer (el 5432 queda para conexiones directas si se
  necesita).
