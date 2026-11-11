# Business Model

## Modelo

SaaS multi-tenant con suscripción por plan.

## Unidad económica

Una "empresa" (tenant) suscrita a un plan mensual o anual.

## Canales de adquisición

1. **Directo** — landing page, prueba gratuita, conversión a plan pago
2. **Referidos** — contadores y consultores que recomienden la plataforma a sus clientes
3. **Partner** — empresas de software que revendan Atrio white-label (fase posterior)

## Estructura de costos

| Concepto | Estrategia |
|----------|-----------|
| Infraestructura | PostgreSQL + Redis por tenant cluster. Auto-scaling en cloud (AWS/DO). |
| Desarrollo | Equipo interno. Código único para todos los clientes y países. |
| Soport e | Email para Free/Starter, prioritario para Professional, 24/7 para Enterprise. |
| Ventas | Autoservicio para planes bajos, fuerza comercial para Enterprise. |

## Estrategia de crecimiento

1. **Free** como embudo de adquisición — sin tarjeta de crédito, sin límite de tiempo, con límites funcionales.
2. **Starter** como plan de entrada para equipos pequeños.
3. **Professional** como plan principal para la mayoría de clientes.
4. **Enterprise** como plan para clientes grandes con necesidades avanzadas.

## Diferenciación de modelo

A diferencia de ERPs tradicionales que cobran:
- Licencias perpetuas caras
- % de la facturación del cliente
- Consultoría de implementación obligatoria

Atrio cobra:
- Suscripción mensual predecible
- Sin costo de implementación (auto-servicio)
- Sin permanencia mínima
