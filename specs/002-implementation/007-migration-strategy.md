# Migration Strategy

> Cómo migramos datos y esquemas sin downtime, y cómo manejamos la transición del código actual hacia la nueva arquitectura.

---

## Migraciones de esquema (Prisma)

### Forward

```bash
# Desarrollo
npx prisma migrate dev --name add_customer_phone

# Producción
npx prisma migrate deploy
```

### Rollback

Prisma no tiene rollback automático. Estrategia:

1. Cada migración incluye un script de rollback en `database/rollbacks/`
2. El rollback se aplica manualmente en caso de emergencia

```sql
-- database/rollbacks/20260706_add_customer_phone.sql
ALTER TABLE customers DROP COLUMN IF EXISTS phone;
```

### Reglas para migraciones seguras

1. **Siempre agregar, nunca eliminar en la misma migración.** Agregar columna en V1, eliminar en V2.
2. **No hacer NOT NULL sin default.** Siempre agregar columna nullable primero, poblar datos, luego hacer NOT NULL.
3. **Probar rollback antes de deployar.**
4. **Las migraciones se aplican en CI/CD automáticamente.**

---

## Migración del código actual

El repositorio actual tiene código funcional con estructura por capas (controllers/services/repositories). La migración a la nueva arquitectura sigue esta secuencia:

### Fase 1: Scaffolding (Sprint 0)

- Crear estructura de carpetas por Bounded Context
- Mover código existente a las nuevas carpetas sin cambiar lógica
- Configurar path aliases (`@/modules/sales/...`)
- Verificar que todo compila

### Fase 2: Extracción de dominio

Por cada contexto, en orden de prioridad:

1. Identificar entidades de dominio y moverlas a `domain/entities/`
2. Identificar Value Objects y crearlos en `domain/value-objects/`
3. Identificar lógica de negocio en servicios actuales y moverla a `domain/services/`
4. Definir interfaces de repositorio en `domain/repositories/`
5. Separar casos de uso en `application/use-cases/`
6. Implementar repositorios en `infrastructure/persistence/`
7. Mover controllers a `presentation/rest/`

### Fase 3: Eventos

- Identificar puntos donde se necesita Domain Events
- Implementar Event Bus (in-process)
- Conectar audit interceptor a eventos

### Fase 4: Tests

- Escribir tests faltantes
- Asegurar cobertura > 80%

---

## Migración de datos (entre versiones)

| Tipo | Estrategia | Downtime |
|------|-----------|----------|
| Schema change | Migraciones Prisma forward/rollback | Mínimo (segundos) |
| Data migration | Scripts SQL + validación post-migración | Depende del volumen |
| Modelo de datos nuevo | Nueva tabla + migración programada de datos viejos | 0 (la tabla vieja sigue funcionando) |

### Ejemplo: migración de datos de clientes

```sql
BEGIN;
-- 1. Crear nueva estructura
CREATE TABLE customers_v2 ( ... );

-- 2. Migrar datos en lotes (si hay muchos registros)
INSERT INTO customers_v2 (id, name, ...)
SELECT id, name, ... FROM customers
WHERE migrated_at IS NULL
LIMIT 1000;

-- 3. Validar consistencia
SELECT count(*) FROM customers WHERE migrated_at IS NULL;

-- 4. Una vez validado, renombrar
ALTER TABLE customers RENAME TO customers_v1;
ALTER TABLE customers_v2 RENAME TO customers;

COMMIT;
```

---

## Regla de oro

> **Toda migración debe ser reversible.** Si no se puede hacer rollback, no se deploya.
