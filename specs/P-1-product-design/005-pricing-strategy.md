# Pricing Strategy

> **⚠️ PRELIMINARY** — Sujeto a validación con clientes reales.

## Estructura de planes

| Plan | Público | Módulos | Límites | Precio estimado |
|------|---------|---------|---------|-----------------|
| **Free** | Microemprendedores, pruebas | Ventas, Clientes, Productos, Caja básica, Inventario básico | 1 empresa, 3-5 usuarios, 1 almacén | Gratis |
| **Starter** | PYMES pequeñas | Todo Free + Compras, Reportes básicos | 1 empresa, usuarios ilimitados, 3 almacenes | 29–49/mes |
| **Professional** | PYMES en crecimiento | Todo Starter + Caja completo, Localización fiscal, Comisiones, API, RRHH básico | 1 empresa, usuarios ilimitados, almacenes ilimitados | 79–149/mes |
| **Enterprise** | Empresas consolidadas | Todo Professional + Multi-tenant, Nómina, SLA, On-premise opcional, Gerente de cuenta | Multi-empresa, usuarios ilimitados | A medida (300–500+/mes) |

## Principios de pricing

1. **No cobrar por módulo individual** — los planes incluyen conjuntos de módulos. Módulos muy especializados pueden ser complementos.
2. **Precio basado en capacidad, no en transacciones** — costo predecible para el cliente.
3. **Free es embudo, no producto** — suficientemente útil para probar y usar en micro-negocios, suficientemente limitado para motivar la actualización.
4. **Descuento anual** — 2 meses gratis en suscripción anual.

## Divisa

Los precios de lista se definen en USD, pero el sistema debe soportar facturación en cualquier divisa según la moneda funcional del tenant (USD, EUR, COP, VES, MXN, etc.). La estrategia por país determina la divisa de cobro:

- Venezuela: precio referenciado a tasa BCV
- Colombia: precio fijo en COP
- Resto LATAM: precio en USD
- Empresas internacionales: EUR, USD, u otra según acuerdo

## Lo que NO haremos

- Precios basados en % de facturación del cliente
- Contratos de permanencia mínima
- Costos ocultos de implementación
- Licencias perpetuas
