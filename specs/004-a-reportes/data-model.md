# Data Model: Reportes ERP

## Nuevos Modelos Prisma

```prisma
enum ReportType {
  SALES
  INVENTORY
  CASH
  CLIENTS
  TAXES
  PROFIT
}

enum ReportFormat {
  PDF
  XLSX
  CSV
}

enum ReportExecutionStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

/// Definición de reporte (predefinido o personalizado)
model ReportDefinition {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  description String?
  type        ReportType
  config      Json?    // Filtros predeterminados, columnas visibles, agrupaciones
  format      ReportFormat @default(PDF)
  schedule    String?  // Cron expression (null = manual only)
  recipients  String[] // Email addresses for scheduled delivery
  enabled     Boolean  @default(true)
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  executions  ReportExecution[]
  createdBy   User @relation(fields: [createdById], references: [id])

  @@index([tenantId])
  @@map("report_definitions")
}

/// Ejecución individual de un reporte programado
model ReportExecution {
  id               String   @id @default(cuid())
  reportDefinitionId String
  tenantId         String
  requestedById    String
  status           ReportExecutionStatus @default(PENDING)
  taskId           String?  // BullMQ job ID
  startedAt        DateTime?
  completedAt      DateTime?
  minioBucket      String?
  minioKey         String?
  fileSize         Int?
  errorMessage     String?
  createdAt        DateTime @default(now())

  reportDefinition ReportDefinition @relation(fields: [reportDefinitionId], references: [id])
  requestedBy      User @relation(fields: [requestedById], references: [id])

  @@index([tenantId, status])
  @@index([reportDefinitionId])
  @@map("report_executions")
}

/// Historial de reportes ad-hoc (exportaciones manuales)
model ReportHistory {
  id            String   @id @default(cuid())
  tenantId      String
  requestedById String
  reportType    ReportType
  format        ReportFormat
  filters       Json?    // Filtros usados en la generación
  minioBucket   String
  minioKey      String
  fileSize      Int?
  status        ReportExecutionStatus @default(COMPLETED)
  createdAt     DateTime @default(now())
  expiresAt     DateTime // createdAt + 48h

  requestedBy   User @relation(fields: [requestedById], references: [id])

  @@index([tenantId, expiresAt])
  @@map("report_history")
}

/// Widgets del dashboard (configuración por usuario/tenant)
model DashboardWidget {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String
  type        String   // kpi, bar_chart, pie_chart, table, trend
  config      Json     // { metric, period, comparison, filters }
  positionX   Int      @default(0)
  positionY   Int      @default(0)
  width       Int      @default(2)
  height      Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User @relation(fields: [userId], references: [id])

  @@index([tenantId, userId])
  @@map("dashboard_widgets")
}
```

## Resumen de Cambios en Schema

| Modelo | Archivo | Acción |
|--------|---------|--------|
| ReportDefinition | schema.prisma | NUEVO |
| ReportExecution | schema.prisma | NUEVO |
| ReportHistory | schema.prisma | NUEVO |
| DashboardWidget | schema.prisma | NUEVO |

## Enum Types a agregar

- `ReportType`: SALES, INVENTORY, CASH, CLIENTS, TAXES, PROFIT
- `ReportFormat`: PDF, XLSX, CSV
- `ReportExecutionStatus`: PENDING, PROCESSING, COMPLETED, FAILED
