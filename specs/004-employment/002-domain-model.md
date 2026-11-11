# Domain Model — Employment

> Modelo de dominio del bounded context Employment, siguiendo el patrón
> ADR-0009 (Temporal Relationships): las relaciones con cambio histórico
> son entidades separadas, no FK directos.
>
> **Principio rector**: La identidad es estable; los hechos que cambian
> viven en entidades temporales con historial.

---

## Aggregate Root: EmploymentRelationship

La relación jurídica y laboral entre un Employee y la organización.
Es el aggregate root del bounded context.

```
EmploymentRelationship
├── id: EmploymentRelationshipId
├── employeeId: EmployeeId
├── status: EmploymentStatus
├── startDate: Date
├── endDate: Date?
├── createdAt: Date
└── updatedAt: Date
```

Un Employee puede tener múltiples EmploymentRelationship activos
simultáneamente (ej: tiempo completo + asesoría freelance).

EmploymentRelationship no almacena salario, horario ni cargo directamente;
esos se modelan como entidades temporales hijas.

### EmploymentStatus

Ciclo de vida de la relación laboral como entidad propia.

```
EmploymentStatus: PENDING | ACTIVE | SUSPENDED | ON_LEAVE | TERMINATED | ARCHIVED
```

Transiciones válidas:

```text
PENDING ──► ACTIVE
ACTIVE   ──► SUSPENDED ──► ACTIVE
ACTIVE   ──► ON_LEAVE  ──► ACTIVE
ACTIVE   ──► TERMINATED ──► ARCHIVED
SUSPENDED ──► TERMINATED
ON_LEAVE  ──► TERMINATED
```

Cada transición de estado se registra como un EmploymentChange con su
EmploymentReason.

---

## Entidades hijas

### Contract

Términos legales del empleo. Apunta al EmploymentRelationship, no al
Employee directo. Una relación laboral puede tener varios contratos en
el tiempo (ej: temporal → indefinido).

```
Contract
├── id: ContractId
├── employmentRelationshipId: EmploymentRelationshipId
├── contractType: ContractType
├── currency: CurrencyCode
├── startDate: Date
├── endDate: Date?
├── terminationReason: EmploymentReason?
├── documentId: DocumentId?    (V2: integración con Document Engine)
├── createdAt: Date
└── updatedAt: Date
```

ContractType: INDEFINITE | FIXED_TERM | TEMPORARY | FREELANCE | INTERNSHIP

El contrato vigente es el último sin `endDate`.

### CompensationAgreement

Acuerdo compensatorio, que en V1 solo incluye salario base pero el nombre
permite crecer a bonos, comisiones, asignaciones y beneficios sin cambiar
el modelo. Reemplaza `SalaryHistory` del módulo Employee.

```
CompensationAgreement
├── id: CompensationAgreementId
├── employmentRelationshipId: EmploymentRelationshipId
├── baseSalary: Decimal
├── currency: CurrencyCode
├── frequency: PayFrequency
├── effectiveDate: Date
├── reason: EmploymentReason
├── createdAt: Date
```

PayFrequency: MONTHLY | BIWEEKLY | WEEKLY | DAILY | HOURLY

Extensión futura (V2+):
```json
{
  "baseSalary": 1500,
  "bonuses": [{ "type": "PERFORMANCE", "amount": 200 }],
  "commissions": { "rate": 0.05, "on": "SALES" },
  "allowances": [{ "type": "MEAL", "amount": 50 }],
  "benefits": [{ "type": "HEALTH_INSURANCE", "provider": "..." }]
}
```

La compensación vigente es el último `CompensationAgreement` cuya
`effectiveDate` sea la más reciente sin superar la fecha actual.

### ScheduleAssignment

Jornada laboral, separada del contrato. Permite historial de cambios
de horario sin tocar el contrato.

```
ScheduleAssignment
├── id: ScheduleAssignmentId
├── employmentRelationshipId: EmploymentRelationshipId
├── schedule: WorkingSchedule (JSON)
├── effectiveDate: Date
├── reason: EmploymentReason?
├── createdAt: Date
```

WorkingSchedule:
```json
{
  "monday":    { "start": "08:00", "end": "17:00" },
  "tuesday":   { "start": "08:00", "end": "17:00" },
  "wednesday": { "start": "08:00", "end": "17:00" },
  "thursday":  { "start": "08:00", "end": "17:00" },
  "friday":    { "start": "08:00", "end": "17:00" },
  "saturday":  null,
  "sunday":    null
}
```

### EmploymentChange

Registro único e inmutable de cualquier modificación de la relación laboral.
Toda acción de negocio genera un EmploymentChange.

```
EmploymentChange
├── id: EmploymentChangeId
├── employmentRelationshipId: EmploymentRelationshipId
├── changeType: ChangeType
├── reason: EmploymentReason
├── previousValue: Json?
├── newValue: Json?
├── changedBy: UserId
├── createdAt: Date
```

ChangeType:
RELATIONSHIP_STARTED | CONTRACT_CREATED | CONTRACT_AMENDED |
COMPENSATION_CHANGED | SCHEDULE_CHANGED | STATUS_CHANGED |
POSITION_CHANGED | RELATIONSHIP_TERMINATED | RELATIONSHIP_SUSPENDED |
RELATIONSHIP_REACTIVATED

### EmploymentReason

Razón asociada a cada cambio. Permite analítica de RRHH.

```
EmploymentReason:
  PROMOTION | TRANSFER | SALARY_REVIEW | DISCIPLINARY_ACTION |
  RESIGNATION | LAYOFF | RETIREMENT | TEMPORARY_ASSIGNMENT |
  CONTRACT_EXPIRATION | MEDICAL_LEAVE | PERSONAL_LEAVE |
  ORGANIZATIONAL_RESTRUCTURE | OTHER
```

---

## Entidades de referencia (futuras)

### EmploymentPolicy (V2+)

En V1 las reglas (días de vacaciones, período de prueba, aviso previo,
beneficios) se almacenan directamente en Localization. En V2+ aparece
`EmploymentPolicy` como un conjunto reutilizable de reglas que agrupa a
empleados con condiciones similares.

```
EmploymentPolicy
├── id: EmploymentPolicyId
├── name: string                     (ej: "Office Employees")
├── vacationDays: number
├── probationPeriod: number          (días)
├── noticePeriod: number             (días)
├── workingHoursPerWeek: number
├── benefits: string[]
├── createdAt: Date
└── updatedAt: Date
```

EmploymentRelationship puede referenciar una Policy. Localization luego
sobrescribe las reglas según el país.

No se implementa en V1. Solo se documenta para evitar que Contract
acumule campos que pertenecen a Policy.

---

## Aggregate Boundaries

El aggregate root es **EmploymentRelationship**. Todo acceso a Contract,
CompensationAgreement, ScheduleAssignment y EmploymentChange pasa por
EmploymentRelationship.

```
                    ┌──────────────────────────┐
                    │ EmploymentRelationship    │ ← aggregate root
                    ├──────────────────────────┤
                    │ employeeId               │
                    │ status: EmploymentStatus  │
                    │ startDate / endDate       │
                    └──────────────────────────┘
                            │
        ┌───────────────────┼───────────────────────┐
        ▼                   ▼                       ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│   Contract   │  │CompensationAgr.  │  │ScheduleAssignment    │
├──────────────┤  ├──────────────────┤  ├──────────────────────┤
│ contractType │  │ baseSalary       │  │ schedule (JSON)      │
│ currency     │  │ currency         │  │ effectiveDate        │
│ startDate    │  │ frequency        │  │ reason               │
│ endDate      │  │ effectiveDate    │  └──────────────────────┘
└──────────────┘  │ reason           │
                  └──────────────────┘

                            │
                    ┌───────▼────────────┐
                    │ EmploymentChange   │ ← historial inmutable
                    ├───────────────────┤
                    │ changeType        │
                    │ reason            │
                    │ previousValue     │
                    │ newValue          │
                    └───────────────────┘
```

---

## Relaciones con otros bounded contexts

```text
Organization (read)
└── PositionAssignment → EmploymentRelationship consulta por employeeId

People (read)
└── Employee → EmploymentRelationship.employeeId

Workforce (futuro BC separado, read)
└── Attendance       → employmentRelationshipId
└── Leave            → employmentRelationshipId
└── Vacation         → employmentRelationshipId

Payroll (futuro BC separado, read)
└── PayrollRun       → employmentRelationshipId
└── PayrollItem      → employmentRelationshipId

Localization (consume eventos)
└── Escucha eventos de Employment para mantener tablas locales de cálculo

Ninguno de estos BC conoce Employee directamente.
Solo conocen EmploymentRelationshipId.
```

---

## Referencias cruzadas

- ADR-0009: Temporal Relationships (patrón de entidades temporales)
- ADR-0010: Identity Permanence Principle (estabilidad de identidades)
- 006-localization-boundary.md (frontera con Localization)
