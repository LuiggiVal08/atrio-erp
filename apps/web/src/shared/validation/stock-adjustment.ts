import { z } from 'zod';

export const stockAdjustmentSchema = z.object({
  productId: z.uuid(),
  warehouseId: z.uuid(),
  mode: z.enum(['in', 'out', 'count']),
  quantity: z.number().finite().min(0),
  reason: z.string().trim().min(1),
  lotNumber: z.string().trim(),
  serialNumber: z.string().trim(),
  expirationDate: z.union([z.literal(''), z.iso.date()]),
}).superRefine((value, context) => {
  if (value.mode !== 'count' && value.quantity === 0) {
    context.addIssue({ code: 'custom', path: ['quantity'], message: 'La cantidad debe ser mayor que cero.' });
  }
});

export type StockAdjustmentValues = z.infer<typeof stockAdjustmentSchema>;
