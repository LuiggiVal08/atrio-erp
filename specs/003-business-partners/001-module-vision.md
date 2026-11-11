# Module Vision — Business Partners

> Gestión unificada de terceros con los que la empresa mantiene una relación
> comercial, financiera u operativa. Un solo modelo para clientes, proveedores,
> prospectos, distribuidores y transportistas.

---

## Por qué existe este módulo

Históricamente Atrio modeló `Client` y `Vendor` como entidades separadas en Prisma,
con endpoints, hooks y vistas duplicados. Esta separación refleja una visión
departamental (ventas vs compras), no una visión de dominio. En la práctica:

- Un mismo tercero puede ser cliente y proveedor simultáneamente
- Los datos base (nombre, dirección, contacto) son idénticos entre roles
- `FichaTerceroView` ya unifica el detalle, evidenciando que el modelo
  subyacente debería ser único

Business Partners formaliza la abstracción que el código ya está pidiendo.

---

## Alcance

### Incluido (V1)

- **Partner**: representación única de una persona o empresa
- **Roles**: asignación múltiple simultánea (Customer, Supplier, Prospect, etc.)
- **Contactos**: teléfonos, emails, cargos asociados al Partner
- **Direcciones**: fiscal, despacho, principal, con tipo y georreferencia
- **Estado**: activo, inactivo, bloqueado
- **Etiquetas**: clasificación libre (VIP, Moroso, Frecuente, etc.)
- **Timeline de eventos** (solo estructura, sin UI de timeline en V1)
- **Historial comercial**: consulta de solo lectura desde Ventas/Compras/Finanzas

### Excluido explícitamente (No V1)

- Embudos de venta (ODALX CRM futuro)
- Campañas de marketing (ODALX CRM futuro)
- Automatización de marketing
- Email marketing
- Scoring de leads
- Secuencias comerciales
- Pipeline management
- Workflows de aprobación

---

## Principios

1. **Un Partner, muchos roles** — nunca duplicar la entidad por tener varios roles
2. **Los roles son asignables y revocables** — no se elimina el Partner, se quita el rol
3. **El historial es readonly desde este módulo** — los eventos los emiten otros BCs
4. **Las etiquetas son libres, no taxonómicas** — el usuario las crea sin jerarquía forzada
5. **Compatibilidad hacia atrás** — `/clients` y `/vendors` sobreviven como adaptadores hasta EOL planificada

---

## Relación con otros bounded contexts

```text
Ventas                 ────  consulta ────┐
Compras                ────  consulta ────┤
Caja / Finanzas        ────  consulta ────┤
Localización (fiscal)  ────  consulta ────┤
                                          ↓
                                   Business Partners
                                          │
                                ──── emite eventos ────►
                                          │
                                    PartnerCreated
                                    PartnerRoleAssigned
                                    PartnerUpdated
                                    PartnerArchived
```
