# User Stories & UX Checklist: Reportes ERP

**Purpose**: Validate user stories completeness and acceptance criteria quality
**Created**: 2026-06-30
**Artifact**: [spec.md](../spec.md)

## User Story Completeness

- [x] CHK001 - ¿Están definidas todas las user stories principales (dashboard, ventas, inventario, caja, clientes, impuestos, programación)? [Completeness, spec.md §User Stories]
- [x] CHK002 - ¿Sigue cada user story el formato "Como... Quiero... Para..."? [Completeness, spec.md §User Stories]

## Acceptance Criteria Quality

- [x] CHK003 - ¿Tiene cada US criterios de aceptación específicos y verificables? [Measurability, spec.md §User Stories]
- [x] CHK004 - ¿Están los formatos de exportación especificados en cada US que requiere exportación? [Clarity, spec.md §US2-US6]
- [x] CHK005 - ¿Están los filtros disponibles especificados para cada tipo de reporte? [Clarity, spec.md §US2-US6]

## Scenario Coverage

- [x] CHK006 - ¿Cubre US1 los indicadores clave del dashboard ejecutivo? [Coverage, spec.md §US1]
- [x] CHK007 - ¿Cubre US7 el ciclo completo (crear, ejecutar, recibir) de reportes programados? [Coverage, spec.md §US7]

## Edge Cases

- [x] CHK008 - ¿Están definidos los edge cases (datos vacíos, períodos largos, archivos grandes, timeouts)? [Coverage, spec.md §Edge Cases]
- [x] CHK009 - ¿Está definido el out of scope para v1? [Clarity, spec.md §Out of Scope]

## Functional Requirements Coverage

- [x] CHK010 - ¿Están los FR alineados con las user stories (cada US tiene FR que la soportan)? [Consistency, spec.md §Functional Requirements]
- [x] CHK011 - ¿Están cubiertos los aspectos multi-tenant y RBAC en los FR? [Coverage, spec.md §FR-011, FR-012]
