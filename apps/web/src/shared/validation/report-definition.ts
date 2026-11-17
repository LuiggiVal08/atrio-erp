import { z } from 'zod';

export const reportDefinitionFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  type: z.string().min(1),
  format: z.string(),
  schedule: z.string(),
  recipients: z.string(),
});

export type ReportDefinitionFormValues = z.infer<typeof reportDefinitionFormSchema>;
