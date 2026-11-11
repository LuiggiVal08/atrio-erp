# Acceptance Criteria — Business Partners

> Criterios de aceptación para el módulo Business Partners V1.
> Cada criterio debe ser verificable mediante tests (unit, integration, contract, E2E).

---

## Cobertura de tests

| Tipo | Cobertura mínima |
|------|------------------|
| Unit (use cases) | 100% de los casos de uso |
| Integration (repository) | CRUD + consultas por role/status/tags |
| Contract (API) | Todos los endpoints, incluyendo adaptadores legacy |
| E2E (frontend) | Crear Partner + asignar roles + ver en listado |

---

## Criterios funcionales

### CF-01: Creación de Partner

```
Given:  Usuario autenticado con permiso partners:write
When:   Envía POST /partners con { type: "COMPANY", legalName: "ABC S.A.",
        taxId: { value: "J-12345678-0", country: "VE", type: "RIF" } }
Then:   Retorna 201
        El Partner tiene status ACTIVE
        El Partner tiene rol PROSPECT por defecto
        Se emite evento partner.created
```

### CF-02: Partner con múltiples roles

```
Given:  Un Partner existe con rol CUSTOMER
When:   Se asigna rol SUPPLIER
Then:   GET /partners/:id retorna ambos roles
        GET /partners?role=CUSTOMER lo incluye
        GET /partners?role=SUPPLIER lo incluye
```

### CF-03: Búsqueda por texto

```
Given:  Partners: "ABC S.A.", "Comercial XYZ", "ABC Distribuciones"
When:   GET /partners?search=ABC
Then:   Retorna "ABC S.A." y "ABC Distribuciones"
        NO retorna "Comercial XYZ"
```

### CF-04: Archivar Partner

```
Given:  Un Partner activo con roles CUSTOMER y SUPPLIER
When:   DELETE /partners/:id
Then:   Retorna 204
        GET /partners/:id retorna 404
        GET /partners?status=ACTIVE NO lo incluye
        GET /partners?status=INACTIVE lo incluye (si aplica)
        Las transacciones existentes (facturas, órdenes) NO se ven afectadas
```

### CF-05: Reactivar Partner

```
Given:  Un Partner archivado
When:   PATCH /partners/:id con { status: "ACTIVE" }
Then:   GET /partners/:id retorna el Partner con status ACTIVE
        Los roles anteriores se preservan
```

### CF-06: Agregar contacto primario

```
Given:  Un Partner sin contactos
When:   POST /partners/:id/contacts con { fullName: "Juan", isPrimary: true }
Then:   El contacto se crea con isPrimary = true
When:   POST /partners/:id/contacts con otro { fullName: "María", isPrimary: true }
Then:   Juan pasa a isPrimary = false
        María queda como isPrimary = true
```

### CF-07: Etiquetas

```
Given:  Un Partner sin etiquetas
When:   POST /partners/:id/tags con { tags: ["VIP", "Mayorista"] }
Then:   GET /partners/:id muestra tags: ["VIP", "Mayorista"]
When:   DELETE /partners/:id/tags con { tags: ["Mayorista"] }
Then:   GET /partners/:id muestra tags: ["VIP"]
```

### CF-08: Filtro por etiquetas

```
Given:  Partners con tags: "VIP", "Mayorista", "Internacional"
When:   GET /partners?tags=VIP,Mayorista
Then:   Retorna solo Partners que tienen AMBAS etiquetas
```

---

## Criterios de migración

### CM-01: Adaptador de clients

```
Given:  El endpoint /clients existe como adaptador
When:   POST /tenants/:tenantId/clients con body de Client legacy
Then:   Se crea un Partner con rol CUSTOMER
        GET /tenants/:tenantId/clients lo incluye en la respuesta
        El formato de respuesta es idéntico al anterior
```

### CM-02: Datos existentes preservados

```
Given:  La BD tiene registros en clients y vendors
When:   Se ejecuta el script de migración
Then:   Los registros existen como Partners con sus roles correspondientes
        Las FKs en sales_invoices, purchase_orders, etc. siguen siendo válidas
```

### CM-03: Redirect de rutas antiguas

```
Given:  Un usuario visita /inventory/clients
When:   La aplicación está en modo migrado
Then:   Redirige (301) a /partners?role=CUSTOMER
        El listado muestra los mismos datos
```

---

## Criterios de no regresión

### CNR-01: Ventas no afectadas

```
Given:  Una factura apunta a client_id = X
When:   Se migra Client X a Partner con rol CUSTOMER
Then:   La factura sigue siendo recuperable por su client_id
        El detalle de venta sigue funcionando sin cambios
```

### CNR-02: Compras no afectadas

```
Given:  Una orden de compra apunta a vendor_id = Y
When:   Se migra Vendor Y a Partner con rol SUPPLIER
Then:   La orden sigue siendo recuperable por su vendor_id
```

---

## Criterios de performance

### CP-01: Listado paginado

```
Given:  10,000 Partners en BD
When:   GET /partners?page=1&pageSize=50
Then:   Tiempo de respuesta < 500ms
        Retorna 50 resultados
        total = 10,000
```

### CP-02: Búsqueda con índice

```
Given:  10,000 Partners en BD
When:   GET /partners?search=ABC
Then:   Tiempo de respuesta < 200ms
```

---

## Criterios de seguridad

### CS-01: Tenant isolation

```
Given:  Tenant A tiene Partner "ABC S.A."
When:   Tenant B hace GET /partners?search=ABC
Then:   No retorna resultados
```

### CS-02: Permiso de escritura

```
Given:  Usuario sin permiso partners:write
When:   POST /partners
Then:   Retorna 403
```
