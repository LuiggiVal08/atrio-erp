import { z } from 'zod';

export const priceListFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  type: z.enum(['purchase', 'sale']),
});

export type PriceListFormValues = z.infer<typeof priceListFormSchema>;
