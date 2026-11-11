# Migration Plan — Business Partners

> Plan de migración incremental desde el modelo actual (Client + Vendor separados)
> hacia el modelo unificado (Partner con roles).
> Ningún paso debe romper funcionalidad existente.

---

## Estado actual

```text
Prisma:
  model Client  → tabla "clients"
  model Vendor  → tabla "vendors"

API:
  /client-vendor/clients
  /client-vendor/vendors

Frontend:
  /inventory/clients  → ClientListView (hooks duplicados)
  /inventory/vendors  → VendorListView (hooks duplicados)
  /inventory/clients/:id → FichaTerceroView (ya unificado)
  /inventory/vendors/:id → FichaTerceroView (ya unificado)

Shared hooks:
  shared/hooks/useClients.ts
  shared/hooks/useVendors.ts  (casi idénticos)
```

---

## Fase 1: Crear nuevo modelo (sin romper nada)

### Paso 1.1 — Migración Prisma

- Agregar modelos `Partner`, `PartnerRole`, `PartnerTag`, `Contact`, `Address`
- NO eliminar `Client` ni `Vendor`
- La migración debe ser `CREATE TABLE`, no alter

### Paso 1.2 — Servicio de dominio

- Crear `modules/business-partners/domain/`
- Implementar `PartnerEntity`, `ContactEntity`, `AddressEntity`
- Implementar `PartnerRepository` interface
- Implementar `PrismaPartnerRepository`
- Implementar casos de uso (UC-01 a UC-16)

### Paso 1.3 — API nueva

```text
POST /tenants/:tenantId/partners
GET  /tenants/:tenantId/partners
GET  /tenants/:tenantId/partners/:id
PATCH /tenants/:tenantId/partners/:id
DELETE /tenants/:tenantId/partners/:id
... más endpoints de roles, contactos, direcciones, tags
```

- Controlador nuevo: `PartnerController`
- NO modificar `ClientController` ni `VendorController`

---

## Fase 2: Migrar datos existentes

### Paso 2.1 — Script de migración de datos

```sql
-- Migrar Clients a Partners con rol CUSTOMER
INSERT INTO partners (id, type, legal_name, tax_id_value, tax_id_country, tax_id_type,
                      commercial_name, status, created_by_id, updated_by_id, created_at, updated_at)
SELECT id, 'COMPANY', legal_name, tax_id, 'VE', 'RIF',
       legal_name, 'ACTIVE', 'seed-user-id', 'seed-user-id', created_at, updated_at
FROM clients;

INSERT INTO partner_roles (partner_id, role, assigned_at)
SELECT id, 'CUSTOMER', created_at FROM clients;
```

Análogo para `vendors` → rol `SUPPLIER`.

### Paso 2.2 — Migrar relaciones existentes

Identificar todas las FKs que apuntan a `clients.id` y `vendors.id`:

- `sales_invoices.client_id`
- `purchase_orders.vendor_id`
- etc.

**Estrategia**: no modificar las tablas existentes. Los `id` de Client/Vendor
se reutilizan como `Partner.id` (son UUIDs), por lo que las FKs siguen funcionando.

---

## Fase 3: Adaptadores de compatibilidad

### Paso 3.1 — Refactorizar endpoints antiguos

```typescript
// Antes:
@Get('tenants/:tenantId/clients')
findAllClients() { return this.clientService.findAll(); }

// Después (adaptador):
@Get('tenants/:tenantId/clients')
findAllClients() {
  return this.partnerService.findAll({ role: 'CUSTOMER' });
}
```

- `ClientController.findAll` → delega a `PartnerService.findByRole(CUSTOMER)`
- `VendorController.findAll` → delega a `PartnerService.findByRole(SUPPLIER)`
- Los DTOs de respuesta se mantienen idénticos (el frontend no cambia)

### Paso 3.2 — Deprecar controllers antiguos

- Agregar header `Deprecation: true` o `Sunset: <date>` en respuestas
- Documentar en Swagger con `@deprecated`

---

## Fase 4: Frontend

### Paso 4.1 — Nuevos hooks unificados

```text
modules/business-partners/hooks/usePartners.ts
  - usePartners(filters?)       → GET /partners
  - usePartner(id)              → GET /partners/:id
  - useCreatePartner()          → POST /partners
  - useUpdatePartner()          → PATCH /partners/:id
  - useDeletePartner()          → DELETE /partners/:id
  - useAssignRole()             → POST /partners/:id/roles
  - useRemoveRole()             → DELETE /partners/:id/roles/:role
  - useAddContact()             → POST /partners/:id/contacts
  - useAddAddress()             → POST /partners/:id/addresses
  - useAddTags()                → POST /partners/:id/tags
```

### Paso 4.2 — Vistas nuevas

```text
modules/business-partners/
  index.tsx                     → entrada con rutas
  views/
    PartnerListView.tsx         → tabla unificada, filtro por rol en tabs
    PartnerDetailView.tsx       → detalle con solapas (info, contactos, direcciones, historial)
    PartnerFormView.tsx         → create / edit
```

### Paso 4.3 — Sidebar

```text
Business Partners
├── Todos        (sin filtro)
├── Clientes     (?role=CUSTOMER)
├── Proveedores  (?role=SUPPLIER)
├── Prospectos   (?role=PROSPECT)
```

### Paso 4.4 — Migrar rutas antiguas (fase final)

```text
Antes:                        Después:
/inventory/clients     →     /partners?role=CUSTOMER
/inventory/vendors     →     /partners?role=SUPPLIER
/inventory/clients/:id →     /partners/:id
/inventory/vendors/:id →     /partners/:id
```

- Agregar redirects en `AppRoutes.tsx`
- Mantener compatibilidad: si alguien visita `/inventory/clients`, redirige a `/partners?role=CUSTOMER`

### Paso 4.5 — Eliminar hooks y vistas antiguos

- Eliminar `shared/hooks/useClients.ts`
- Eliminar `shared/hooks/useVendors.ts`
- Eliminar `modules/inventory/views/ClientListView.tsx`
- Eliminar `modules/inventory/views/VendorListView.tsx`
- Mantener `FichaTerceroView.tsx` hasta migrar a `PartnerDetailView`

---

## Fase 5: Limpieza de BD

### Paso 5.1 — Una vez verificada la migración

- Agregar migración para dropear tablas `clients` y `vendors`
- Mover FKs a `partners.id` (aunque los IDs sean los mismos, la constraint debe apuntar a la tabla correcta)

### Paso 5.2 — Eliminar código legacy

- Eliminar `ClientController`, `VendorController`
- Eliminar `ClientService`, `VendorService` (si existen como clases separadas)
- Eliminar modelos `Client` y `Vendor` de Prisma

---

## Timeline estimado

| Fase | Duración estimada | Dependencias |
|------|-------------------|-------------|
| Fase 1: Nuevo modelo | 3-4 días | Ninguna |
| Fase 2: Migrar datos | 1 día | Fase 1 |
| Fase 3: Adaptadores | 1-2 días | Fase 1 |
| Fase 4: Frontend | 4-5 días | Fase 1, Fase 3 |
| Fase 5: Limpieza | 1 día | Fase 4 validada |
| **Total** | **~10-13 días** | |

> Nota: Las fases 3 y 4 pueden solaparse parcialmente (frontend usa API nueva
> mientras los adaptadores mantienen la vieja funcionando).
