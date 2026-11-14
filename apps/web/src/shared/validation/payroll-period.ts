import { z } from 'zod';

export const payrollPeriodFormSchema = z
  .object({
    startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
    endDate: z.string().min(1, 'La fecha fin es obligatoria'),
    frequency: z.enum([
      'WEEKLY',
      'BIWEEKLY',
      'SEMI_MONTHLY',
      'MONTHLY',
      'CUSTOM',
    ]),
  })
  .refine(
    (values) => !values.startDate || !values.endDate || values.endDate >= values.startDate,
    {
      message: 'La fecha fin no puede ser anterior a la fecha inicio',
      path: ['endDate'],
    },
  );

export type PayrollPeriodFormValues = z.infer<typeof payrollPeriodFormSchema>;
