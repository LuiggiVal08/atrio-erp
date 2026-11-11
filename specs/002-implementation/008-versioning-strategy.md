# Versioning Strategy

> Cómo versionamos Atrio: API, base de datos, releases y contratos entre módulos.

---

## Versionado de API

```
/api/v1/sales/orders
/api/v2/sales/orders  (cuando haya cambios incompatibles)
```

### Política de versionado

| Cambio | ¿Requiere nueva versión? |
|--------|------------------------|
| Agregar endpoint | No (v1 sigue siendo compatible) |
| Agregar campo opcional en response | No |
| Agregar campo opcional en request | No |
| Eliminar endpoint | Sí (nueva versión) |
| Cambiar tipo de campo existente | Sí |
| Eliminar campo del response | Sí |
| Hacer campo requerido que antes era opcional | Sí |

### Deprecación

1. El endpoint viejo se marca como `deprecated` en los headers de response
2. Se anuncia la deprecación con mínimo 3 meses de antelación
3. El endpoint deprecated sigue funcionando pero ya no recibe mejoras
4. Se elimina en la siguiente MAJOR release

---

## Versionado del producto

**Atrio** sigue semver:

| Release | API | DB | Frecuencia |
|---------|-----|----|------------|
| `1.0.0` | v1 | Schema inicial | MVP |
| `1.1.0` | v1 | Migración compatible | Mensual |
| `1.2.0` | v1 | Migración compatible | Mensual |
| `2.0.0` | v2 | Migración mayor | Anual |

Cada release tiene:
- Tag en git (`v1.0.0`, `v1.1.0`)
- Docker image versionada
- CHANGELOG.md actualizado
- Notas de release en GitHub Releases

---

## Versionado de DB

Cada migración de Prisma tiene un nombre único y timestamp:

```
prisma/migrations/
  202607060001_add_customer_phone/
  202607060002_create_sales_schema/
  202607060003_add_order_status_index/
```

Las migraciones son inmutables después de mergeadas en `main`. No se editan migraciones existentes.

---

## Versionado de contratos entre módulos

Los contratos (`ports/in` y `ports/out`) NO tienen versión explícita en el código. Son estables por convención:

- Cambiar un contrato es un breaking change
- Requiere revisión del equipo
- Requiere actualizar todos los consumidores en el mismo PR
- Si dos consumidores necesitan versiones diferentes del mismo contrato, es hora de separar el contrato en dos

---

## Versionado de ADRs

Los ADRs no se versionan individualmente. Se identifican por número secuencial:

```
ADR-0001 (aceptado)
ADR-0002 (aceptado)
ADR-0003 (deprecado por ADR-0007)
ADR-0004 (aceptado)
ADR-0005 (aceptado)
ADR-0006 (aceptado)
ADR-0007 (reemplaza ADR-0003)
```

Un ADR puede estar en estado: `Propuesto`, `Aceptado`, `Deprecado` o `Reemplazado`.
