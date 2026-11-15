import { describe, expect, it } from 'vitest';
import {
  generateLocationsFormSchema,
  storageLocationFormSchema,
} from '@/shared/validation/storage-location';
import { warehouseFormSchema } from '@/shared/validation/warehouse';

describe('storage location validation', () => {
  it('accepts a valid location without a manual code', () => {
    const result = storageLocationFormSchema.safeParse({
      parentId: '',
      type: 'AISLE',
      name: '',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown type', () => {
    const result = storageLocationFormSchema.safeParse({
      parentId: '',
      type: 'ROOM',
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts positive counts in the generator', () => {
    const result = generateLocationsFormSchema.safeParse({
      aisles: 2,
      shelves: 3,
      levels: 4,
      bins: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero counts in the generator', () => {
    const result = generateLocationsFormSchema.safeParse({
      aisles: 1,
      shelves: 0,
      levels: 1,
      bins: 1,
    });
    expect(result.success).toBe(false);
  });

  it('counts every hierarchy node, not just bins, toward the generation limit', () => {
    // 5,000 bins but 10,110 total nodes.
    expect(generateLocationsFormSchema.safeParse({ aisles: 10, shelves: 10, levels: 50 / 1, bins: 1 }).success).toBe(false);
    // Valid individual limits: 4,000 bins, 6,420 nodes.
    expect(generateLocationsFormSchema.safeParse({ aisles: 20, shelves: 20, levels: 5, bins: 2 }).success).toBe(false);
  });

  it('rejects a generation above the total limit', () => {
    const result = generateLocationsFormSchema.safeParse({
      aisles: 20,
      shelves: 50,
      levels: 20,
      bins: 50,
    });
    expect(result.success).toBe(false);
  });
});

describe('warehouse validation', () => {
  it('requires a name', () => {
    expect(warehouseFormSchema.safeParse({ name: '  ', code: '', branchId: '' }).success).toBe(false);
  });

  it('accepts a name with optional fields empty', () => {
    expect(warehouseFormSchema.safeParse({ name: 'Main', code: '', branchId: '' }).success).toBe(true);
  });
});
