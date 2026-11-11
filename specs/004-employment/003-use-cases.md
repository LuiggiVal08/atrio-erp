# Use Cases — Employment

> Casos de uso del bounded context Employment. Cada caso de uso es una
> transacción atómica que opera dentro del aggregate EmploymentRelationship.

---

## UC-01: Iniciar relación laboral

**Descripción**: Crea un nuevo EmploymentRelationship con su contrato inicial,
compensación, horario y estado ACTIVE.

**Actor**: HR Manager

**Precondiciones**:
- Employee existe en el sistema
- Employee no tiene un EmploymentRelationship activo del mismo tipo (si aplica)

**Flujo principal**:
1. Sistema recibe employeeId, contractType, baseSalary, currency, schedule
2. Sistema crea EmploymentRelationship con status ACTIVE
3. Sistema crea Contract asociado
4. Sistema crea CompensationAgreement asociado
5. Sistema crea ScheduleAssignment asociado
6. Sistema registra EmploymentChange con reason = PROMOTION (o equivalente)
7. Sistema emite evento `employment.relationship.started`

**Postcondiciones**:
- EmploymentRelationship existe con status ACTIVE
- Contract vigente existe
- CompensationAgreement vigente existe
- ScheduleAssignment vigente existe

---

## UC-02: Terminar relación laboral

**Descripción**: Finaliza un EmploymentRelationship activo.

**Actor**: HR Manager

**Precondiciones**:
- EmploymentRelationship existe con status ACTIVE

**Flujo principal**:
1. Sistema recibe employmentRelationshipId, endDate, reason (RESIGNATION | LAYOFF | RETIREMENT | CONTRACT_EXPIRATION | etc.)
2. Sistema cierra Contract vigente con endDate
3. Sistema cambia EmploymentRelationship.status a TERMINATED
4. Sistema establece EmploymentRelationship.endDate
5. Sistema registra EmploymentChange con reason
6. Sistema emite evento `employment.relationship.terminated`

**Postcondiciones**:
- EmploymentRelationship.status = TERMINATED
- Contract vigente tiene endDate
- EmploymentRelationship.endDate establecido

---

## UC-03: Cambiar compensación

**Descripción**: Registra un nuevo acuerdo compensatorio. Puede ser
aumento salarial, cambio de moneda, o reestructuración de bonos (V2+).

**Actor**: HR Manager

**Precondiciones**:
- EmploymentRelationship existe con status ACTIVE

**Flujo principal**:
1. Sistema recibe employmentRelationshipId, newBaseSalary, effectiveDate, reason
2. Sistema crea nuevo CompensationAgreement
3. Sistema registra EmploymentChange con reason = SALARY_REVIEW | PROMOTION
4. Sistema emite evento `employment.compensation.changed`

**Postcondiciones**:
- Nuevo CompensationAgreement existe
- Compensación vigente es el nuevo acuerdo

---

## UC-04: Cambiar horario laboral

**Descripción**: Registra un cambio de jornada sin modificar el contrato.

**Actor**: HR Manager / Supervisor

**Precondiciones**:
- EmploymentRelationship existe con status ACTIVE

**Flujo principal**:
1. Sistema recibe employmentRelationshipId, newSchedule, effectiveDate, reason
2. Sistema crea nuevo ScheduleAssignment
3. Sistema registra EmploymentChange con reason
4. Sistema emite evento `employment.schedule.changed`

**Postcondiciones**:
- Nuevo ScheduleAssignment existe

---

## UC-05: Modificar contrato

**Descripción**: Cambia términos contractuales (tipo, moneda). Se cierra
el contrato anterior y se crea uno nuevo.

**Actor**: HR Manager

**Precondiciones**:
- EmploymentRelationship existe con status ACTIVE

**Flujo principal**:
1. Sistema recibe employmentRelationshipId, nuevos términos, reason
2. Sistema cierra contrato vigente con endDate
3. Sistema crea nuevo contrato
4. Sistema registra EmploymentChange con reason
5. Sistema emite evento `employment.contract.amended`

**Postcondiciones**:
- Contrato anterior tiene endDate
- Nuevo contrato existe como vigente

---

## UC-06: Suspender relación laboral

**Descripción**: Suspende temporalmente un EmploymentRelationship.

**Actor**: HR Manager

**Precondiciones**:
- EmploymentRelationship existe con status ACTIVE

**Flujo principal**:
1. Sistema recibe employmentRelationshipId, reason
2. Sistema cambia EmploymentRelationship.status a SUSPENDED
3. Sistema registra EmploymentChange con reason
4. Sistema emite evento `employment.relationship.suspended`

**Postcondiciones**:
- EmploymentRelationship.status = SUSPENDED

---

## UC-07: Reactivar relación laboral

**Descripción**: Reactiva un EmploymentRelationship suspendido.

**Actor**: HR Manager

**Precondiciones**:
- EmploymentRelationship existe con status SUSPENDED

**Flujo principal**:
1. Sistema recibe employmentRelationshipId, reason
2. Sistema cambia EmploymentRelationship.status a ACTIVE
3. Sistema registra EmploymentChange con reason
4. Sistema emite evento `employment.relationship.reactivated`

**Postcondiciones**:
- EmploymentRelationship.status = ACTIVE

---

## UC-08: Consultar historial laboral

**Descripción**: Obtiene el historial completo de un EmploymentRelationship.

**Actor**: HR Manager, Supervisor, Employee (solo propio)

**Flujo principal**:
1. Sistema recibe employmentRelationshipId
2. Sistema recupera EmploymentRelationship + Contracts + CompensationAgreements +
   ScheduleAssignments + EmploymentChanges + PositionAssignments
3. Sistema devuelve agregado completo con estado vigente y razón de cada cambio

**Postcondiciones**: ninguna
