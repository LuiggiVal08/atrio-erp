# Module Vision — Employment

> Gestión de la relación laboral entre la organización y las personas.
> Un bounded context que modela el empleo como entidad independiente del
> Employee y del Payroll, actuando como capa intermedia que evita
> acoplamiento directo entre RRHH y Nómina.

---

## Por qué existe este módulo

Atrio tiene `Employee` como entidad base de RRHH. Pero `Employee` representa
a la persona, no a su relación laboral. En la práctica:

- Una persona puede tener múltiples relaciones laborales simultáneas
  (tiempo completo + asesoría, o dos contratos en distintos países)
- El `status` del empleado no debería confundirse con el estado del contrato
- El salario, horario, cargo y supervisor cambian sin que cambie la persona
- La nómina no paga a la persona: paga la relación laboral

Employment formaliza esa abstracción: **la relación laboral como entidad de
primer orden**, con su propio ciclo de vida, eventos e historial.

---

## Alcance

### Incluido (V1)

- **Employment**: relación laboral entre Employee y la organización
- **Contract**: términos del empleo (tipo, fechas, moneda, status)
- **SalaryAgreement**: historia salarial completa (reemplaza SalaryHistory)
- **ScheduleAssignment**: horario laboral (con historial de cambios)
- **EmploymentStatus**: ciclo de vida (ACTIVE, SUSPENDED, TERMINATED, ON_LEAVE)
- **EmploymentChange**: registro único para cualquier modificación de la relación
- **PositionAssignment** como referencia desde Organization (read-only)

### Excluido explícitamente (No V1)

- Cálculo de prestaciones sociales (Localization)
- Cálculo de vacaciones (Localization)
- Cálculo de indemnizaciones (Localization)
- Cálculo de impuestos laborales (Localization)
- Attendance / Asistencia (bounded context Workforce, futuro)
- Leave / Permisos (bounded context Workforce, futuro)
- Payroll (bounded context Payroll, futuro)
- Documentos adjuntos (People, futuro)

---

## Principios

1. **Employment ≠ Employee** — la persona existe independientemente de su
   relación laboral
2. **Nunca se modifica, siempre se agrega** — salario, horario, cargo y
   cualquier cambio son nuevos registros, no updates in-place
3. **El core no conoce legislación** — Employment almacena hechos puros;
   las reglas de cálculo pertenecen a Localization
4. **Un Employment, un contrato vigente** — el contrato actual es el último
   sin `endDate`; los anteriores son histórico
5. **Eventos, no efectos secundarios** — Employment emite eventos de dominio;
   los efectos (recálculo de nómina, notificaciones) los manejan otros BCs

---

## Relación con otros bounded contexts

```text
Organization         ────  PositionAssignment ──────┐
                                                     ↓
People (Employee)    ────  Employee ────────────────►  Employment
                                                     │
Localization         ────  reglas de cálculo ◄───────┘
                                                     │
                                                     ├──► Workforce (Attendance, Leave)
                                                     │
                                                     └──► Payroll

Employment no conoce Localization.
Employment no conoce Payroll.
Employment no conoce Workforce.

Employment solo:
  - almacena hechos laborales
  - mantiene historial inmutable
  - emite eventos de dominio
```
