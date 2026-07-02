# Research: Reportes ERP

## Technology Decisions

### PDF Generation
- **Decision**: Puppeteer (HTML → PDF)
- **Rationale**: Permite diseñar reportes como templates HTML con Tailwind, dándonos control total sobre el diseño sin librerías de bajo nivel. Los reportes se renderizan en un headless Chromium.
- **Alternatives**: PDFKit (programático, más control pero más código), jsPDF (client-side, no sirve para backend)
- **Consideración**: Puppeteer requiere más recursos (Chromium en el contenedor). Para v1 es aceptable; si el peso es problema, migrar a PDFKit después.

### Excel Generation
- **Decision**: ExcelJS
- **Rationale**: Librería más madura para Node.js, soporta XLSX con estilos, fórmulas, múltiples hojas. API clara y bien documentada.
- **Alternatives**: xlsx (SheetJS) — similar, pero ExcelJS tiene mejor API para estilos

### CSV Generation
- **Decision**: CSV nativo (built-in)
- **Rationale**: No requiere librería externa. Generar CSV es trivial con streams de Node.js.

### Template Engine
- **Decision**: Handlebars
- **Rationale**: Para renderizar templates HTML de reportes antes de pasarlos a Puppeteer. Simple, seguro (sin ejecución de código), ya usado en la comunidad NestJS.
- **Alternatives**: EJS (similar), Pug (sintaxis diferente)

### Job Queue
- **Decision**: @nestjs/bull (BullMQ)
- **Rationale**: Ya usamos Redis en el proyecto. BullMQ es el estándar NestJS para colas de trabajo. Integración nativa con `@nestjs/bull`.
- **Alternatives**: Bee-Queue (menos features), agenda (más pesado)

### Object Storage
- **Decision**: MinIO (cliente oficial `minio`)
- **Rationale**: S3-compatible, corre en Docker, separa archivos de la DB, escala horizontalmente. Cliente oficial para Node.js.
- **Alternativas**: AWS S3 (producción futura), PostgreSQL BYTEA (anti-patrón), volumen local (no escala)
- **Integración**: Se agrega servicio `minio` al docker-compose.yml

### Real-time Notifications
- **Decision**: Socket.IO (ya existente en el proyecto)
- **Rationale**: El proyecto ya tiene Socket.IO configurado con Redis adapter. Solo extender para emitir eventos de reportes.
- **Gateway**: Mismo gateway existente, nuevo namespace o eventos

### Scheduled Reports
- **Decision**: BullMQ repeatable jobs + cron expressions
- **Rationale**: BullMQ soporta jobs recurrentes vía `repeat` option con cron. No necesitamos un scheduler separado.

## Docker Changes
- Nuevo servicio `minio` en docker-compose.yml
- Variables de entorno para MinIO (endpoint, accessKey, secretKey, bucket)
- Volumen persistente para MinIO
- Opcional: MinIO Console en puerto distinto
