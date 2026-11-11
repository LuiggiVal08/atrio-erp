# Non-Functional Requirements

## Rendimiento (Performance)

| ID | Requisito | Objetivo |
|----|-----------|----------|
| NFR-001 | Tiempo de carga de página (dashboard) | < 2s en conexión promedio LATAM |
| NFR-002 | Tiempo de respuesta API (p95) | < 300ms para operaciones CRUD |
| NFR-003 | Tiempo de respuesta API (p99) | < 1s (excluyendo reportes pesados) |
| NFR-004 | Sincronización POS-offline | Procesamiento diferido con < 5s de latencia al reconectar |
| NFR-005 | Reportes pesados | Async. El usuario recibe notificación cuando esté listo |

## Disponibilidad

| ID | Requisito | Objetivo |
|----|-----------|----------|
| NFR-010 | Uptime mensual | > 99.5% (excluyendo mantenimiento programado) |
| NFR-011 | Ventana de mantenimiento | Máximo 4h/mes, en horario no laboral (domingo 2-6 AM hora local cliente) |
| NFR-012 | Recuperación ante desastre | RTO < 4h, RPO < 15min |

## Seguridad

| ID | Requisito |
|----|-----------|
| NFR-020 | Todo el tráfico debe ir por HTTPS (TLS 1.3) |
| NFR-021 | Contraseñas hasheadas con bcrypt (factor de costo ≥ 10) |
| NFR-022 | JWT con expiración ≤ 24h, refresh tokens rotativos |
| NFR-023 | Rate limiting por endpoint y por tenant |
| NFR-024 | Auditoría de acceso a datos sensibles |
| NFR-025 | Aislamiento total entre tenants (no basta con `WHERE tenant_id = ?`) |
| NFR-026 | Headers de seguridad (CSP, HSTS, X-Frame-Options, etc.) |

## Escalabilidad

| ID | Requisito |
|----|-----------|
| NFR-030 | Soporte para 100+ tenants activos en una sola instancia |
| NFR-031 | Capacidad de escalar horizontalmente (API stateless) |
| NFR-032 | Base de datos: hasta 1M de transacciones mensuales por tenant sin degradación |
| NFR-033 | Almacenamiento de archivos: S3-compatible (no sistema de archivos local) |

## Mantenibilidad

| ID | Requisito |
|----|-----------|
| NFR-040 | Cobertura de pruebas unitarias > 80% |
| NFR-041 | Cobertura de pruebas E2E > 60% para módulos core |
| NFR-042 | TypeScript estricto en toda la base de código |
| NFR-043 | Documentación técnica en el código (JSDoc para APIs y entidades de dominio complejas) |
| NFR-044 | Sin dependencias de bibliotecas sin mantenimiento activo |

## Multi-idioma

| ID | Requisito |
|----|-----------|
| NFR-050 | Toda la UI debe ser traducible mediante archivos i18n |
| NFR-051 | El contenido generado (reportes, facturas) debe soportar el idioma del tenant |
| NFR-052 | Landing page debe soportar ES y EN desde el día uno |

## Data & Compliance

| ID | Requisito |
|----|-----------|
| NFR-060 | Backups automáticos diarios con retención de 30 días |
| NFR-061 | Cumplimiento con leyes de protección de datos locales (LOPDP Venezuela, Ley 1581 Colombia) |
| NFR-062 | Derecho al olvido: exportar y eliminar todos los datos de un cliente a solicitud |
| NFR-063 | Logs de acceso y operaciones retenidos por mínimo 2 años |

## Compatibilidad

| ID | Requisito |
|----|-----------|
| NFR-070 | Chrome, Firefox, Edge, Safari (últimas 2 versiones) |
| NFR-071 | Resoluciones: 1024x768 mínimo. Diseñar para 1366x768+ |
| NFR-072 | Sin dependencia de JavaScript deshabilitado en frontend |
