import { z } from 'zod';

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().pipe(z.email('El correo no es válido')),
]);

export const clientFormSchema = z.object({
  legalName: z.string().trim().min(1, 'La razón social es obligatoria'),
  documentId: z.string().trim().min(1, 'El documento es obligatorio'),
  identificationType: z.string(),
  firstName: z.string(),
  middleName: z.string(),
  lastName: z.string(),
  secondLastName: z.string(),
  taxId: z.string(),
  email: optionalEmail,
  phone: z.string(),
  address: z.object({
    country: z.string(),
    state: z.string(),
    city: z.string(),
    addressLine: z.string(),
    reference: z.string(),
  }),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
