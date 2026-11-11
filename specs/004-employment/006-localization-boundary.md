# Localization Boundary — Employment

> ⭐ Documento crítico: define qué pertenece al core de Employment
> y qué pertenece al Localization Engine. Esta frontera es la decisión
> arquitectónica más importante del módulo.

---

## Principio rector

Employment almacena **hechos puros e inmutables** sobre la relación laboral.
Localization **consume esos hechos y aplica reglas** específicas de cada país.

Employment no conoce Localization. Localization conoce Employment (solo lectura).

---

## Lo que Employment SÍ almacena (hechos)

| Hecho | Tipo | Ejemplo |
|-------|------|---------|
| Que existe una relación laboral | Entidad | Employment(id, employeeId, startDate) |
| Qué tipo de contrato se firmó | Entidad | Contract(contractType: INDEFINITE) |
| Cuál era el salario en cada fecha | Entidad | SalaryAgreement(amount: 1500, effectiveDate: 2026-07-01) |
| Qué horario tenía en cada fecha | Entidad | ScheduleAssignment(schedule: {...}, effectiveDate) |
| Cuándo y por qué terminó | Campo | Employment.endDate, Employment.terminationReason |
| Quién era el supervisor en cada fecha | Evento | PositionAssignment con endDate |
| Cambios en la relación laboral | Evento | EmploymentChange(tipo, fecha, valores) |

## Lo que Employment NO almacena (cálculos)

| NO almacena | Responsable | Ejemplo de regla |
|-------------|-------------|------------------|
| Prestaciones sociales | Localization | 15 días por año en VE, 30 días en CO |
| Vacaciones legales | Localization | 15 días en VE, 15 en CO, 10 en ES |
| Utilidades / Aguinaldo | Localization | 15 días en VE, 30 en CO, pagas extra en ES |
| Indemnizaciones | Localization | Varía por país y causa de terminación |
| ISLR / Retenciones | Localization | Tablas progresivas por país |
| Aportes patronales | Localization | IVSS + FAOV + INCES en VE; EPS + pensión en CO |
| Horas extras | Localization | 1.5x diurnas, 2x nocturnas en VE; depende del país |
| Factor de prestaciones | Localization | Integral vs diario en VE |
| Salario mínimo | Localization | Varía por país y fecha |
| Cotizaciones SSO | Localization | Porcentajes variables por país |

---

## ¿Por qué esta separación?

### Escenario A: Contratación en Venezuela

Employment registra:
- SalaryAgreement(amount: 200, currency: VED, effectiveDate: 2026-01-01)
- SalaryAgreement(amount: 300, currency: VED, effectiveDate: 2026-07-01)
- Contract(contractType: INDEFINITE)

Localization Venezuela recibe `salary.changed` y calcula:
- Prestaciones sociales al nuevo salario
- Aporte patronal IVSS recalculado
- Factor de utilidades (15 días)

### Escenario B: Contratación en Colombia

Employment registra exactamente los mismos hechos:
- SalaryAgreement(amount: 2000000, currency: COP, effectiveDate: 2026-01-01)
- Contract(contractType: FIXED_TERM, endDate: 2026-12-31)

Localization Colombia recibe los mismos eventos y calcula:
- Cesantías (30 días por año)
- Intereses de cesantías (12%)
- Prima de servicios (30 días semestral)
- Vacaciones (15 días hábiles)
- Aportes EPS + pensión + ARL

### Escenario C: Misma persona, dos países

Luis tiene:
- Employment A (Venezuela): salario en VED, contrato indefinido
- Employment B (Colombia): salario en COP, contrato fijo

Cada Localization procesa los eventos de su Employment correspondiente.
Employment no necesita saber que Luis existe en dos países.

### Escenario D: Cambio legislativo en Venezuela

En 2027 Venezuela cambia el cálculo de prestaciones de 15 a 20 días por año.

Employment no cambia. Localization Venezuela actualiza su regla.
Todos los empleados activos usan la nueva regla automáticamente.

---

## Diagrama de flujo

```text
                    ┌──────────────────────┐
                    │      Employment       │
                    │   (hechos laborales)  │
                    └──────────┬───────────┘
                               │ eventos
                               ▼
                    ┌──────────────────────┐
                    │   Event Bus / Queue   │
                    └──────────┬───────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
    ┌────────────────┐ ┌──────────────┐ ┌──────────────┐
    │ Localization   │ │ Localization  │ │ Localization  │
    │ Venezuela      │ │ Colombia     │ │ Spain         │
    ├────────────────┤ ├──────────────┤ ├──────────────┤
    │ prestaciones   │ │ cesantías    │ │ finiquito    │
    │ utilidades     │ │ primas       │ │ pagas extra  │
    │ IVSS + FAOV    │ │ EPS + ARL    │ │ IRPF         │
    │ ISLR           │ │ retención    │ │ SS           │
    └────────────────┘ └──────────────┘ └──────────────┘
```

---

## Preguntas frecuentes sobre la frontera

### ¿Dónde se calcula la antigüedad?

Employment almacena `startDate` y `endDate`. La antigüedad la calcula
quien la necesita (Localization, Payroll) como `endDate - startDate`.
No es un campo almacenado.

### ¿Dónde se determina si un empleado tiene derecho a vacaciones?

Employment sabe que existe y desde cuándo. Localization decide:
"15 días hábiles después de 1 año de trabajo" (Colombia).
"15 días hábiles después de 6 meses" (Venezuela).

### ¿Dónde se registran las vacaciones tomadas?

En Workforce (Attendance / Leave), no en Employment. Employment solo
sabe que la relación existe. Las vacaciones son un hecho de ausencia.

### ¿Dónde se almacena el salario mínimo?

En Localization, como tabla de referencia por país y fecha. Employment
no valida contra salario mínimo; eso es responsabilidad del UI o de
reglas de negocio en la capa de aplicación.

### ¿Qué pasa si un país requiere aprobación gubernamental del contrato?

Employment registra el contrato. Si se requiere aprobación externa,
un proceso en Localization escucha `contract.created` y maneja el flujo.
Employment no espera aprobaciones.

---

## Migración desde el modelo actual

El `SalaryHistory` actual del módulo Employee migra a `SalaryAgreement`
en Employment. La migración es directa: cada fila de `salary_history`
se convierte en un `SalaryAgreement` asociado al Employment que corresponde.

El campo `Employee.position` (texto libre) se depreca en favor de
`PositionAssignment` en Organization. No se migra automáticamente;
se deja como legado hasta que el UI se actualice.
