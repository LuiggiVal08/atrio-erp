import { z } from 'zod';

export const transferFormSchema = z
  .object({
    productId: z.string().min(1, 'Selecciona un producto'),
    fromWarehouseId: z.string().min(1, 'Selecciona el almacén de origen'),
    toWarehouseId: z.string().min(1, 'Selecciona el almacén de destino'),
    quantity: z
      .string()
      .trim()
      .min(1, 'La cantidad es obligatoria')
      .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
        message: 'Ingresa una cantidad mayor que cero',
      }),
  })
  .superRefine((value, ctx) => {
    if (
      value.fromWarehouseId &&
      value.fromWarehouseId === value.toWarehouseId
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['toWarehouseId'],
        message: 'El origen y el destino deben ser almacenes distintos',
      });
    }
  });

export type TransferFormValues = z.infer<typeof transferFormSchema>;
