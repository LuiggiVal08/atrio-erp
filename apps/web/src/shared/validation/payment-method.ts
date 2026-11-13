import { z } from 'zod';

export const paymentMethodFormSchema = z
  .object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    type: z.enum(['cash', 'digital', 'card', 'other']),
    currency: z.string(),
    commissionPercent: z.number().optional(),
  })
  .refine(
    (value) => {
      if (value.type === 'cash') return true;
      const commission = value.commissionPercent;
      if (commission === undefined) return true;
      return Number.isFinite(commission) && commission >= 0 && commission <= 100;
    },
    { message: 'La comisión debe estar entre 0 % y 100 %', path: ['commissionPercent'] },
  );

export type PaymentMethodFormValues = z.infer<typeof paymentMethodFormSchema>;
