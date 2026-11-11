# API Contract — Employment

> Contrato de API REST para el bounded context Employment.
> Endpoints scoped por tenant, siguiendo las convenciones del resto de Atrio.

---

## Employment Relationships

### POST /tenants/:tenantId/employment-relationships

Iniciar relación laboral con contrato, compensación y horario iniciales.

```json
{
  "employeeId": "uuid",
  "contractType": "INDEFINITE",
  "currency": "USD",
  "baseSalary": 1500.00,
  "frequency": "MONTHLY",
  "schedule": {
    "monday": { "start": "08:00", "end": "17:00" },
    "tuesday": { "start": "08:00", "end": "17:00" },
    "wednesday": { "start": "08:00", "end": "17:00" },
    "thursday": { "start": "08:00", "end": "17:00" },
    "friday": { "start": "08:00", "end": "17:00" }
  },
  "startDate": "2026-07-08",
  "reason": "NEW_HIRE"
}
```

Response: `201 Created` + EmploymentRelationship aggregate

### GET /tenants/:tenantId/employment-relationships

Listar relaciones laborales.

Query params: `?employeeId=uuid&status=ACTIVE&page=1&perPage=20`

### GET /employment-relationships/:id

Obtener aggregate completo (incluye contrato vigente, compensación vigente,
horario vigente, historial de cambios, position assignments).

### POST /employment-relationships/:id/terminate

Terminar relación laboral (acción explícita, no PATCH).

```json
{
  "endDate": "2026-12-31",
  "reason": "RESIGNATION"
}
```

### POST /employment-relationships/:id/suspend

Suspender relación laboral.

```json
{
  "reason": "MEDICAL_LEAVE"
}
```

### POST /employment-relationships/:id/reactivate

Reactivar relación laboral suspendida.

```json
{
  "reason": "MEDICAL_LEAVE_ENDED"
}
```

---

## Contracts

### GET /employment-relationships/:relationshipId/contracts

Historial de contratos.

### POST /employment-relationships/:relationshipId/contracts

Crear nuevo contrato (cierra el anterior automáticamente).

```json
{
  "contractType": "INDEFINITE",
  "currency": "USD",
  "startDate": "2027-01-01",
  "reason": "TRANSFER"
}
```

---

## Compensation

### GET /employment-relationships/:relationshipId/compensation

Historial completo de acuerdos compensatorios.

### POST /employment-relationships/:relationshipId/compensation

Registrar nuevo acuerdo compensatorio.

```json
{
  "baseSalary": 1800.00,
  "currency": "USD",
  "frequency": "MONTHLY",
  "effectiveDate": "2027-01-01",
  "reason": "MERIT_INCREASE"
}
```

---

## Schedule

### GET /employment-relationships/:relationshipId/schedule-history

Historial de asignaciones de horario.

### POST /employment-relationships/:relationshipId/schedule

Registrar cambio de horario.

```json
{
  "schedule": {
    "monday": { "start": "09:00", "end": "18:00" }
  },
  "effectiveDate": "2027-01-01",
  "reason": "SCHEDULE_REVIEW"
}
```

---

## History

### GET /employment-relationships/:id/changes

Historial de cambios (EmploymentChange log).

---

## Modelo de datos (resumen API)

```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "status": "ACTIVE",
  "startDate": "2026-07-08",
  "endDate": null,
  "currentContract": { ... },
  "currentCompensation": { ... },
  "currentSchedule": { ... },
  "currentAssignment": { ... },
  "changes": [
    {
      "changeType": "COMPENSATION_CHANGED",
      "reason": "MERIT_INCREASE",
      "previousValue": { "baseSalary": 1000 },
      "newValue": { "baseSalary": 1500 },
      "changedBy": "user_uuid",
      "createdAt": "2026-07-01T08:00:00Z"
    }
  ]
}
```
