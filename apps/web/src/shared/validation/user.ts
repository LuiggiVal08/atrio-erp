import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().pipe(z.email('El correo no es válido')),
  password: z.string().trim().min(1, 'La contraseña es obligatoria'),
  phone: z.string(),
  roleIds: z.array(z.string()),
});

export const userEditFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z.string().trim().pipe(z.email('El correo no es válido')),
  password: z.string(),
  phone: z.string(),
  roleIds: z.array(z.string()),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
