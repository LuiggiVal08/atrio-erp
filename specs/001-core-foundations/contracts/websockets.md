# WebSocket Events: Core Foundations

**Protocolo**: Socket.IO sobre WebSocket (con fallback long-polling)
**Namespace**: `/ws`
**Autenticación**: JWT en `handshake.auth.token` + `handshake.auth.tenantId`

## Conexión

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/ws', {
  auth: {
    token: 'Bearer <jwt>',
    tenantId: '<tenant-uuid>',
  },
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
```

## Canales (Rooms)

| Room | Eventos | Dirección | Descripción |
|------|---------|-----------|-------------|
| `tenant:{id}:audit` | `audit:create` | Server → Client | Nuevo registro de auditoría |
| `tenant:{id}:users` | `user:created`, `user:updated`, `user:deleted` | Server → Client | Cambios en usuarios del tenant |
| `tenant:{id}:employees` | `employee:created`, `employee:updated`, `employee:deleted` | Server → Client | Cambios en empleados del tenant |
| `tenant:{id}:rbac` | `role:assigned`, `role:revoked`, `permission:changed` | Server → Client | Cambios en roles/permisos |
| `tenant:{id}:system` | `system:alert`, `system:maintenance` | Server → Client | Alertas y mantenimiento |
| `user:{id}:private` | `session:expired`, `password:changed` | Server → Client | Eventos privados del usuario |

## Eventos por Canal

### audit:create

```typescript
// Server → Client (room: tenant:{id}:audit)
interface AuditEvent {
  entityType: 'User' | 'Tenant' | 'Employee' | 'Role';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: string;
  tenantId: string;
  timestamp: string; // ISO 8601
}
```

### user:{created,updated,deleted}

```typescript
// Server → Client (room: tenant:{id}:users)
interface UserEvent {
  id: string;
  email: string;
  name: string;
  status: 'active' | 'blocked' | 'inactive';
  employeeId?: string;
  timestamp: string;
}
```

### employee:{created,updated,deleted}

```typescript
// Server → Client (room: tenant:{id}:employees)
interface EmployeeEvent {
  id: string;
  firstName: string;
  lastName: string;
  identityDoc: string;
  department: string;
  position: string;
  status: 'active' | 'inactive';
  timestamp: string;
}
```

### role:assigned / role:revoked

```typescript
// Server → Client (room: tenant:{id}:rbac)
interface RoleAssignmentEvent {
  userId: string;
  roleId: string;
  roleName: string;
  action: 'assigned' | 'revoked';
  timestamp: string;
}
```

### system:alert / system:maintenance

```typescript
// Server → Client (room: tenant:{id}:system)
interface SystemEvent {
  type: 'alert' | 'maintenance';
  severity: 'info' | 'warning' | 'error';
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
```

### session:expired / password:changed

```typescript
// Server → Client (room: user:{id}:private)
interface UserPrivateEvent {
  type: 'session:expired' | 'password:changed';
  message: string;
  timestamp: string;
}
```

## Manejo de Errores

```typescript
socket.on('connect_error', (error) => {
  if (error.message === 'Unauthorized') {
    // JWT inválido o expirado → redirect a login
    useAuthStore.getState().logout();
    window.location.href = '/login';
  }
  console.error('WS connection error:', error.message);
});
```

## Frontend: Hook useChannel

```typescript
// web/src/shared/ws/useChannel.ts
import { useEffect } from 'react';
import { useSocket } from './useSocket';

export function useChannel(channel: string, event: string, handler: (data: any) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [socket, event, handler]);
}
```

## Notas de Implementación

- El servidor asigna automáticamente `join` a `tenant:{tenantId}` al
  establecer conexión (basado en `handshake.auth.tenantId`).
- Los eventos `session:expired` se emiten al room `user:{userId}:private`
  cuando el admin bloquea al usuario o se revocan todos sus tokens.
- Los eventos de sistema (`system:alert`, `system:maintenance`) se emiten
  al room del tenant cuando el super-admin activa una alerta.
- No se emiten datos sensibles (passwords, tokens) en ningún evento.
- El cliente Socket.IO se desconecta al hacer logout y reconecta al
  hacer login nuevamente.
