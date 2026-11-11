# Database Strategy

> Cómo se gestiona la base de datos en Atrio: esquema, migraciones, multi-tenant y rendimiento.

---

## Multi-tenant: schema por tenant

**Decisión:** Un schema de PostgreSQL por tenant, todos en la misma base de datos.

```
atrio_db/
  ├── public/        → Tablas compartidas (tenants, users)
  ├── tenant_abc/    → Datos del tenant "abc"
  ├── tenant_xyz/    → Datos del tenant "xyz"
  └── ...
```

### Alternativas descartadas

| Alternativa | Razón de descarte |
|-------------|------------------|
| Fila por tenant (tenant_id en cada tabla) | Riesgo alto de filtraciones. Una query sin `WHERE tenant_id = ?` expone datos de todos los tenants. |
| Base de datos por tenant | Complejidad operativa: backups, conexiones, migraciones para cientos de DBs. |
| Schema por tenant | Cada tenant tiene su propio schema aislado, las tablas se repiten. Migraciones se aplican a todos los schemas. Aislamiento fuerte. |

### Implementación

```prisma
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Tablas compartidas (public)
model Tenant {
  id   String @id
  slug String @unique
  name String
}

model User {
  id       String @id
  email    String @unique
  password String
}

// Las tablas de tenant se crean por schema
// No se definen en schema.prisma directamente
// Se migran mediante scripts SQL aplicados a cada schema
```

Las migraciones se aplican a través de:

```bash
# Aplica migraciones a TODOS los schemas de tenant
npx prisma migrate deploy  # aplica a public
./scripts/migrate-tenants.sh  # aplica a cada schema de tenant
```

---

## Prisma + multi-schema

Prisma no soporta nativamente multi-schema con diferentes tablas por schema. La estrategia:

1. **Prisma solo para `public`** (tenants, users, shared tables)
2. **SQL directo o Prisma `$queryRaw`** para schemas de tenant
3. **Wrapper** en cada repositorio que resuelve el schema según `tenantId`

```ts
class PrismaBaseRepository {
  protected getSchema(tenantId: string): string {
    return `tenant_${tenantId.replace(/-/g, '_')}`
  }

  protected async executeRaw<T>(
    tenantId: string,
    query: string,
    params: any[],
  ): Promise<T> {
    const schema = this.getSchema(tenantId)
    // Set schema en runtime
    await this.prisma.$executeRawUnsafe(`SET search_path TO ${schema}`)
    return this.prisma.$queryRawUnsafe<T>(query, ...params)
  }
}
```

---

## Estrategia de migraciones

### Tablas compartidas (public)

- Prisma migrations estándar en `prisma/migrations/`
- Se aplican con `npx prisma migrate deploy`

### Tablas por tenant

- Scripts SQL versionados en `database/migrations/tenant/`
- Se aplican con `./scripts/migrate-tenants.sh`
- El script itera sobre todos los schemas de tenant y aplica las migraciones pendientes

```bash
for schema in $(get_all_tenant_schemas); do
  echo "Migrating $schema..."
  for migration in database/migrations/tenant/*.sql; do
    psql -d atrio_db -c "SET search_path TO $schema" -f "$migration"
  done
done
```

---

## Naming conventions

| Objeto | Convención | Ejemplo |
|--------|-----------|---------|
| Tablas | `snake_case` plural | `sale_orders`, `order_lines` |
| Columnas | `snake_case` | `customer_id`, `total_amount` |
| PKs | `id` (UUID v7) | `id UUID PRIMARY KEY` |
| FKs | `{table}_id` | `customer_id` |
| Índices | `idx_{table}_{column}` | `idx_sale_orders_status` |
| Schemas de tenant | `tenant_{slug}` | `tenant_mi_empresa` |

---

## Índices

| Tabla | Índice | Razón |
|-------|--------|-------|
| `sale_orders` | `(status, created_at)` | Filtro de estado + ordenamiento por fecha |
| `sale_orders` | `(customer_id)` | Búsqueda por cliente |
| `stock_items` | `(product_id, warehouse_id)` | Consulta de disponibilidad |
| `audit_logs` | `(tenant_id, event, occurred_at)` | Consulta de auditoría por tenant |

---

## Estrategia de backups

| Tipo | Frecuencia | Retención |
|------|-----------|-----------|
| Full | Diario | 30 días |
| WAL (Point-in-time) | Continuo | 7 días |
| Mensual | 1 vez/mes | 12 meses |

**Prueba de restore:** Cada mes se restaura el backup en un entorno de prueba y se verifica integridad.
