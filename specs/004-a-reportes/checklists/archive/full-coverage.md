# Full Coverage Checklist: Reportes ERP

**Purpose**: Validate specification completeness and quality before PR review
**Created**: 2026-06-30
**Feature**: [spec.md](../spec.md)
**Audience**: Author (auto-checklist)
**Depth**: Standard

## Requirement Completeness

- [ ] CHK001 - ¿Están definidos los tipos de datos agregados que expone cada endpoint del dashboard? [Completeness, Spec §US1]
- [ ] CHK002 - ¿Está especificado el formato de respuesta para cada endpoint de reporte exportable? [Completeness, Spec §US2-US6]
- [ ] CHK003 - ¿Están definidos los criterios de "umbral configurable" para stock bajo? [Clarity, Spec §US3]
- [ ] CHK004 - ¿Están especificados los reportes X y Z con sus diferencias y cuándo se usa cada uno? [Completeness, Spec §US4]

## Requirement Clarity

- [ ] CHK005 - ¿Está "gráficos simples" definido con tipos concretos (barras, pastel, línea)? [Ambiguity, Spec §US1]
- [ ] CHK006 - ¿Está "comparativa con período anterior" definido con el cálculo exacto (% diferencia, absoluta)? [Clarity, Spec §US2]
- [ ] CHK007 - ¿Está "Clientes con más compras (top N)" definido con el valor por defecto de N? [Clarity, Spec §US5]
- [ ] CHK008 - ¿Está "débito y crédito fiscal" definido con su fórmula de cálculo? [Clarity, Spec §US6]

## Acceptance Criteria Quality

- [ ] CHK009 - ¿Son los criterios de "Dashboard carga en < 2s" medibles con una métrica objetiva? [Measurability, Spec §SC-1]
- [ ] CHK010 - ¿Es "Exportación PDF/Excel/CSV funcional" un criterio verificable sin implementación? [Measurability, Spec §SC-3]
- [ ] CHK011 - ¿Está "Programación con entrega por email funciona correctamente" definido con escenarios de éxito/fallo? [Measurability, Spec §SC-4]

## Scenario Coverage

- [ ] CHK012 - ¿Están definidos los requerimientos para el escenario de dashboard sin datos (primer día del negocio)? [Coverage, Gap]
- [ ] CHK013 - ¿Están definidos los requerimientos para generación concurrente de reportes por el mismo usuario? [Coverage, Gap]
- [ ] CHK014 - ¿Están definidos los requerimientos para reportes multi-módulo (ej: ventas + impuestos combinados)? [Coverage, Gap]

## Edge Case Coverage

- [ ] CHK015 - ¿Está definido el comportamiento cuando MinIO no está disponible? [Edge Case, Gap]
- [ ] CHK016 - ¿Está definido el comportamiento cuando el archivo del report history expiró antes de descargar? [Edge Case, Spec §FR-009]
- [ ] CHK017 - ¿Está definido el filtrado multi-módulo cuando el usuario tiene permiso parcial (solo ventas, no caja)? [Edge Case, Spec §FR-012]

## Non-Functional Requirements

- [ ] CHK018 - ¿Están definidos los límites de concurrencia (máximo de exportaciones simultáneas por tenant)? [NFR, Gap]
- [ ] CHK019 - ¿Están definidos los requerimientos de storage (cuánto espacio en MinIO proyectado)? [NFR, Gap]
- [ ] CHK020 - ¿Están definidos los tiempos de retención de report_history como requerimiento explícito? [NFR, Spec §FR-009]

## Dependencies & Assumptions

- [ ] CHK021 - ¿Está documentada la dependencia de MinIO como requisito del sistema? [Dependency, Spec §FR-007]
- [ ] CHK022 - ¿Está documentada la suposición de que Puppeteer/Chromium estará disponible en el contenedor? [Assumption, Gap]
- [ ] CHK023 - ¿Está documentada la dependencia de Redis Queue para procesamiento en background? [Dependency, Spec §FR-005]
