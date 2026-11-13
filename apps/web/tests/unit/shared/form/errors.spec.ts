import { describe, expect, it } from 'vitest';
import { fieldErrorMessages } from '@/shared/form/errors';

describe('fieldErrorMessages', () => {
  it('returns an empty list for missing or empty errors', () => {
    expect(fieldErrorMessages(undefined)).toEqual([]);
    expect(fieldErrorMessages([])).toEqual([]);
  });

  it('keeps string errors and extracts messages from objects', () => {
    expect(
      fieldErrorMessages([
        'Requerido',
        { message: 'Debe ser mayor que cero' },
        { message: undefined },
        '',
      ]),
    ).toEqual(['Requerido', 'Debe ser mayor que cero']);
  });
});
