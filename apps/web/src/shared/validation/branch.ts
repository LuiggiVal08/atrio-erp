import { z } from 'zod';

export const branchFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  code: z.string(),
  address: z.string(),
  phone: z.string(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
