# MVP Definition

> Qué incluye y qué NO incluye la primera versión comercializable de Atrio.

---

## MVP: Core Operativo (P1)

El MVP no es el producto completo. Es el primer ciclo que un cliente real puede usar para operar su negocio.

### Incluye

| Capacidad | Mínimo | Detalle |
|-----------|--------|---------|
| Catálogo | CRUD de productos + categorías + precios | Sin variantes, sin listas de precios múltiples |
| Clientes | CRUD de clientes + contactos básicos | Sin segmentos, sin historial |
| Ventas | Confirmar venta + factura básica | Sin cotizaciones, sin notas de crédito V1 |
| Caja | Apertura/cierre + cobro en efectivo | Sin arqueo, sin múltiples medios de pago V1 |
| Inventario | 1 almacén, movimiento entrada/salida | Sin transferencias, sin lotes, sin series |
| Auth | Login con email + JWT + refresh | Sin SSO, sin 2FA |
| Multi-tenant | Crear empresa + slug + UserAccess | Sin switch de tenant en frontend V1 |
| Auditoría | Log de eventos de dominio | Sin UI de auditoría (solo DB) |
| Localización V1 | IVA + IGTF Venezuela | Sin retenciones, sin facturación electrónica |

### NO incluye (MVP)

- Compras (P2)
- RRHH (P3)
- Nómina (P3)
- Contabilidad (P2)
- Reportes avanzados (P2)
- Campos personalizados (P1.5)
- Workflows (P2+)
- API pública (P4)
- Múltiples monedas (P2)
- Múltiples almacenes (P2)
- Lotes y series (P2)
- Integraciones externas (P4)

---

## Criterios de salida del MVP

- [ ] 3 flujos verticales completos probados (crear producto → vender → cobrar)
- [ ] Cobertura de tests > 80%
- [ ] Sin dependencias de servicios externos (todo corre local o en Docker)
- [ ] Despliegue automatizado (CI/CD)
- [ ] Documentación de API para los endpoints del MVP
- [ ] Un cliente no-técnico puede completar el flujo sin asistencia

---

## Post-MVP (P1.5 - P2)

Lo que se agrega inmediatamente después del MVP:

- Compras + proveedores
- Notas de crédito/débito
- Arqueo de caja
- Múltiples medios de pago
- Reportes básicos
- Contabilidad (plan de cuentas + asientos automáticos)
