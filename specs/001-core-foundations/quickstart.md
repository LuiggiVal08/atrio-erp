# Quickstart: Core Foundations

Guía de validación rápida para el core multi-tenant, auth y RBAC.

## Prerrequisitos

- Docker + Docker Compose
- Node.js 22+ y pnpm
- PostgreSQL 16 (vía Docker)
- Redis (vía Docker)

## Setup

```bash
# Clonar e instalar
git clone <repo> && cd atrio-erp
pnpm install

# Iniciar infraestructura
docker compose up -d postgres redis

# Configurar environment
cp .env.example .env

# Migraciones
npx prisma migrate dev

# Seed (crea super-admin y permisos base)
npx prisma db seed

# Iniciar servidor
pnpm start:dev
```

## Escenarios de Validación

### 1. Crear Tenant (Multi-Tenant)

```bash
curl -X POST http://localhost:3000/api/v1/admin/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <super-admin-token>" \
  -d '{
    "legalName": "Acme Corp, C.A.",
    "taxId": "J-12345678-0",
    "baseCurrency": "VED",
    "timezone": "America/Caracas",
    "subscriptionPlan": "business",
    "adminEmail": "admin@acme.com",
    "adminName": "Admin Acme"
  }'
```

**Esperado**: HTTP 201, response con tenant `status: "active"` y datos.

### 2. Login como Admin del Tenant

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "<contraseña-temporal>",
    "tenantId": "<uuid-del-tenant>"
  }'
```

**Esperado**: HTTP 200 con JWT token y datos del usuario + roles.

### 3. Verificar Aislamiento Multi-Tenant

```bash
# Crear segundo tenant
# Intentar acceder a recurso del Tenant A con token del Tenant B
curl -X GET http://localhost:3000/api/v1/tenants/<tenant-A-id>/users \
  -H "Authorization: Bearer <token-de-tenant-B>"
```

**Esperado**: HTTP 403 Forbidden (aislamiento enforced).

### 4. RBAC: Crear Rol y Asignar

```bash
# Crear rol
curl -X POST http://localhost:3000/api/v1/tenants/<id>/rbac/roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auditor",
    "description": "Solo lectura",
    "permissionIds": ["<permiso-invoice-read>"]
  }'

# Asignar rol a usuario
curl -X PUT http://localhost:3000/api/v1/tenants/<id>/rbac/users/<user-id>/roles \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{ "roleIds": ["<nuevo-role-id>"] }'

# Verificar enforcement: intentar crear factura sin permiso
curl -X POST http://localhost:3000/api/v1/tenants/<id>/invoices \
  -H "Authorization: Bearer <token-auditor>"
```

**Esperado**: El usuario Auditor puede leer pero recibe `403` al crear.

### 5. Separación User vs Employee

```bash
# Crear Employee
curl -X POST http://localhost:3000/api/v1/tenants/<id>/employees \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "firstName": "Juan",
    "lastName": "Pérez",
    "identityDoc": "V-12345678",
    "hireDate": "2024-01-15",
    "department": "Contabilidad",
    "position": "Contador",
    "baseSalary": 1200.00
  }'

# Crear User vinculado al Employee
curl -X POST http://localhost:3000/api/v1/tenants/<id>/users \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "email": "jperez@acme.com",
    "password": "TempPass123!",
    "name": "Juan Pérez",
    "employeeId": "<employee-uuid>"
  }'

# Eliminar User (soft)
curl -X DELETE http://localhost:3000/api/v1/tenants/<id>/users/<user-id> \
  -H "Authorization: Bearer <admin-token>"

# Verificar que Employee sigue existiendo
curl -X GET http://localhost:3000/api/v1/tenants/<id>/employees/<employee-id> \
  -H "Authorization: Bearer <admin-token>"
```

**Esperado**: Employee retorna HTTP 200 con todos sus datos intactos.

### 6. Auditoría

```bash
# Ver log de auditoría (endpoint de admin)
curl -X GET http://localhost:3000/api/v1/admin/audit-logs \
  -H "Authorization: Bearer <super-admin-token>"
```

**Esperado**: Lista de todas las mutaciones con usuario, timestamp,
before/after state.

## Frontend: Setup

```bash
# Crear app React + Vite
cd web
pnpm create vite . --template react-ts
pnpm install

# Dependencias core
pnpm add zustand @tanstack/react-query axios react-router-dom
pnpm add tailwindcss @tailwindcss/vite

# UI components (shadcn/ui)
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card table form dialog

# Iniciar en dev
pnpm dev
```

## Frontend: HTTP Interceptor (X-Tenant-ID automático)

Crear `web/src/shared/lib/api/client.ts`:

```typescript
import axios from 'axios';
import { useAuthStore } from '@/core/auth/store';
import { useTenantStore } from '@/core/tenant/store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
});

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

## Frontend: Tema Premium Dark (#1b1b1b)

En `tailwind.config.ts`:

```typescript
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#1b1b1b',
          elevated: '#2a2a2a',
        },
        surface: {
          DEFAULT: '#2a2a2a',
          hover: '#333333',
        },
        border: '#333333',
        text: {
          primary: '#e5e5e5',
          secondary: '#a0a0a0',
        },
        accent: {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
      },
    },
  },
};
```

Luego fijar clase `dark` en `<html>` (siempre oscuro para Premium Dark).

## Tests Automatizados (Backend) (Frontend)

```bash
# Unit tests
pnpm test

# Integration tests (requiere DB)
pnpm test:integration

# E2E (requiere infraestructura completa)
pnpm test:e2e
```

## Tests Automatizados (Frontend)

```bash
cd web
pnpm test              # Vitest unit
pnpm test:integration  # Integration + Testing Library
pnpm test:e2e          # Playwright E2E
```

## Interceptor Multi-Tenant (Validación manual)

```bash
# 1. Login como usuario del Tenant A → obtener JWT
# 2. En el store Zustand se establece activeTenantId = tenant-A
# 3. Toda llamada a api.get('/users') incluye automáticamente:
#    X-Tenant-ID: <tenant-A> y Authorization: Bearer <token>
# 4. Cambiar a Tenant B → activeTenantId cambia → TanStack Query
#    invalida automáticamente las queries previas (por tenantId en queryKey)
```

## Verificación de Criterios de Éxito

| Criterio | Cómo validar |
|----------|-------------|
| SC-001: Tenant < 2 min | Seguir escenario 1 + medir tiempo |
| SC-002: Login < 2s p95 | Escenario 2, 100 iteraciones, medir p95 |
| SC-003: RBAC 100% | Escenario 4, verificar todos los endpoints protegidos |
| SC-004: User≠Employee | Escenario 5 |
| SC-005: 100 tenants | Prueba de carga con 100 tenants concurrentes |

### 7. WebSockets: Eventos en Tiempo Real

```bash
# Conectar con Socket.IO (usando curl no es posible; usar script Node)
cat > /tmp/ws-test.mjs << 'SCRIPT'
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/ws', {
  auth: {
    token: 'Bearer <jwt-token>',
    tenantId: '<uuid-tenant>',
  },
});

socket.on('connect', () => {
  console.log('Conectado:', socket.id);
});

socket.on('audit:create', (event) => {
  console.log('Audit event:', event);
});

socket.on('user:updated', (event) => {
  console.log('User updated:', event);
});

socket.on('system:alert', (event) => {
  console.log('System alert:', event);
});

socket.on('disconnect', (reason) => {
  console.log('Desconectado:', reason);
});

setTimeout(() => process.exit(0), 10000);
SCRIPT

node /tmp/ws-test.mjs
```

**Esperado**: Cliente se conecta, recibe eventos en tiempo real al crear/
actualizar recursos vía REST.

### 8. JWT Blacklist (Logout + Revocación)

```bash
# 1. Login para obtener JWT
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"TempPass123!","tenantId":"<uuid>"}' \
  | jq -r '.accessToken')

# 2. Usar token (debe funcionar)
curl -s -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <uuid>"
# HTTP 200

# 3. Logout (revoca token en Redis)
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 4. Reintentar con mismo token (debe fallar)
curl -s -X GET http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: <uuid>"
# HTTP 401 Unauthorized
```

**Esperado**: Paso 2 funciona (HTTP 200), paso 3 retorna HTTP 200 (logout
exitoso), paso 4 retorna HTTP 401 porque el JWT está en blacklist de Redis.

## Verificación de Criterios de Éxito

| Criterio | Cómo validar |
|----------|-------------|
| SC-001: Tenant < 2 min | Seguir escenario 1 + medir tiempo |
| SC-002: Login < 2s p95 | Escenario 2, 100 iteraciones, medir p95 |
| SC-003: RBAC 100% | Escenario 4, verificar todos los endpoints protegidos |
| SC-004: User≠Employee | Escenario 5 |
| SC-005: 100 tenants | Prueba de carga con 100 tenants concurrentes |
