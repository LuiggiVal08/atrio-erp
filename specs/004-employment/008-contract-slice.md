# Slice 2 — Contract

## 1. ¿Qué es un Contract?

Un Contract formaliza las condiciones legales de una EmploymentRelationship durante un período determinado. Define tipo de contrato, jornada, duración, y términos jurídicos. No contiene salario, vacaciones, ni schedule.

## 2. ¿Qué NO es?

No contiene:
- Vacaciones, asistencia, nómina, desempeño, promociones
- Solo define condiciones jurídicas

## 3. Invariantes

- **INV-C001**: Una EmploymentRelationship solo puede tener un Contract vigente a la vez
- **INV-C002**: Los contratos nunca se modifican — se reemplazan (append-only)
- **INV-C003**: Todo Contract debe pertenecer a exactamente una EmploymentRelationship
- **INV-C004**: No puede existir un Contract sin EmploymentRelationship
- **INV-C005**: Las fechas de contratos en una misma relación no pueden solaparse

## 4. Eventos

- `contract.created`
- `contract.renewed`
- `contract.terminated`
- `contract.expired`

## 5. Casos de uso

- Create Contract
- Renew Contract
- Terminate Contract
- Find Current Contract
- Find History

## 6. Modelo de datos

Contract es append-only. La renovación crea un nuevo Contract (Modelo A). El salario vive en CompensationAgreement, no en Contract.

```
Contract {
  id: UUID
  relationshipId: UUID → EmploymentRelationship
  contractType: ContractType (FULL_TIME, PART_TIME, FIXED_TERM, TEMPORARY, INTERNSHIP, PROBATION)
  startDate: Date
  endDate?: Date (null = indefinite)
  terminatedAt?: Date
  reason?: EmploymentReason
  metadata: Json?
  createdAt, updatedAt
}
```

## 7. API

- `POST /employment-relationships/:id/contracts` — Create
- `POST /employment-relationships/:id/contracts/:contractId/renew` — Renew
- `POST /contracts/:id/terminate` — Terminate
- `GET /employment-relationships/:id/contracts/current` — Current
- `GET /employment-relationships/:id/contracts` — History
