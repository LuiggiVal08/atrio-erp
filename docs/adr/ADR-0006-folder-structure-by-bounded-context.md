# ADR-0006: Estructura de Carpetas por Bounded Context

**Estado:** Aceptado
**Fecha:** 2026-07-06
**Contexto:** PR-008, PR-009

## Contexto

La estructura de carpetas de un proyecto influye directamente en cómo los desarrolladores piensan el sistema. Una estructura por capas técnicas (`controllers/`, `services/`, `repositories/`, `models/`) mezcla bounded contexts y facilita el acoplamiento. Una estructura por bounded context hace explícitos los límites del dominio.

## Decisión

El código se organiza por Bounded Context, no por capas técnicas. Cada contexto tiene su propia estructura interna de Application, Domain, Infrastructure y Presentation.

```
src/
  modules/
    sales/
      application/
        use-cases/
        dto/
        ports/          # interfaces que el dominio necesita de infraestructura
      domain/
        entities/
        value-objects/
        events/
        services/
        repositories/   # interfaces (contratos)
      infrastructure/
        persistence/    # implementación de repositorios
        messaging/      # eventos
        external/       # APIs externas
      presentation/
        controllers/
        validators/
    inventory/
      ...
    purchasing/
      ...
```

## Consecuencias

- **Positivas:** los límites del contexto son explícitos; un desarrollador sabe inmediatamente dónde poner cada cosa; extraer un contexto a un servicio es mover una carpeta
- **Negativas:** más directorios que una estructura plana; requiere disciplina para no crear dependencias entre contextos
- **Mitigación:** se validan las dependencias en CI (reglas de imports prohibidos entre contextos)

## Referencias

- PR-008: Mantenibilidad sobre velocidad
- PR-009: Los módulos se comunican por eventos
- 010-bounded-contexts.md
- 016-ownership-matrix.md
- 004-dependency-rules.md (futuro)
