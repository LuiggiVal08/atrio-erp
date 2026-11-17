import { z } from 'zod';

export const cashMovementSchema = z.object({
  type: z.enum(['in', 'out']),
  amount: z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'number' && Number.isFinite(value) && value > 0, {
      message: 'El monto debe ser mayor que cero.',
    }),
  currency: z.string().min(1, 'Selecciona la moneda'),
  description: z.string().trim().min(1, 'El concepto y justificante es obligatorio'),
  category: z.string().min(1, 'Selecciona la categoría del gasto'),
});

export type CashMovementValues = z.infer<typeof cashMovementSchema>;
