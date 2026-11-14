import { z } from 'zod';

export const cashRegisterFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  location: z.string(),
});

export type CashRegisterFormValues = z.infer<typeof cashRegisterFormSchema>;
