import { z } from 'zod';

export const VENDOR_EMAIL_ERROR_MESSAGE =
  'Ingresa un correo válido (ej. ventas@proveedor.com).';

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().pipe(z.email(VENDOR_EMAIL_ERROR_MESSAGE)),
]);

export const vendorFormSchema = z.object({
  legalName: z.string().trim().min(1, 'La razón social es obligatoria'),
  documentId: z.string().trim().min(1, 'El RIF / NIT es obligatorio'),
  identificationType: z.string(),
  ownerIdentificationType: z.string(),
  ownerIdentificationNumber: z.string(),
  firstName: z.string(),
  middleName: z.string(),
  lastName: z.string(),
  secondLastName: z.string(),
  email: optionalEmail,
  phone: z.string(),
  address: z.object({
    country: z.string(),
    state: z.string(),
    city: z.string(),
    addressLine: z.string(),
    reference: z.string(),
  }),
  commercialName: z.string(),
  website: z.string(),
  notes: z.string(),
  paymentTerms: z.string(),
  categoryIds: z.array(z.string()),
  deliveryDays: z.number().min(0, 'Los días de entrega no pueden ser negativos').optional(),
});

export type VendorFormValues = z.infer<typeof vendorFormSchema>;
