# ADR-0003: Localization Engine como Bounded Context

**Estado:** Aceptado
**Fecha:** 2026-07-06
**Contexto:** PR-001

## Contexto

Una de las principales ventajas competitivas de Atrio es la localización multi-país. La mayoría de ERPs manejan diferencias por país con condicionales en el código (`if country == "VE"`), lo que vuelve el código frágil, difícil de probar y casi imposible de escalar a nuevos países.

## Decisión

Toda la lógica fiscal, laboral y contable que varíe por país vive en el Bounded Context **Localization** (BC-10). El core del sistema nunca contiene reglas específicas de ningún país.

Localization:
- Expone reglas que otros contextos consultan (tasas de IVA, retenciones, cálculos de nómina, plan de cuentas local)
- No contiene datos transaccionales (no sabe cuánto se vendió, ni a quién)
- Se actualiza independientemente del core (nuevas tasas, nuevos impuestos)

## Consecuencias

- **Positivas:** un solo código base sirve a Venezuela, Colombia y más países; los cambios regulatorios no requieren modificar el core; agregar un nuevo país es agregar configuración + reglas, no código nuevo en el núcleo
- **Negativas:** requiere diseño cuidadoso de la interfaz entre Localization y los contextos consumidores; algunas reglas son complejas de abstraer (ej: facturación electrónica con la DIAN)
- **Mitigación:** se resuelve país por país. Venezuela V1, Colombia V2. Cada nueva localización se integra y prueba antes de abrir el siguiente país.

## Referencias

- PR-001: El core nunca contiene legislación
- BC-10: Localization (010-bounded-contexts.md)
