import { z } from 'zod';

const nonNegativeAmount = z
  .string()
  .trim()
  .refine((value) => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0), {
    message: 'Ingresa una cantidad válida',
  });

export const reorderPointFormSchema = z
  .object({
    productId: z.string().min(1, 'Selecciona un producto'),
    warehouseId: z.string().min(1, 'Selecciona un almacén'),
    minQuantity: nonNegativeAmount,
    maxQuantity: z
      .string()
      .trim()
      .min(1, 'El máximo es obligatorio')
      .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 0, {
        message: 'Ingresa una cantidad válida',
      }),
  })
  .superRefine((value, ctx) => {
    if (value.maxQuantity !== '' && Number(value.maxQuantity) <= Number(value.minQuantity || 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['maxQuantity'],
        message: 'El máximo debe ser mayor que el mínimo',
      });
    }
  });

export type ReorderPointFormValues = z.infer<typeof reorderPointFormSchema>;
