import { describe, expect, it } from 'vitest';
import { branchFormSchema } from '@/shared/validation/branch';

const base = {
  name: 'Sucursal Centro',
  code: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  managerEmployeeId: '',
};

describe('branch validation', () => {
  it('accepts a name with optional fields empty', () => {
    expect(branchFormSchema.safeParse(base).success).toBe(true);
  });

  it('requires a non-empty name', () => {
    expect(branchFormSchema.safeParse({ ...base, name: '   ' }).success).toBe(false);
  });

  it('rejects names longer than 120 characters', () => {
    expect(branchFormSchema.safeParse({ ...base, name: 'a'.repeat(121) }).success).toBe(false);
  });

  it('accepts alphanumeric codes with dashes', () => {
    expect(branchFormSchema.safeParse({ ...base, code: 'SUC-CENTRO-01' }).success).toBe(true);
  });

  it('rejects codes with spaces or symbols', () => {
    expect(branchFormSchema.safeParse({ ...base, code: 'SUC CENTRO' }).success).toBe(false);
    expect(branchFormSchema.safeParse({ ...base, code: 'SUC_CENTRO' }).success).toBe(false);
  });

  it('rejects codes longer than 20 characters', () => {
    expect(branchFormSchema.safeParse({ ...base, code: 'A'.repeat(21) }).success).toBe(false);
  });

  it('rejects city and state longer than 100 characters', () => {
    expect(branchFormSchema.safeParse({ ...base, city: 'a'.repeat(101) }).success).toBe(false);
    expect(branchFormSchema.safeParse({ ...base, state: 'a'.repeat(101) }).success).toBe(false);
  });

  it('accepts a UUID manager or an empty value', () => {
    expect(
      branchFormSchema.safeParse({
        ...base,
        managerEmployeeId: '0190f2f4-3c4d-7abc-8def-0123456789ab',
      }).success,
    ).toBe(true);
    expect(branchFormSchema.safeParse({ ...base, managerEmployeeId: '' }).success).toBe(true);
  });
});
