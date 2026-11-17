import { z } from 'zod';

const positiveAmount = z
  .string()
  .trim()
  .min(1, 'La tasa es obligatoria')
  .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
    message: 'La tasa debe ser mayor que cero',
  });

export const taxFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  rate: positiveAmount,
  type: z.enum(['percentage', 'fixed']),
});

export type TaxFormValues = z.infer<typeof taxFormSchema>;
