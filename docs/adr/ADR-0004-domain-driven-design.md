# ADR-0004: Domain-Driven Design

**Estado:** Aceptado
**Fecha:** 2026-07-06
**Contexto:** PR-008, PR-009, P-2 Domain Discovery

## Contexto

Atrio maneja dominios complejos (ventas, inventario, contabilidad, nómina) con reglas de negocio que cambian por país y por cliente. Una arquitectura anémica (CRUD puro sin lógica de dominio) llevaría a que las reglas de negocio se filtren a los controladores o servicios, haciendo el sistema imposible de mantener.

## Decisión

Aplicar **Domain-Driven Design (DDD)** con:

- **Bounded Contexts** como delimitadores del dominio
- **Aggregate Roots** para garantizar consistencia transaccional
- **Domain Events** para comunicación entre contextos
- **Lenguaje Ubicuo** dentro de cada contexto
- **Entidades y Value Objects** donde el dominio lo justifique

**Con pragmatismo:** no todo requiere un modelo rico de dominio. Catálogos, configuraciones y maestros básicos pueden tratarse como CRUD siempre que no haya reglas de negocio complejas. Ventas, Compras, Inventario, Nómina, Contabilidad y Localización justifican un modelo rico.

## Consecuencias

- **Positivas:** el código refleja el negocio, no la tecnología; los cambios de reglas de negocio se hacen en el dominio, no en los controladores; los eventos documentan implícitamente lo que ocurre en el sistema
- **Negativas:** curva de aprendizaje del equipo; riesgo de sobrediseño (DDD por moda, no por necesidad)
- **Mitigación:** regla de pragmatismo: "la complejidad de la solución nunca debe superar la complejidad del problema". Se evalúa caso por caso si un contexto justifica modelo rico o CRUD.

## Referencias

- PR-008: Mantenibilidad sobre velocidad
- PR-009: Los módulos se comunican por eventos
- P-2 Domain Discovery completo (010 a 017)
