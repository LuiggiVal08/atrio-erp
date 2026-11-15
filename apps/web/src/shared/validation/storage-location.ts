import { z } from 'zod';

export const STORAGE_LOCATION_TYPES = ['AISLE', 'SHELF', 'LEVEL', 'BIN'] as const;
export type StorageLocationType = (typeof STORAGE_LOCATION_TYPES)[number];

export const GENERATE_LOCATION_LIMITS = {
  aisles: 20,
  shelves: 50,
  levels: 20,
  bins: 50,
  total: 5000,
} as const;

export const storageLocationFormSchema = z.object({
  parentId: z.string(),
  type: z.enum(STORAGE_LOCATION_TYPES),
  name: z.string(),
});

export type StorageLocationFormValues = z.infer<typeof storageLocationFormSchema>;

export const generateLocationsFormSchema = z
  .object({
    aisles: z
      .number({ error: 'Indica cuántos pasillos' })
      .int('Debe ser un número entero')
      .min(1, 'Indica al menos un pasillo')
      .max(GENERATE_LOCATION_LIMITS.aisles, `Máximo ${GENERATE_LOCATION_LIMITS.aisles} pasillos`),
    shelves: z
      .number({ error: 'Indica cuántos estantes por pasillo' })
      .int('Debe ser un número entero')
      .min(1, 'Indica al menos un estante')
      .max(GENERATE_LOCATION_LIMITS.shelves, `Máximo ${GENERATE_LOCATION_LIMITS.shelves} estantes`),
    levels: z
      .number({ error: 'Indica cuántos niveles por estante' })
      .int('Debe ser un número entero')
      .min(1, 'Indica al menos un nivel')
      .max(GENERATE_LOCATION_LIMITS.levels, `Máximo ${GENERATE_LOCATION_LIMITS.levels} niveles`),
    bins: z
      .number({ error: 'Indica cuántos bins por nivel' })
      .int('Debe ser un número entero')
      .min(1, 'Indica al menos un bin')
      .max(GENERATE_LOCATION_LIMITS.bins, `Máximo ${GENERATE_LOCATION_LIMITS.bins} bins`),
  })
  .superRefine((value, ctx) => {
    const total = value.aisles * (1 + value.shelves * (1 + value.levels * (1 + value.bins)));
    if (total > GENERATE_LOCATION_LIMITS.total) {
      ctx.addIssue({
        code: 'custom',
        path: ['aisles'],
        message: `No se pueden generar más de ${GENERATE_LOCATION_LIMITS.total} ubicaciones a la vez`,
      });
    }
  });

export type GenerateLocationsFormValues = z.infer<typeof generateLocationsFormSchema>;
