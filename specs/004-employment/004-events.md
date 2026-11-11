# Events — Employment

> Eventos de dominio que emite el bounded context Employment.
> Ninguno contiene datos de Localization. Son hechos puros del dominio laboral.
> Todos incluyen `reason` para permitir analítica de RRHH.

---

## employment.relationship.started

```json
{
  "eventId": "evt_abc123",
  "eventType": "employment.relationship.started",
  "source": "employment",
  "version": 1,
  "timestamp": "2026-07-08T10:00:00Z",
  "data": {
    "relationshipId": "uuid",
    "employeeId": "uuid",
    "contractType": "INDEFINITE",
    "baseSalary": 1500.00,
    "currency": "USD",
    "frequency": "MONTHLY",
    "startDate": "2026-07-08",
    "reason": "PROMOTION"
  }
}
```

---

## employment.relationship.terminated

```json
{
  "eventId": "evt_def456",
  "eventType": "employment.relationship.terminated",
  "source": "employment",
  "version": 1,
  "timestamp": "2026-12-31T23:59:00Z",
  "data": {
    "relationshipId": "uuid",
    "employeeId": "uuid",
    "endDate": "2026-12-31",
    "reason": "RESIGNATION",
    "lastSalary": 1500.00,
    "lastCurrency": "USD"
  }
}
```

---

## employment.contract.created

```json
{
  "eventId": "evt_ghi789",
  "eventType": "employment.contract.created",
  "source": "employment",
  "version": 1,
  "timestamp": "2026-07-08T10:00:00Z",
  "data": {
    "relationshipId": "uuid",
    "contractId": "uuid",
    "contractType": "INDEFINITE",
    "currency": "USD",
    "startDate": "2026-07-08"
  }
}
```

---

## employment.contract.amended

```json
{
  "eventId": "evt_jkl012",
  "eventType": "employment.contract.amended",
  "source": "employment",
  "version": 1,
  "timestamp": "2027-01-01T08:00:00Z",
  "data": {
    "relationshipId": "uuid",
    "previousContractId": "uuid",
    "newContractId": "uuid",
    "reason": "TRANSFER",
    "changes": {
      "contractType": { "from": "FIXED_TERM", "to": "INDEFINITE" }
    }
  }
}
```

---

## employment.compensation.changed

```json
{
  "eventId": "evt_mno345",
  "eventType": "employment.compensation.changed",
  "source": "employment",
  "version": 1,
  "timestamp": "2026-07-01T08:00:00Z",
  "data": {
    "relationshipId": "uuid",
    "previousAmount": 1000.00,
    "newAmount": 1500.00,
    "currency": "USD",
    "frequency": "MONTHLY",
    "effectiveDate": "2026-07-01",
    "reason": "MERIT_INCREASE"
  }
}
```

---

## employment.schedule.changed

```json
{
  "eventId": "evt_pqr678",
  "eventType": "employment.schedule.changed",
  "source": "employment",
  "version": 1,
  "timestamp": "2026-08-01T08:00:00Z",
  "data": {
    "relationshipId": "uuid",
    "previousSchedule": { "monday": { "start": "08:00", "end": "17:00" } },
    "newSchedule": { "monday": { "start": "09:00", "end": "18:00" } },
    "effectiveDate": "2026-08-01",
    "reason": "SCHEDULE_REVIEW"
  }
}
```

---

## employment.relationship.suspended

```json
{
  "eventId": "evt_stu901",
  "eventType": "employment.relationship.suspended",
  "source": "employment",
  "version": 1,
  "timestamp": "2026-09-01T08:00:00Z",
  "data": {
    "relationshipId": "uuid",
    "employeeId": "uuid",
    "reason": "MEDICAL_LEAVE"
  }
}
```

---

## employment.relationship.reactivated

```json
{
  "eventId": "evt_vwx234",
  "eventType": "employment.relationship.reactivated",
  "source": "employment",
  "version": 1,
  "timestamp": "2026-10-01T08:00:00Z",
  "data": {
    "relationshipId": "uuid",
    "employeeId": "uuid",
    "reason": "MEDICAL_LEAVE_ENDED"
  }
}
```

---

## Mapa de consumidores

| Evento | Consumidor esperado | Propósito |
|--------|-------------------|-----------|
| `employment.relationship.started` | Localization | Crear registro fiscal |
| `employment.relationship.started` | Workforce | Preparar calendario de asistencia |
| `employment.relationship.terminated` | Localization | Disparar cálculo de liquidación |
| `employment.relationship.terminated` | Payroll | Cerrar período activo |
| `employment.compensation.changed` | Localization | Actualizar base de cálculo |
| `employment.compensation.changed` | Payroll | Recalcular nómina si aplica |
| `employment.schedule.changed` | Workforce | Actualizar reglas de asistencia |
| `employment.relationship.suspended` | Payroll | Pausar pagos |
| `employment.relationship.reactivated` | Payroll | Reanudar pagos |
