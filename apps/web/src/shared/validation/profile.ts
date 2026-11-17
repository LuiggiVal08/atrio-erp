import { z } from 'zod';

const securityAnswerSchema = z.object({
  position: z.number().int().min(1),
  question: z.string().trim().min(1, 'Selecciona una pregunta'),
  answer: z.string().trim().min(2, 'La respuesta debe tener al menos 2 caracteres'),
});

export const profileInfoSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  locale: z.string(),
  phone: z.string(),
  employeeId: z.string().nullable(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
    newPassword: z.string().min(8, 'La contraseña nueva debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma la contraseña nueva'),
  })
  .superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'La confirmación de contraseña no coincide',
      });
    }
  });

export const securityQuestionsSchema = z
  .object({
    answers: z.array(securityAnswerSchema).length(3),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.answers.forEach((entry, index) => {
      if (!entry.question) return;
      if (seen.has(entry.question)) {
        ctx.addIssue({
          code: 'custom',
          path: ['answers', index, 'question'],
          message: 'Selecciona tres preguntas diferentes',
        });
        return;
      }
      seen.add(entry.question);
    });
  });

export type ProfileInfoValues = z.infer<typeof profileInfoSchema>;
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
export type SecurityQuestionsValues = z.infer<typeof securityQuestionsSchema>;
