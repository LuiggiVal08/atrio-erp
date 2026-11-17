import { z } from 'zod';

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().pipe(z.email('Ingresa un correo válido (ej. ventas@proveedor.com).')),
]);

export const fichaTerceroFormSchema = z
  .object({
    legalName: z.string().trim().min(1, 'La razón social es obligatoria'),
    documentId: z.string(),
    identificationType: z.string(),
    taxId: z.string(),
    email: optionalEmail,
    phone: z.string(),
    commercialName: z.string(),
    website: z.string(),
    paymentTerms: z.string(),
    deliveryDays: z.number().min(0, 'Los días de entrega no pueden ser negativos').optional(),
    notes: z.string(),
    categoryIds: z.array(z.string()),
    address: z.object({
      country: z.string(),
      state: z.string(),
      city: z.string(),
      addressLine: z.string(),
      reference: z.string(),
    }),
  })
  .superRefine((value, ctx) => {
    if (!value.address.addressLine.trim()) return;
    for (const key of ['country', 'state', 'city'] as const) {
      if (!value.address[key].trim()) {
        ctx.addIssue({
          code: 'custom',
          path: ['address', key],
          message: 'Completa la dirección: ciudad, estado y país son obligatorios',
        });
      }
    }
  });

export type FichaTerceroFormValues = z.infer<typeof fichaTerceroFormSchema>;
