# Risks

## Riesgos técnicos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|-------------|---------|------------|
| RT-01 | Multi-moneda: la lógica de conversión, redondeo y asientos contables en múltiples divisas es extremadamente compleja | Alta | Alto | Dedicar un sprint completo de diseño antes de implementar. Revisar cómo lo resuelven Odoo y ERPs establecidos. No asumir que "es solo multiplicar por tasa". |
| RT-02 | Acoplamiento entre módulos: a medida que crecen los módulos, aumentan las dependencias implícitas | Media | Alto | PR-009 (comunicación por eventos, no por dependencia directa). Event Storming para definir contratos. |
| RT-03 | Performance con multiple moneda + localización: aplicar reglas fiscales por país sobre cada transacción puede degradar el rendimiento | Media | Medio | Motor de localización desacoplado, cacheable, ejecución asíncrona donde sea posible. |
| RT-04 | Migración de esquema en multi-tenant: cientos de bases de datos que migrar simultáneamente | Media | Medio | Migraciones versionadas con scripts de rollback. Pruebas automatizadas en base de datos de prueba multi-tenant. |

## Riesgos comerciales

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|-------------|---------|------------|
| RC-01 | Competidores establecidos (Alegra, Siigo, Odoo) tienen años de ventaja en funcionalidades y marca | Alta | Alto | Competir en segmento desatendido (alta densidad, localización real, precio accesible). No intentar igualar funcionalidades, superar en experiencia. |
| RC-02 | El mercado PYME latinoamericano tiene alta tasa de mortalidad de negocios | Alta | Medio | Modelo sin permanencia minimiza barrera de entrada. Clientes que crecen actualizan de plan. |
| RC-03 | Dificultad para alcanzar el volumen de clientes necesario para ser rentable | Media | Alto | Free plan como embudo de adquisición. Estrategia de canales (contadores, consultores). |
| RC-04 | Resistencia al cambio: dueños de PYME acostumbrados a Excel o sistemas legacy | Alta | Medio | Período de prueba gratuito sin tarjeta. Migración asistida. UX que demuestre valor en días, no meses. |

## Riesgos legales y regulatorios

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|-------------|---------|------------|
| RL-01 | Cambios tributarios imprevistos en países objetivo (ej: nueva tasa de IVA, nuevo impuesto) | Alta | Alto | Localization Engine diseñado para actualizarse sin modificar el core. Tener un proceso para desplegar actualizaciones de localización en días, no meses. |
| RL-02 | Requisitos de facturación electrónica diferentes en cada país (DIAN, CFDI, etc.) | Alta | Alto | Localización como capa abstraída. Aliados locales por país para certificación. |
| RL-03 | Protección de datos personales (LOPDP Venezuela, Ley 1581 Colombia, LGPD Brasil) | Media | Alto | Arquitectura que soporte exportación y eliminación de datos por tenant. Asesoría legal en cada país antes de lanzar. |
| RL-04 | Cambios en el tratamiento de las criptomonedas como método de pago en Venezuela | Media | Bajo | El core debe tratar las criptomonedas como un medio de pago más, sin lógica específica. |

## Riesgos financieros

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|-------------|---------|------------|
| RF-01 | Período prolongado sin ingresos mientras se desarrolla el producto | Alta | Alto | Roadmap prioriza módulos comercializables desde P-1. Plan Free como prueba gratuita para generar tracción temprana. |
| RF-02 | Fluctuación cambiaria en países con alta inflación (Venezuela) | Alta | Medio | Precios referenciados a tasa de cambio oficial con actualización periódica. Contratos en USD o EUR con pago en moneda local. |
| RF-03 | Costos de infraestructura crecen más rápido que los ingresos | Media | Medio | Multi-tenant comparte infraestructura. Optimización de consultas. Uso eficiente de recursos. |

## Riesgos de producto

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|-------------|---------|------------|
| RP-01 | Agregar demasiados módulos demasiado pronto, diluyendo el foco | Alta | Alto | Roadmap estricto. No pasar a la siguiente fase sin cumplir los criterios de salida (MRR). |
| RP-02 | Construir funcionalidades que los clientes no quieren | Alta | Alto | Validación temprana con clientes reales antes de desarrollar. Entrevistas, prototipos, beta. |
| RP-03 | Prometer multi-país y no cumplir bien en ninguno | Media | Alto | Un país a la vez. Venezuela V1, Colombia V2. No abrir nuevo país hasta que el anterior esté sólido. |
| RP-04 | La plataforma crece pero la UX no escala — demasiadas opciones, demasiada complejidad | Media | Medio | Principio de alta densidad (PR-010). Diseño centrado en roles, no en funciones. No esconder funcionalidad, pero tampoco mostrarla toda a la vez. |

## Riesgos de equipo y ejecución

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
|----|--------|-------------|---------|------------|
| RE-01 | Dependencia de una sola persona para áreas críticas del conocimiento | Alta | Alto | Documentación, pair programming, code review obligatorio. Nadie es indispensable. |
| RE-02 | Burnout del equipo por ambición del proyecto | Media | Alto | Roadmap realista. Entregas incrementales. Celebrar hitos. |
