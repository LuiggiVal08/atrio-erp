# Payroll Slice 1 — Period + Payslip (Salario Base)

## Aggregate Root

`PayrollPeriod` es el aggregate root. Todo el ciclo de nómina gira en torno al período.

## Estados del PayrollPeriod

```
OPEN → CALCULATING → LOCKED → PAID → CLOSED
```

- **OPEN**: período creado, se pueden generar payslips
- **CALCULATING**: generando payslips (transitorio)
- **LOCKED**: payslips generados, no se pueden regenerar
- **PAID**: pagado, irreversible
- **CLOSED**: período contablemente cerrado

## Invariantes

- **INV-PAY-001**: Solo un período OPEN por tenant a la vez
- **INV-PAY-002**: No generar payslips fuera del estado CALCULATING
- **INV-PAY-003**: LOCKED impide regenerar payslips
- **INV-PAY-004**: PAID es irreversible
- **INV-PAY-005**: CLOSED solo después de PAID
- **INV-PAY-006**: Un Payslip representa una fotografía inmutable de los datos laborales durante un período determinado
- **INV-PAY-007**: Payslip nunca se modifica — errores requieren Correction Payroll

## Flujo

1. Crear PayrollPeriod (OPEN)
2. Generate: resolver EmploymentRelationship activos → CompensationAgreement vigente → Payslip (salario base)
3. Lock: inmoviliza payslips
4. (Opcional) Marcar como pagado
5. Cerrar período

## Snapshot (Payslip)

Congela al momento del generate:

- EmploymentRelationshipId
- EmployeeId, EmployeeName
- ContractId (si existe)
- CompensationAgreementId
- PositionAssignmentId (si existe)
- DepartmentId, DepartmentName
- Currency, BaseSalary
- PeriodStart, PeriodEnd

## Eventos

- `payroll.period.generated`
- `payroll.period.closed`

## API

```
POST /payroll/periods
POST /payroll/periods/:id/generate
POST /payroll/periods/:id/lock
POST /payroll/periods/:id/pay
POST /payroll/periods/:id/close
GET  /payroll/periods/:id
GET  /payroll/periods/:id/payslips
```

## Definition of Done

- [ ] Crear PayrollPeriod
- [ ] Resolver EmploymentRelationship activos
- [ ] Resolver CompensationAgreement vigente (findCurrentAt)
- [ ] Generar Payslip con snapshot inmutable
- [ ] Lock inmoviliza payslips
- [ ] Pay marca como pagado
- [ ] Close cierra el período
- [ ] No se puede regenerar payslips después de LOCKED
- [ ] No se puede reabrir un período cerrado
- [ ] Solo un OPEN por tenant

## PayrollCalculationContext

Objeto que centraliza el contexto del cálculo:

```ts
{ periodStart, periodEnd, tenantId }
```

Se expandirá en el futuro con localization, exchangeRate, etc.
