# UI Navigation — Business Partners

> Estructura de navegación, layout y flujos de usuario del módulo.
> Un solo punto de entrada en el sidebar, filtros por rol como pestañas.

---

## Sidebar

```text
Business Partners  [icon: Users / Briefcase]
├── Todos          → /partners
├── Clientes       → /partners?role=CUSTOMER
├── Proveedores    → /partners?role=SUPPLIER
├── Prospectos     → /partners?role=PROSPECT
```

- Los ítems anidados son filtros rápidos, no submódulos
- El icono del módulo principal es `Briefcase` de lucide-react
- Permiso requerido: `partners:read`

---

## Árbol de rutas

```text
/partners
├── /                     → PartnerListView (lista con filtros)
├── /new                  → PartnerFormView (create)
├── /:id                  → PartnerDetailView (detalle con solapas)
├── /:id/edit             → PartnerFormView (edit)
└── /:id/contacts/new     → (modal inline en DetailView)
```

---

## PartnerListView

```
┌──────────────────────────────────────────────────────────────┐
│  Business Partners                    [+ Crear Partner]      │
│  ┌─────────┬──────────┬──────────┬──────────┐               │
│  │  Todos  │ Clientes │ Proveed. │ Prospec. │  [Buscar...]  │
│  └─────────┴──────────┴──────────┴──────────┘               │
├──────────────────────────────────────────────────────────────┤
│  Avatar  │ Nombre         │ Rol          │ Estado  │ Tags  │
│  ────────┼────────────────┼──────────────┼─────────┼───────┤
│  [AB]    │ ABC S.A.       │ Cliente, Prov│ Activo  │ VIP   │
│  [CD]    │ Comercial XYZ  │ Cliente      │ Activo  │ —     │
│  [EF]    │ Dist. del Sur  │ Proveedor    │ Inact.  │ —     │
└──────────────────────────────────────────────────────────────┘
```

### Comportamiento

- **Tabs de filtro**: cambian `?role=` en la URL. La pestaña activa se refleja en el sidebar
- **Búsqueda**: filtra por `legalName`, `commercialName`, `taxIdValue`
- **Tags**: cada tag es un badge de color (generado por hash del texto)
- **Cliente/Proveedor**: si tiene ambos roles, muestra ambos badges
- **Click en fila**: navega a `/partners/:id`

---

## PartnerDetailView

```
┌──────────────────────────────────────────────────────────────┐
│  ← Business Partners  /  ABC S.A.           [Editar] [···]  │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────┬───────────┬──────────────┬──────────────────┐  │
│  │ General │ Contactos │ Direcciones  │ Historial Comerc.│  │
│  └─────────┴───────────┴──────────────┴──────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  (Contenido de la solapa activa)                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Solapa General

```text
Tipo:           Compañía
RIF:            J-12345678-0
Nombre Fiscal:  ABC S.A.
Nombre Comercial: ABC Distribuciones
Sitio Web:      abc.com.ve
Estado:         Activo
Etiquetas:      [VIP] [Mayorista] [Internacional]
Roles:          [Cliente] [Proveedor]
Creado:         15 Ene 2026 por admin@demo.com
Actualizado:    20 Mar 2026
```

### Solapa Contactos

```text
[+ Agregar Contacto]

Nombre           | Cargo       | Email                | Teléfono
─────────────────┼─────────────┼──────────────────────┼────────────
* Juan Pérez     | Gerente     | juan@abc.com         | +58 414...
  María García   | Contadora   | maria@abc.com        | +58 416...
```

- El contacto primario tiene icono de estrella
- Click en contacto abre edición inline o modal

### Solapa Direcciones

```text
[+ Agregar Dirección]

Tipo     | Dirección                     | Ciudad    | Principal
─────────┼───────────────────────────────┼───────────┼─────────
Fiscal   | Av. Principal, Edif. 123     | Caracas   | ✓
Despacho | Calle 2, Galpón Industrial    | Valencia  |
```

### Solapa Historial Comercial

```text
(solo lectura — consulta delegada a Ventas / Compras / Finanzas)

Resumen:
  Total facturado:    $ 1,234,567 USD
  Total comprado:     $ 234,567 USD
  Saldo pendiente:    $ 12,345 USD
  Límite de crédito:  $ 50,000 USD

Últimas facturas:
  FAC-00123 | 15 Mar 2026 | $ 5,000 | Pendiente
  FAC-00122 | 10 Mar 2026 | $ 3,500 | Pagada

Últimas compras:
  OC-00045  | 20 Feb 2026 | $ 2,000 | Recibida
```

---

## PartnerFormView

```
┌──────────────────────────────────────────────────────────────┐
│  ← Business Partners  /  [Crear|Editar] Partner  [Cancelar] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tipo:           [Persona ▼]  [Compañía]                     │
│  Razón Social:   [___________________________]               │
│  RIF / NIT:      [VE ▼] [RIF ▼] [J-________________]        │
│  Nombre Com.:    [___________________________]               │
│  Sitio Web:      [___________________________]               │
│                                                              │
│  Roles:          ☑ Cliente  ☑ Proveedor  ☐ Prospecto        │
│                                                              │
│  Estado:         [● Activo]  [○ Inactivo]                    │
│                                                              │
│  Etiquetas:      [VIP, Mayorista]  [Agregar etiqueta...]     │
│                                                              │
│  ─── Contactos ─────────────────────────────────────────     │
│  [+ Agregar]                                                  │
│  (lista de contactos inline)                                  │
│                                                              │
│  ─── Direcciones ────────────────────────────────────────     │
│  [+ Agregar]                                                  │
│  (lista de direcciones inline)                                │
│                                                              │
│  ────────────────────────────────────────────────────────     │
│                                          [Guardar]           │
└──────────────────────────────────────────────────────────────┘
```

- Los contactos y direcciones se manejan inline (no modales separados)
- El formulario es una sola página, no wizard
- Los tags se escriben con autocomplete (sugiere tags existentes del tenant)

---

## Compatibilidad de rutas antiguas

```text
/inventory/clients      → 301 → /partners?role=CUSTOMER
/inventory/vendors      → 301 → /partners?role=SUPPLIER
/inventory/clients/:id  → 301 → /partners/:id
/inventory/vendors/:id  → 301 → /partners/:id
```

- Los redirects se implementan en `AppRoutes.tsx` usando `<Navigate>` condicional
- Se mantienen durante al menos un sprint después de la migración frontend
