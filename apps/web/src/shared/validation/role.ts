import { z } from 'zod';

export const roleFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del rol es obligatorio'),
  description: z.string(),
  permissionIds: z.array(z.string()),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
