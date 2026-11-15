import { z } from 'zod';

export const departmentFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
});

export type DepartmentFormValues = z.infer<typeof departmentFormSchema>;
