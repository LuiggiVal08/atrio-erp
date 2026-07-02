# API & Contracts Checklist: Reportes ERP

**Purpose**: Validate API contract quality and completeness
**Created**: 2026-06-30
**Artifact**: [contracts/rest-api.md](../contracts/rest-api.md)

## Endpoint Completeness

- [x] CHK001 - ¿Están definidos todos los endpoints del dashboard con métodos HTTP y paths? [Completeness, contracts/rest-api.md §Dashboard]
- [x] CHK002 - ¿Están definidos todos los endpoints de exportación ad-hoc? [Completeness, contracts/rest-api.md §Reportes]
- [x] CHK003 - ¿Están definidos todos los endpoints de reportes programados (CRUD + execute)? [Completeness, contracts/rest-api.md §Report Definitions]
- [x] CHK004 - ¿Están definidos los WebSocket events con dirección y payload? [Completeness, contracts/rest-api.md §WebSocket Events]

## Request/Response Clarity

- [x] CHK005 - ¿Están definidos los query parameters comunes con tipo y obligatoriedad? [Clarity, contracts/rest-api.md §Query Parameters]
- [x] CHK006 - ¿Hay ejemplos de respuesta para los endpoints principales? [Clarity, contracts/rest-api.md §Response Examples]
- [x] CHK007 - ¿Está definido el formato de error para respuestas fallidas? [Completeness, contracts/rest-api.md §Error Response Format]

## Consistency

- [x] CHK008 - ¿Siguen todos los paths una convención consistente (plural, kebab-case)? [Consistency, contracts/rest-api.md]
- [x] CHK009 - ¿Son consistentes los nombres de eventos WebSocket (prefijo `report.`)? [Consistency, contracts/rest-api.md §WebSocket Events]

## Measurability

- [x] CHK010 - ¿Tiene cada endpoint una descripción clara de qué dato retorna? [Measurability, contracts/rest-api.md]
- [x] CHK011 - ¿Están los filtros definidos con tipos de datos específicos (ISO date, string, enum)? [Measurability, contracts/rest-api.md §Query Parameters]
