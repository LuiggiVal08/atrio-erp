import { StorageLocation } from '../../../src/modules/inventory/domain/storage-location.entity';

describe('StorageLocation', () => {
  describe('assertValidParent', () => {
    it('allows a root AISLE', () => {
      expect(() => StorageLocation.assertValidParent('AISLE', null)).not.toThrow();
    });

    it('rejects an AISLE with a parent', () => {
      expect(() => StorageLocation.assertValidParent('AISLE', 'AISLE')).toThrow();
    });

    it.each([
      ['SHELF', 'AISLE'],
      ['LEVEL', 'SHELF'],
      ['BIN', 'LEVEL'],
    ] as const)('allows %s under %s', (type, parent) => {
      expect(() => StorageLocation.assertValidParent(type, parent)).not.toThrow();
    });

    it('rejects a BIN directly under an AISLE', () => {
      expect(() => StorageLocation.assertValidParent('BIN', 'AISLE')).toThrow();
    });

    it('rejects a SHELF without a parent', () => {
      expect(() => StorageLocation.assertValidParent('SHELF', null)).toThrow();
    });
  });

  describe('buildPath', () => {
    it('builds a root path', () => {
      expect(StorageLocation.buildPath(null, 'A')).toBe('A');
    });

    it('builds a nested path', () => {
      expect(StorageLocation.buildPath('A/1', '2')).toBe('A/1/2');
    });

    it('trims the code', () => {
      expect(StorageLocation.buildPath(null, '  A  ')).toBe('A');
    });

    it('rejects an empty code', () => {
      expect(() => StorageLocation.buildPath(null, '   ')).toThrow();
    });
  });
});

describe('storage location code generation', () => {
  it('generates alphabetic aisle codes', () => {
    expect(StorageLocation.alphabeticCode(0)).toBe('A');
    expect(StorageLocation.alphabeticCode(25)).toBe('Z');
    expect(StorageLocation.alphabeticCode(26)).toBe('AA');
    expect(StorageLocation.alphabeticCode(27)).toBe('AB');
  });

  it('generates numeric codes with optional padding', () => {
    expect(StorageLocation.numericCode(0)).toBe('1');
    expect(StorageLocation.numericCode(9)).toBe('10');
    expect(StorageLocation.numericCode(0, 2)).toBe('01');
  });

  it('uses alphabetic codes for aisles and numeric codes for the rest', () => {
    expect(StorageLocation.codeForIndex('AISLE', 2)).toBe('C');
    expect(StorageLocation.codeForIndex('SHELF', 2)).toBe('3');
    expect(StorageLocation.codeForIndex('LEVEL', 2)).toBe('3');
    expect(StorageLocation.codeForIndex('BIN', 2)).toBe('03');
  });

  it('returns the first free alphabetic sibling code', () => {
    expect(StorageLocation.nextCode('AISLE', ['A', 'B'])).toBe('C');
    expect(StorageLocation.nextCode('AISLE', ['A', 'C'])).toBe('B');
  });

  it('returns the first free numeric sibling code ignoring padding', () => {
    expect(StorageLocation.nextCode('SHELF', ['1', '2'])).toBe('3');
    expect(StorageLocation.nextCode('BIN', ['01', '02'])).toBe('03');
    expect(StorageLocation.nextCode('BIN', ['1'])).toBe('02');
  });
});
