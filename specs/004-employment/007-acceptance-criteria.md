# Acceptance Criteria — Employment

> Criterios de aceptación para V1 del bounded context Employment.
> Cada criterio es verificable (pasa/falla).

---

## EMP-AC-01: Inicio de relación laboral

**Dado** un Employee existente  
**Cuando** se inicia un EmploymentRelationship con contrato indefinido,
salario USD 1500 mensual, horario L-V 8-5, reason = NEW_HIRE  
**Entonces** el sistema crea un EmploymentRelationship ACTIVE  
**Y** el sistema crea un Contract INDEFINITE vigente  
**Y** el sistema crea un CompensationAgreement USD 1500 vigente  
**Y** el sistema crea un ScheduleAssignment L-V 8-5 vigente  
**Y** el sistema registra un EmploymentChange con reason = NEW_HIRE  
**Y** el sistema emite `employment.relationship.started`

---

## EMP-AC-02: Múltiples relaciones para un empleado

**Dado** un Employee con un EmploymentRelationship activo  
**Cuando** se inicia un segundo EmploymentRelationship
(contrato de asesoría, freelance)  
**Entonces** ambos existen simultáneamente  
**Y** cada uno tiene su propio contrato, compensación y horario

---

## EMP-AC-03: Terminación con razón

**Dado** un EmploymentRelationship ACTIVE  
**Cuando** se termina con fecha 2026-12-31, reason = RESIGNATION  
**Entonces** EmploymentRelationship.status = TERMINATED  
**Y** EmploymentRelationship.endDate = 2026-12-31  
**Y** contrato vigente tiene endDate = 2026-12-31  
**Y** EmploymentChange registra reason = RESIGNATION  
**Y** se emite `employment.relationship.terminated`

---

## EMP-AC-04: Historial de compensación inmutable

**Dado** un EmploymentRelationship con CompensationAgreement(baseSalary: 1000, effectiveDate: 2026-01-01)
**Cuando** se registra CompensationAgreement(baseSalary: 1500, effectiveDate: 2026-07-01, reason: SALARY_REVIEW)
**Entonces** el primer acuerdo permanece en historial  
**Y** la compensación vigente es 1500  
**Y** no hay UPDATE sobre el registro anterior, solo INSERT  
**Y** EmploymentChange registra reason = SALARY_REVIEW

---

## EMP-AC-05: Cambio de horario con razón

**Dado** un EmploymentRelationship ACTIVE con horario L-V 8-5  
**Cuando** se registra ScheduleAssignment(L-V 9-6, effectiveDate: 2026-08-01, reason: SCHEDULE_REVIEW)  
**Entonces** existe un nuevo ScheduleAssignment  
**Y** el horario vigente es 9-6  
**Y** se emite `employment.schedule.changed` con reason

---

## EMP-AC-06: Suspensión y reactivación con razón

**Dado** un EmploymentRelationship ACTIVE  
**Cuando** se suspende (reason = MEDICAL_LEAVE)  
**Entonces** EmploymentRelationship.status = SUSPENDED  
**Y** EmploymentChange registra reason = MEDICAL_LEAVE  
**Y** se emite `employment.relationship.suspended`  

**Cuando** se reactiva (reason = MEDICAL_LEAVE_ENDED)  
**Entonces** EmploymentRelationship.status = ACTIVE  
**Y** se emite `employment.relationship.reactivated`

---

## EMP-AC-07: Consulta de aggregate con historial

**Dado** un EmploymentRelationship con 2 contratos, 3 compensaciones,
1 cambio de horario, 2 cambios de estado  
**Cuando** se consulta GET /employment-relationships/:id  
**Entonces** el response incluye contrato vigente, compensación vigente,
horario vigente, asignación vigente, e historial completo de cambios
con sus razones

---

## EMP-AC-08: Localization no contaminado

**Dado** un EmploymentRelationship activo en Venezuela  
**Cuando** se consulta Employment  
**Entonces** NO hay campos de prestaciones, utilidades, IVSS, FAOV,
ISLR ni ninguna regla venezolana  
**Y** todos esos cálculos viven exclusivamente en Localization

---

## EMP-AC-09: No FK directos a Position o Department

**Dado** el modelo de datos de Employment  
**Cuando** se inspecciona el esquema  
**Entonces** EmploymentRelationship NO tiene `positionId`  
**Y** EmploymentRelationship NO tiene `departmentId`  
**Y** la relación con Position es a través de PositionAssignment
(entidad temporal separada en Organization)

---

## EMP-AC-10: 100% eventos emitidos con razón

**Dado** Employment V1 en producción  
**Cuando** se completa cualquiera de los use cases UC-01 a UC-07  
**Entonces** el evento de dominio correspondiente se emite al Event Bus  
**Y** el evento incluye `reason` para analítica  
**Y** el evento NO contiene datos de Localization  
**Y** el evento es consumible por Localization, Payroll, Workforce
sin necesidad de join con tablas de Employment

---

## EMP-AC-11: EmploymentReason es obligatorio

**Dado** cualquier cambio en un EmploymentRelationship  
**Cuando** se ejecuta el caso de uso  
**Entonces** el campo `reason` (EmploymentReason) es requerido  
**Y** no se permite un cambio sin razón documentada

---

## EMP-AC-12: Workforce y Payroll no conocen EmployeeId

**Dado** un Employee con un EmploymentRelationship activo  
**Cuando** Workforce o Payroll registran operaciones  
**Entonces** usan `employmentRelationshipId`, no `employeeId`  
**Y** ningún registro en esos BCs contiene `employeeId`
