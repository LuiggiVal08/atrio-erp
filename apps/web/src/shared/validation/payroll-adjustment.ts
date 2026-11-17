import { z } from 'zod';

export const payrollAdjustmentSchema = z.object({
  relationshipId: z.string().min(1, 'Selecciona un empleado'),
  conceptId: z.string().min(1, 'Selecciona un concepto'),
  amount: z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'number' && Number.isFinite(value) && value > 0, {
      message: 'El monto debe ser mayor que cero.',
    }),
  description: z.string().max(240, 'La descripción no puede superar 240 caracteres'),
});

export type PayrollAdjustmentValues = z.infer<typeof payrollAdjustmentSchema>;
