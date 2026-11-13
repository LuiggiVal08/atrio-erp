import { z } from 'zod';

export const currencyRateFormSchema = z
  .object({
    fromCurrency: z.string().min(1, 'La moneda de origen es obligatoria'),
    toCurrency: z.string().min(1, 'La moneda de destino es obligatoria'),
    rate: z.custom<number | undefined>(
      (value) => typeof value === 'number' && Number.isFinite(value) && value > 0,
      'La tasa debe ser mayor que cero',
    ),
    date: z.string().min(1, 'La fecha es obligatoria'),
  })
  .refine((value) => value.fromCurrency !== value.toCurrency, {
    message: 'Selecciona dos monedas diferentes.',
    path: ['toCurrency'],
  });

export type CurrencyRateFormValues = z.infer<typeof currencyRateFormSchema>;
