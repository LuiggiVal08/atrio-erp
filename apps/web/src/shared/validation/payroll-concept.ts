import { z } from 'zod';

export const payrollConceptFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'El código debe tener al menos 2 caracteres')
    .max(30, 'El código no puede superar 30 caracteres'),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(120, 'El nombre no puede superar 120 caracteres'),
  type: z.enum(['EARNING', 'DEDUCTION']),
  calculationMode: z.enum(['FIXED', 'BASE_PERCENTAGE']),
  amount: z
    .number({ error: 'El monto es obligatorio' })
    .min(0.01, 'El monto debe ser mayor que 0')
    .max(1000000000, 'El monto excede el máximo permitido'),
  currency: z
    .string()
    .trim()
    .length(3, 'La moneda debe tener 3 caracteres'),
  recurring: z.boolean(),
});

export type PayrollConceptFormValues = z.infer<typeof payrollConceptFormSchema>;
