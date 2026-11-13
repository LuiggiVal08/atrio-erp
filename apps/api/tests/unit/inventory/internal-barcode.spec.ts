import { buildInternalEan13, ean13CheckDigit } from '../../../src/modules/inventory/domain/internal-barcode';

describe('ean13CheckDigit', () => {
  it.each([
    ['400638133393', '1'],
    ['590123412345', '7'],
    ['200000000001', '5'],
  ])('computes the mod-10 check digit for %s', (first12, expected) => {
    expect(ean13CheckDigit(first12)).toBe(expected);
  });
});

describe('buildInternalEan13', () => {
  it.each([
    [1, '2000000000015'],
    [12, '2000000000121'],
    [123456789, '2001234567893'],
    [999999999, '2009999999997'],
  ])('builds a valid internal EAN-13 for sequence %i', (sequence, expected) => {
    expect(buildInternalEan13(sequence)).toBe(expected);
  });

  it('always produces 13 digits with the reserved internal prefix 200', () => {
    for (const sequence of [1, 42, 1000, 999999, 500000000]) {
      const code = buildInternalEan13(sequence);
      expect(code).toMatch(/^200\d{10}$/);
      expect(ean13CheckDigit(code.slice(0, 12))).toBe(code[12]);
    }
  });

  it.each([0, -1, 1000000000, 1.5, NaN])('rejects out-of-range sequence %p', (sequence) => {
    expect(() => buildInternalEan13(sequence)).toThrow();
  });
});