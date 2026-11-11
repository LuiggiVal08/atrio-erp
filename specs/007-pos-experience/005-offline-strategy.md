# Offline Strategy

> El POS nunca debe bloquearse por falta de conexión.
> El cajero debe poder seguir operando aunque el internet falle.

---

## Modos de conectividad

```
┌──────────────────────────────────────────────┐
│              Estado de conexión               │
├──────────────┬───────────────────────────────┤
│  Online      │ Todo funciona normalmente     │
│  Degradado   │ API lenta, catálogo local     │
│  Offline     │ Sin conexión a internet       │
│  Reconexión  │ Sincronizando datos           │
└──────────────┴───────────────────────────────┘
```

### Indicador visual

El POS muestra un badge en la Top Bar:

| Estado | Color | Acción |
|--------|-------|--------|
| Online | Verde | — |
| Degradado | Amarillo | Mostrar latencia si > 2s |
| Offline | Rojo | "Sin conexión. Las ventas se guardarán localmente." |
| Reconexión | Azul (pulso) | Mostrar progreso de sincronización |

---

## Catálogo local (IndexedDB)

El catálogo de productos debe estar disponible offline.

### Carga inicial

```
1. Al abrir sesión, el frontend solicita catálogo completo
2. Se almacena en IndexedDB con versión (timestamp)
3. Mientras se carga, la búsqueda usa datos del servidor
4. Una vez cargado, la búsqueda usa IndexedDB (más rápido, cero latencia)
```

### Actualización

| Evento | Acción |
|--------|--------|
| Conexión restaurada | Consultar versión del catálogo remoto vs local |
| Catálogo desactualizado | Descargar delta (productos modificados desde última versión) |
| Producto no encontrado localmente | Consultar API (online) |
| Producto no encontrado (offline) | Mostrar "Producto no disponible offline" |

### Estructura IndexedDB

```typescript
interface ProductCatalogDB {
  products: Product[];
  updatedAt: string;        // ISO 8601
  version: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  price: number;
  taxRate: number;
  stockAvailable: number;    // snapshot al momento de la descarga
  isActive: boolean;
  category: string;
}
```

---

## Venta offline

### Flujo

```
1. Cajero opera normalmente (añadir productos, asignar cliente, etc.)
2. Al presionar "Cobrar":
   a. Si online → proceso normal
   b. Si offline → mostrar advertencia "Venta se procesará cuando haya conexión"
      y guardar venta en cola local
3. La venta queda en estado PENDING_SYNC
4. Al reconectar, las ventas pendientes se envían en orden FIFO
5. Cada venta exitosa se marca como SYNCED
6. Si una venta falla al sincronizar (stock insuficiente), se marca como FAILED
   y se notifica al supervisor
```

### Límites

| Límite | Valor | Razón |
|--------|-------|-------|
| Máximo de ventas offline | 50 | Evitar cola gigante al reconectar |
| Tiempo máximo offline | 4 horas | Forzar cierre de sesión después |
| Stock no verificado | Sí | Se valida al sincronizar. Si falla, se notifica. |

### Cola de sincronización

```typescript
interface OfflineQueue {
  sales: QueuedSale[];
  lastSyncAttempt: string | null;
  syncStatus: 'IDLE' | 'SYNCING' | 'ERROR';
}

interface QueuedSale {
  id: string;               // local UUID
  createdAt: string;
  lines: CartLine[];
  customerId: string | null;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  total: number;
  status: 'PENDING_SYNC' | 'SYNCED' | 'FAILED';
  error: string | null;
}
```

---

## Estrategia de reconexión

```
1. Detectar reconexión (navigator.onLine + heartbeat)
2. Mostrar badge "Sincronizando..." con progreso
3. Enviar ventas offline FIFO (una a la vez)
4. Cada venta exitosa: marcar SYNCED en cola local
5. Cada venta fallida: marcar FAILED, continuar con la siguiente
   (no bloquear toda la cola por una venta fallida)
6. Al terminar: mostrar resumen:
   "Se sincronizaron 3 ventas. 1 venta falló (stock insuficiente)."
7. Las ventas fallidas quedan visibles en historial para revisión del supervisor
```

### Heartbeat

- Cada 30 segundos, el frontend hace ping a `GET /api/health`
- Si falla 3 intentos consecutivos → estado OFFLINE
- Si responde después de estar offline → estado RECONEXIÓN

---

## Qué NO hacer offline

| Operación | Comportamiento offline |
|-----------|----------------------|
| Abrir caja | No permitido (requiere validación del servidor) |
| Crear partner | No permitido (requiere validación RIF única) |
| Cobrar con tarjeta | Mostrar "Solo efectivo offline" (no hay validación POS externo) |
| Consultar saldo de caja | Mostrar último valor conocido |
| Cerrar caja | No permitido (requiere conteo final en servidor) |

---

## Almacenamiento

| Dato | Almacén | Tamaño estimado | TTL |
|------|---------|----------------|-----|
| Catálogo productos | IndexedDB | ~5 MB (1000 productos) | 24 h |
| Cola de ventas offline | IndexedDB | ~1 KB por venta | Hasta sincronizar |
| Configuración POS | localStorage | ~10 KB | Indefinido |
| Sesión | localStorage | ~500 B | 8 h (turno) |
