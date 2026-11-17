import { z } from 'zod';

export const salesReturnSchema = z
  .object({
    invoiceId: z.string().min(1, 'Selecciona la factura'),
    warehouseId: z.string().min(1, 'Selecciona el almacén'),
    productId: z.string().min(1, 'Selecciona el producto'),
    quantity: z
      .union([z.number(), z.undefined()])
      .refine((value) => typeof value === 'number' && Number.isFinite(value) && value > 0, {
        message: 'La cantidad debe ser mayor que cero.',
      }),
    reasonCode: z.string().min(1, 'Selecciona el motivo'),
    reason: z.string().trim().min(1, 'El detalle es obligatorio'),
    condition: z.enum(['saleable', 'repair', 'damaged']),
    resolution: z.enum(['credit_note', 'refund_cash', 'refund_card', 'exchange']),
    cashRegisterId: z.string(),
    total: z
      .union([z.number(), z.undefined()])
      .refine((value) => typeof value === 'undefined' || (Number.isFinite(value) && value >= 0), {
        message: 'El monto devuelto no puede ser negativo.',
      }),
  })
  .superRefine((value, ctx) => {
    if (value.resolution === 'refund_cash' && !value.cashRegisterId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cashRegisterId'],
        message: 'Selecciona la caja para el reembolso en efectivo',
      });
    }
  });

export type SalesReturnValues = z.infer<typeof salesReturnSchema>;
