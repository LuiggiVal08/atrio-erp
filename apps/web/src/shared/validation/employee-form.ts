import { z } from 'zod';

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().pipe(z.email('Ingresa un correo válido.')),
]);

const baseSalary = z
  .union([z.number(), z.undefined()])
  .refine((value) => typeof value === 'number' && Number.isFinite(value) && value > 0, {
    message: 'El salario base debe ser un valor mayor que cero.',
  });

const contractType = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'FIXED_TERM',
  'TEMPORARY',
  'INTERNSHIP',
  'PROBATION',
]);

export interface EmployeeFormSchemaOptions {
  isEdit: boolean;
  originalSalary?: number;
}

export function createEmployeeFormSchema({ isEdit, originalSalary = 0 }: EmployeeFormSchemaOptions) {
  return z
    .object({
      firstName: z.string().trim().min(1, 'El primer nombre es obligatorio'),
      middleName: z.string(),
      lastName: z.string().trim().min(1, 'El primer apellido es obligatorio'),
      secondLastName: z.string(),
      identificationType: z.string(),
      identityDoc: z.string().trim().min(1, 'El documento es obligatorio'),
      taxIdentifier: z.string(),
      phone: z.string(),
      email: optionalEmail,
      address: z.string(),
      emergencyContactName: z.string(),
      emergencyContactPhone: z.string(),
      hireDate: z.string().min(1, 'La fecha de ingreso es obligatoria'),
      baseSalary,
      contractType,
      contractEndDate: z.string(),
      reason: z.string(),
      selectedDeptId: z.string(),
      newDeptName: z.string(),
      selectedPosId: z.string(),
      newPosName: z.string(),
      currency: z.string().regex(/^[A-Z]{3}$/, 'Selecciona una moneda'),
      compensationEffectiveDate: z.string(),
      compensationReason: z.string(),
    })
    .superRefine((value, ctx) => {
      if (!isEdit) {
        if (!value.selectedDeptId && !value.newDeptName.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['selectedDeptId'],
            message: 'Seleccione un departamento o cree uno nuevo.',
          });
        }
        if (!value.selectedPosId && !value.newPosName.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: ['selectedPosId'],
            message: 'Seleccione un cargo o cree uno nuevo.',
          });
        }
        if (value.contractType === 'FIXED_TERM' && !value.contractEndDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['contractEndDate'],
            message: 'El contrato a plazo fijo requiere fecha de fin.',
          });
        }
      }

      if (isEdit && Number(value.baseSalary) !== originalSalary) {
        if (!value.compensationEffectiveDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['compensationEffectiveDate'],
            message: 'Indique la fecha efectiva de la compensación.',
          });
        }
        if (!value.compensationReason) {
          ctx.addIssue({
            code: 'custom',
            path: ['compensationReason'],
            message: 'Indique el motivo de la compensación.',
          });
        }
      }
    });
}

export type EmployeeFormValues = z.infer<ReturnType<typeof createEmployeeFormSchema>>;

export const employeePaymentFormSchema = z
  .object({
    method: z.enum(['BANK', 'MOBILE_PAYMENT']),
    bankName: z.string(),
    accountType: z.enum(['SAVINGS', 'CHECKING', 'OTHER']),
    accountNumber: z.string(),
    mobilePaymentPhone: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.method === 'BANK') {
      if (!value.bankName.trim()) {
        ctx.addIssue({ code: 'custom', path: ['bankName'], message: 'El banco es obligatorio.' });
      }
      if (!value.accountNumber.trim()) {
        ctx.addIssue({ code: 'custom', path: ['accountNumber'], message: 'El número de cuenta es obligatorio.' });
      }
    }
    if (value.method === 'MOBILE_PAYMENT' && !value.mobilePaymentPhone.trim()) {
      ctx.addIssue({ code: 'custom', path: ['mobilePaymentPhone'], message: 'El teléfono es obligatorio.' });
    }
  });

export type EmployeePaymentFormValues = z.infer<typeof employeePaymentFormSchema>;
