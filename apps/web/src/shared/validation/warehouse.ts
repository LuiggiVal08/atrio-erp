import { z } from 'zod';

export const warehouseFormSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  code: z.string(),
  branchId: z.string(),
  aisle: z.string(),
  shelf: z.string(),
  level: z.string(),
  bin: z.string(),
});

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>;
