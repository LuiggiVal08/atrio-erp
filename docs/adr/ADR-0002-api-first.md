# ADR-0002: API First

**Estado:** Aceptado
**Fecha:** 2026-07-06
**Contexto:** PR-006

## Contexto

Toda funcionalidad del frontend debe estar disponible mediante API. Sin embargo, exponer una API pública prematuramente crea contratos difíciles de cambiar mientras el producto madura.

## Decisión

**API First desde el día uno pero API pública en fases posteriores.**

- Toda operación del sistema se expone como API interna (REST/JSON) dentro del monolito
- El frontend consume estas APIs — nunca accede a la capa de dominio directamente
- La API pública para terceros se documenta y versiona cuando el producto sea estable

## Consecuencias

- **Positivas:** la interfaz API está diseñada antes que la UI; el frontend es un cliente más; la API pública futura será natural, no forzada
- **Negativas:** overhead inicial de mantener endpoints aunque algunos solo los consuma el frontend
- **Mitigación:** los endpoints internos no necesitan versionado ni documentación pública; se estabilizan antes de exponerse externamente

## Referencias

- PR-006: API First
- PR-008: Mantenibilidad sobre velocidad
