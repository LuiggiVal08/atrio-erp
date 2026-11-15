import { z } from 'zod';

const date = z.iso.date();
export const employeeSetupSchema = z.object({
  departmentId: z.uuid().optional(),
  department: z.object({ name: z.string().trim().min(1) }).optional(),
  positionId: z.uuid().optional(),
  position: z.object({ name: z.string().trim().min(1), code: z.string().optional() }).optional(),
  employee: z.object({
    id: z.uuid(), firstName: z.string().trim().min(1), lastName: z.string().trim().min(1),
    identityDoc: z.string().trim().min(1), hireDate: date,
    baseSalary: z.number().positive().multipleOf(0.01),
    middleName: z.string().optional(), secondLastName: z.string().optional(),
    identificationType: z.enum(['V', 'E', 'J', 'G', 'P', 'CC', 'CE', 'NIT', 'DNI', 'RUC', 'PASSPORT', 'OTHER']).optional(),
    taxIdentifier: z.string().optional(), phone: z.string().optional(), email: z.email().optional(),
    address: z.string().optional(), emergencyContactName: z.string().optional(), emergencyContactPhone: z.string().optional(),
  }),
  employment: z.object({ startDate: date, reason: z.string().min(1) }),
  contract: z.object({
    contractType: z.enum(['FULL_TIME', 'PART_TIME', 'FIXED_TERM', 'TEMPORARY', 'INTERNSHIP', 'PROBATION']),
    startDate: date, endDate: date.optional(), reason: z.string().optional(),
  }),
  compensation: z.object({
    effectiveDate: date, currency: z.string().regex(/^[A-Z]{3}$/),
    components: z.array(z.object({ type: z.enum(['SALARY', 'BONUS', 'ALLOWANCE', 'COMMISSION']), amount: z.number().positive().multipleOf(0.01) })).min(1),
  }),
}).superRefine((value, ctx) => {
  if (!!value.departmentId === !!value.department) ctx.addIssue({ code: 'custom', path: ['departmentId'], message: 'Seleccione un departamento o cree uno nuevo.' });
  if (!!value.positionId === !!value.position || (value.positionId && !value.departmentId)) ctx.addIssue({ code: 'custom', path: ['positionId'], message: 'Seleccione un cargo del departamento o cree uno nuevo.' });
  if (value.contract.contractType === 'FIXED_TERM' && !value.contract.endDate) ctx.addIssue({ code: 'custom', path: ['contract', 'endDate'], message: 'El contrato fijo requiere fecha de fin.' });
  if (value.contract.endDate && value.contract.endDate <= value.contract.startDate) ctx.addIssue({ code: 'custom', path: ['contract', 'endDate'], message: 'La fecha de fin debe ser posterior al ingreso.' });
});

export const compensationAdjustmentSchema = z.object({
  effectiveDate: date,
  currency: z.string().regex(/^[A-Z]{3}$/),
  reason: z.enum(['SALARY_REVIEW', 'MERIT_INCREASE', 'PROMOTION', 'OTHER']),
  components: z.array(z.object({ type: z.enum(['SALARY', 'BONUS', 'ALLOWANCE', 'COMMISSION']), amount: z.number().positive().multipleOf(0.01) })).min(1),
});
