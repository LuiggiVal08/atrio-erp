import { z } from 'zod';

export const bankAccountFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  accountNumber: z.string().trim().min(1, 'El número de cuenta es obligatorio'),
  bankName: z.string().trim().min(1, 'El banco es obligatorio'),
  accountType: z.enum(['checking', 'savings', 'cash']),
});

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>;
