import { z } from 'zod';

export const payrollLoanFormSchema = z.object({
  relationshipId: z.string().min(1, 'Selecciona un empleado'),
  principal: z
    .number({ error: 'El monto es obligatorio' })
    .min(0.01, 'El monto debe ser mayor que 0')
    .max(1000000000, 'El monto excede el máximo permitido'),
  installmentCount: z
    .number({ error: 'El número de cuotas es obligatorio' })
    .int('El número de cuotas debe ser un entero')
    .min(1, 'El mínimo es 1 cuota')
    .max(1000, 'El máximo es 1000 cuotas'),
  currency: z
    .string()
    .trim()
    .length(3, 'La moneda debe tener 3 caracteres'),
  reason: z
    .string()
    .trim()
    .min(1, 'El motivo es obligatorio')
    .max(240, 'El motivo no puede superar 240 caracteres'),
});

export type PayrollLoanFormValues = z.infer<typeof payrollLoanFormSchema>;
