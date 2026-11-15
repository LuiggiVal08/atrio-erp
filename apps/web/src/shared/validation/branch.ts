import { z } from 'zod';

export const branchFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120, 'Máximo 120 caracteres'),
  code: z
    .string()
    .trim()
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Za-z0-9-]*$/, 'Solo letras, números y guiones'),
  address: z.string().max(200, 'Máximo 200 caracteres'),
  city: z.string().max(100, 'Máximo 100 caracteres'),
  state: z.string().max(100, 'Máximo 100 caracteres'),
  phone: z.string().max(30, 'Máximo 30 caracteres'),
  managerEmployeeId: z.string(),
});

export type BranchFormValues = z.infer<typeof branchFormSchema>;
