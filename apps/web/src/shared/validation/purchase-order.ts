import { z } from 'zod';

export const purchaseOrderFormSchema = z.object({
  vendorId: z.string().min(1, 'Selecciona un proveedor'),
  expectedDate: z.string().min(1, 'La fecha esperada es obligatoria'),
  subtotal: z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0, {
      message: 'El subtotal no puede ser negativo.',
    }),
  taxAmount: z
    .union([z.number(), z.undefined()])
    .refine((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0, {
      message: 'El impuesto no puede ser negativo.',
    }),
  notes: z.string(),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export const purchaseOrderExpectedDateSchema = z.object({
  expectedDate: z.string().min(1, 'La fecha esperada es obligatoria'),
});

export type PurchaseOrderExpectedDateValues = z.infer<
  typeof purchaseOrderExpectedDateSchema
>;
