import { z } from 'zod';

export const brandFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
});
export type BrandFormValues = z.infer<typeof brandFormSchema>;
