import { z } from 'zod';

export const purchaseReturnSchema = z.object({
  orderId: z.string().min(1, 'Selecciona la orden recibida'),
  warehouseId: z.string().min(1, 'Selecciona el almacén'),
  productId: z.string().min(1, 'Selecciona el producto'),
  quantity: z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'number' && Number.isFinite(value) && value > 0, {
      message: 'La cantidad debe ser mayor que cero.',
    }),
  reasonCode: z.string().min(1, 'Selecciona el motivo'),
  reason: z.string().trim().min(1, 'El detalle es obligatorio'),
  total: z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'undefined' || (Number.isFinite(value) && value >= 0), {
      message: 'El valor devuelto no puede ser negativo.',
    }),
  supplierCreditNo: z.string(),
});

export type PurchaseReturnValues = z.infer<typeof purchaseReturnSchema>;
