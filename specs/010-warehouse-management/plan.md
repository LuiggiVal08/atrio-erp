# Plan de implementación — Gestión de Almacenes y Ubicaciones Físicas

**Estado**: EN PROGRESO
**Última actualización**: 2026-11-14
**Rama**: `develop`
**Contexto**: continuación del módulo inventario (marcas, categorías, productos ya completos).

> Este documento es el ancla de contexto. Si se pierde la sesión, leer la sección
> **Checklist de progreso** para saber qué falta.

## Objetivo

Completar el módulo de almacén:

1. Paridad CRUD: detalle, edición completa, baja, orden, filtro por sucursal.
2. Corregir que los almacenes inactivos desaparecen y no se pueden reactivar.
3. Modelo de ubicación física real: Almacén → Pasillo → Estante → Nivel → Bin.
4. Almacén por defecto del tenant + uso real en POS (hoy hardcodea `'default-warehouse'`).
5. Corregir que las ventas POS no descuentan stock.
6. Vista operativa en el detalle: salud de stock y composición por categoría.

## Decisiones bloqueadas

- **Stock a nivel almacén** (`Stock` sigue en `(productId, warehouseId)`).
  Las ubicaciones son un directorio/putaway, no la fuente de verdad del saldo.
- **Jerarquía estricta**: `AISLE → SHELF → LEVEL → BIN`.
- **Se incluye** el fix de descuento de stock en POS.
- **Visuales** en el tab **Stock** del detalle de almacén:
  - barra apilada de salud (saludable/bajo/agotado/exceso),
  - donut de composición por categoría (unidades o valor).
  La lista solo muestra métricas compactas (SKUs, unidades, valor, # bajo stock).

## Modelo de datos

```prisma
enum StorageLocationType {
  AISLE
  SHELF
  LEVEL
  BIN
}

model StorageLocation {
  id          String              @id @default(uuid()) @db.Uuid
  tenantId    String              @map("tenant_id") @db.Uuid
  warehouseId String              @map("warehouse_id") @db.Uuid
  parentId    String?             @map("parent_id") @db.Uuid
  type        StorageLocationType
  code        String
  name        String?
  path        String
  isActive    Boolean             @default(true) @map("is_active")
  createdAt   DateTime            @default(now()) @map("created_at")
  updatedAt   DateTime            @updatedAt @map("updated_at")

  tenant    Tenant            @relation(fields: [tenantId], references: [id])
  warehouse Warehouse         @relation(fields: [warehouseId], references: [id])
  parent    StorageLocation?  @relation("StorageLocationTree", fields: [parentId], references: [id])
  children  StorageLocation[] @relation("StorageLocationTree")

  @@unique([warehouseId, path])
  @@index([tenantId, warehouseId, type])
  @@map("storage_locations")
}
```

- `Warehouse`: se eliminan `aisle/shelf/level/bin`; se agrega `locations StorageLocation[]`.
- `Tenant`: `defaultWarehouseId` (FK opcional) con relaciones nombradas:
  `warehouses Warehouse[] @relation("TenantWarehouses")` y
  `defaultWarehouse Warehouse? @relation("TenantDefaultWarehouse", ...)`.

### Invariantes de dominio

- `AISLE` no tiene padre.
- `SHELF` exige padre `AISLE`.
- `LEVEL` exige padre `SHELF`.
- `BIN` exige padre `LEVEL`.
- `code` único entre hermanos (y `path` único por almacén).
- El código se genera automáticamente por nivel: `AISLE` alfabético (A, B, C…), `SHELF`/`LEVEL` numérico (1, 2, 3…) y `BIN` numérico de 2 dígitos (01, 02, 03…).
- No se puede desactivar una ubicación con hijos activos.
- `path` = `parent.path + "/" + code` (AISLE = `code`).

### Migración

- Crear enum + tabla `storage_locations`.
- Backfill desde `warehouses.aisle/shelf/level/bin` (seed actual: A/B, 1, 1, 01).
- `Tenant.defaultWarehouseId` = primer almacén activo del tenant.
- Eliminar columnas planas de `warehouses`.
- Actualizar `apps/api/prisma/seed.ts` para crear la jerarquía y el default.

## Contrato API

| Método | Ruta | Permiso |
|---|---|---|
| GET | `/inventory/warehouses?includeInactive=` | `inventory:warehouse:read` |
| GET | `/inventory/warehouses/:id` | `inventory:warehouse:read` |
| GET | `/inventory/warehouses/:id/summary` | `inventory:warehouse:read` |
| PATCH | `/inventory/warehouses/:id/default` | `inventory:warehouse:update` (nuevo) |
| GET | `/inventory/warehouses/:id/locations` | `inventory:location:read` |
| POST | `/inventory/warehouses/:id/locations` | `inventory:location:create` |
| POST | `/inventory/warehouses/:id/locations/generate` | `inventory:location:create` |
| PATCH | `/inventory/locations/:id` | `inventory:location:update` |
| DELETE | `/inventory/locations/:id` | `inventory:location:delete` |

`GET /inventory/warehouses` por defecto devuelve solo activos (no rompe selectores
de POS/compras/ventas). `includeInactive=true` para la vista de gestión.

`GET /:id/summary` devuelve:

```ts
{
  warehouseId, skuCount, totalUnits, totalValue, currency,
  health: { healthy, low, out, overstock },
  categories: Array<{ categoryId: string | null; name: string | null; units: number; value: number }>,
}
```

## Frontend

- `useWarehouses({ includeInactive })`; default solo activos.
- `WarehouseListView`: editar completo, borrar con confirmación, orden, filtro
  sucursal, badge "Predeterminado", métricas compactas.
- `WarehouseDetailView` en `/inventory/warehouses/:id` con tabs:
  - **General**: edición nombre/código/sucursal, marcar predeterminado, activar/desactivar.
  - **Ubicaciones**: árbol + alta de hijo con código automático + edición + baja + generador masivo por cantidades.
  - **Stock**: tarjetas + barra de salud + donut por categoría + tabla de productos.
- Validación Zod: `shared/validation/warehouse.ts`, `storage-location.ts`.
- i18n ES/EN.

## POS + stock

- Hook `useDefaultWarehouse()` (tenant) y selector si hay varios almacenes.
- Reemplazar `'default-warehouse'` en `PosShell.tsx`.
- Validar `warehouseId` como UUID en el DTO de quick-sale.
- `quick-sale` debe disparar la deducción de stock de forma idempotente
  (evento que consume `StockEventHandler` o ajuste transaccional).

## Tests

- API unit: `storage-location` (invariantes), `warehouse.service` (inactivos,
  getById, default, summary), `quick-sale` (descuenta stock).
- API contract: endpoints de almacenes y ubicaciones.
- Web unit: lista, detalle, árbol, tab Stock.
- Playwright: almacén → jerarquía → default → venta descuenta stock.

## Checklist de progreso

### Fase 0 — Documentación
- [x] Plan documentado (`specs/010-warehouse-management/plan.md`)
- [x] ADR-0012 jerarquía física

### Fase 1 — DB + dominio
- [x] `schema.prisma`: enum + `StorageLocation` + `Tenant.defaultWarehouseId` + quitar columnas planas
- [x] Migración SQL con backfill
- [x] `storage-location.entity.ts` con invariantes
- [x] Actualizar `warehouse.entity.ts`
- [x] Actualizar `seed.ts`
- [x] `prisma generate`

### Fase 2 — API
- [x] Interfaz de repositorio + implementación Prisma (warehouse/location/summary)
- [x] `storage-location.service.ts`
- [x] `warehouse.service.ts` (findById, setDefault, getSummary, includeInactive)
- [x] DTOs (`Create/UpdateStorageLocation`, `GenerateLocations`, `includeInactive`)
- [x] Controller + permisos
- [x] Registrar en `inventory.module.ts`
- [x] `prisma generate` + typecheck API

### Fase 3 — Web almacenes
- [x] Tipos y hooks (`useWarehouses`, `useWarehouse`, `useWarehouseSummary`, locations)
- [x] `WarehouseListView` (edición, baja, orden, filtro, badge default, métricas)
- [x] `WarehouseDetailView` + ruta
- [x] `StorageLocationTree` + generador masivo
- [x] Tab Stock (salud + donut + tabla)
- [x] i18n ES/EN
- [x] Typecheck web

### Fase 4 — POS + stock
- [x] Hook almacén por defecto
- [x] Reemplazar hardcode en `PosShell.tsx`
- [x] Fix deducción de stock en `quick-sale`
- [x] Tests POS

### Fase 5 — Verificación
- [x] `npm run test:unit` (API)
- [ ] `npm run test:contract` (API) — se cuelga en este entorno (bootea Nest con DB/Redis); cubierto por tests unitarios
- [x] `npm run typecheck` (API y web)
- [x] `npm run test` (web)
- [x] Build web

## Comandos de verificación

```bash
# API
cd apps/api && npm run typecheck && npm run test:unit && npm run test:contract
# Web
cd apps/web && npm run typecheck && npm run test
# Prisma
cd apps/api && npx prisma generate
```

## Notas / riesgos

- `infrastructure/inventory.module.ts` está vacío y no se usa; el módulo real es
  `apps/api/src/modules/inventory/inventory.module.ts`.
- Quitar `aisle/shelf/level/bin` toca entidad, repo, seed y `WarehouseListView`.
- `StockEventHandler` escucha `document.approved` con `documentType === 'sales_invoice'`;
  `quick-sale` emite `document.created` con `documentType: 'sales_order'`. Hay que
  alinear el evento o ajustar stock directamente.
- La deducción de stock en POS online debe ser idempotente (evitar doble descuento
  si se reintenta el checkout).
