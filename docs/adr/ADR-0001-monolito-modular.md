# ADR-0001: Monolito Modular

**Estado:** Aceptado
**Fecha:** 2026-07-06
**Contexto:** PR-012, PR-009

## Contexto

Atrio comienza con un equipo pequeño. Necesitamos una arquitectura que:

- Separe el dominio en bounded contexts desde el día uno
- Permita a un equipo pequeño desplegar y operar sin complejidad distribuida
- No impida extraer contextos a servicios independientes en el futuro

Microservicios agregarían complejidad operativa (despliegues, observabilidad, consistencia distribuida, colas, redes, DevOps) sin aportar valor al negocio al inicio.

## Decisión

Usar **Monolito Modular**: los bounded contexts están separados por capas de dominio (Application, Domain, Infrastructure, Presentation) dentro del mismo proceso de aplicación. La comunicación entre contextos usa interfaces de dominio e inyección de dependencias, no llamadas de red.

## Consecuencias

- **Positivas:** despliegue simple, desarrollo rápido, transacciones ACID entre contextos cuando sea necesario, sin sobrecarga operativa
- **Negativas:** el proceso completo escala como una unidad; no se puede escalar un contexto independientemente
- **Mitigación:** si un contexto requiere escalar o desplegarse por separado, se extrae a un servicio. El monito modular bien organizado hace esta migración gradual y controlada

## Referencias

- PR-012: Monolito modular como arquitectura inicial
- PR-009: Los módulos se comunican por eventos
- P-2 Domain Discovery: 010-bounded-contexts.md
