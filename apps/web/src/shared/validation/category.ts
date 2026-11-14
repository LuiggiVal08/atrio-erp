import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  parentId: z.string(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
