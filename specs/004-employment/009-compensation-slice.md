# Slice 3 — CompensationAgreement

## 1. ¿Qué es?

Un CompensationAgreement define la compensación económica de una EmploymentRelationship durante un período. Es append-only: cada ajuste salarial crea un nuevo agreement.

## 2. ¿Qué NO es?

No contiene:
- Payroll, nómina, deducciones, retenciones
- Contrato, schedule, attendance, bonus (V2)
- Solo define baseAmount + currency + type

## 3. Componentes (V1: solo SALARY)

- `SALARY` — salario base mensual
- (V2+) `BONUS`, `ALLOWANCE`, `COMMISSION`

Cada CompensationAgreement tiene múltiples CompensationComponent (en V1, uno solo de tipo SALARY).

## 4. Invariantes

- **INV-COMP-001**: Una EmploymentRelationship puede tener múltiples CompensationAgreement, pero solo uno vigente a la vez (sin solapamiento de fechas)
- **INV-COMP-002**: Los agreements nunca se modifican — se reemplazan (append-only)
- **INV-COMP-003**: Todo CompensationAgreement debe pertenecer a exactamente una EmploymentRelationship
- **INV-COMP-004**: baseAmount debe ser > 0
- **INV-COMP-005**: Una relación sin contrato activo no puede tener CompensationAgreement (validación débil — alerta, no bloqueo)

## 5. Eventos

- `compensation.created`
- `compensation.adjusted`

## 6. API

- `POST /employment-relationships/:id/compensation` — Create (con componentes)
- `GET /employment-relationships/:id/compensation/current` — Current
- `GET /employment-relationships/:id/compensation` — History
- `GET /compensation/:id` — By ID
