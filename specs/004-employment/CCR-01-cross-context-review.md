# Cross-Context Review — Employment

> Revisión de impacto cruzado entre Employment y los bounded contexts
> existentes y futuros de Atrio.

---

## CCR-01-01: Organization

**Relación**: Employment consume PositionAssignment (read-only)

**Impacto**:
- El aggregate de Employment incluye `currentAssignment` (posición vigente
  desde Organization)
- No se crea ni modifica PositionAssignment desde Employment
- La consulta se hace por `employeeId` (shared identity)

**Riesgo**: Si Organization cambia el modelo de PositionAssignment,
Employment debe actualizar su consulta. Mitigación: la consulta es simple
(`WHERE employeeId = ? AND endDate IS NULL`).

**Acción**: Documentar como dependencia de solo lectura. Ningún cambio.

---

## CCR-01-02: People (Employee)

**Relación**: Employment.employeeId → Employee.id (read-only)

**Impacto**:
- El aggregate de Employment referencia al Employee por ID
- No se modifica Employee desde Employment
- Employee puede existir sin Employment (persona registrada sin relación
  laboral activa)

**Riesgo**: Bajo. Employee es una entidad estable.

**Acción**: Ninguna.

---

## CCR-01-03: Localization

**Relación**: Localization consume eventos de Employment

**Impacto**:
- Employment emite eventos puros de dominio
- Localization escucha y calcula reglas locales
- Localization necesita su propia tabla de antigüedad/prestaciones por país

**Riesgo**: Alto si la frontera no está bien definida. Mitigado por
006-localization-boundary.md.

**Acción**: Employment no debe importar ni conocer Localization.
Localization debe ser quien importe eventos de Employment.

---

## CCR-01-04: Payroll (futuro)

**Relación**: Payroll consume Employment data (solo lectura)

**Impacto**:
- Payroll necesita saber: salario vigente, contrato vigente, schedule,
  status del Employment
- Payroll no procesa personas, procesa relaciones laborales
- Un PayrollRun itera sobre Employments activos, no sobre Employees

**Riesgo**: Medio. Si Payroll se implementa sin Employment como
intermediario, puede acoplarse directamente a Employee.

**Acción**: Documentar que Payroll solo conoce EmploymentId, no
EmployeeId. Validar durante implementación.

---

## CCR-01-05: Workforce (futuro — Attendance, Leave)

**Relación**: Workforce consume Employment data

**Impacto**:
- Attendance registra asistencia por EmploymentId (no EmployeeId)
- Leave solicita permiso contra el Employment activo
- El ScheduleAssignment vigente define la jornada esperada

**Riesgo**: Bajo. Employment expone todo lo que Workforce necesita.

**Acción**: Documentar que Attendance y Leave referencian EmploymentId.

---

## CCR-01-06: Organization (managerEmployeeId)

**Relación**: Employee.managerEmployeeId (jerarquía)

**Impacto**:
- Employment no gestiona jerarquía
- `managerEmployeeId` en Employee es suficiente para V1
- Cuando aparezca ManagerAssignment (historial de supervisión),
  pertenecerá a Organization, no a Employment

**Riesgo**: Si la jerarquía se usa para aprobaciones, puede necesitar
historial. Anotado como deuda técnica en ADR-0009.

**Acción**: Sin cambios por ahora.

---

## CCR-01-07: Document Engine

**Relación**: Employment podría integrarse con documentos

**Impacto**:
- Un contrato firmado puede ser un Document en Document Engine
- Employment almacena el `contractId` del Document (no el PDF)

**Riesgo**: Bajo para V1. La integración con Document Engine se decide
cuando se implemente la subida de documentos.

**Acción**: Dejar previsto: Contract tendrá un `documentId` opcional
para V2.

---

## CCR-01-08: RBAC / Permisos

**Relación**: Employment necesita permisos específicos

**Impacto**:
- Se necesita al menos: `employment:read`, `employment:create`,
  `employment:terminate`, `salary:write`, `schedule:write`
- Coexiste con los permisos `hr:*` existentes

**Riesgo**: Bajo. Sigue el mismo patrón que el resto de módulos.

**Acción**: Agregar permisos `employment:*` al seed de permisos.

---

## Matriz de riesgos

| CCR | Contexto | Riesgo | Acción |
|-----|----------|--------|--------|
| 01 | Organization | 🟢 Bajo | Documentar dependencia read-only |
| 02 | Employee | 🟢 Bajo | Ninguna |
| 03 | Localization | 🔴 Alto | 006-localization-boundary.md lo mitiga |
| 04 | Payroll | 🟡 Medio | Prohibir acceso directo a Employee |
| 05 | Workforce | 🟢 Bajo | Usar EmploymentId |
| 06 | Organization | 🟡 Medio | Anotar deuda de manager history |
| 07 | Document Engine | 🟢 Bajo | Diferir a V2 |
| 08 | RBAC | 🟢 Bajo | Agregar seeds |

---

## Veredicto

Employment puede proceder a implementación. La única dependencia de alto
riesgo (Localization) está mitigada por la frontera definida en
006-localization-boundary.md. Las dependencias restantes son de solo
lectura o están documentadas como deuda técnica.
