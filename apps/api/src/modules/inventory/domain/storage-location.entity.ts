export type StorageLocationType = 'AISLE' | 'SHELF' | 'LEVEL' | 'BIN';

const PARENT_TYPE: Record<Exclude<StorageLocationType, 'AISLE'>, StorageLocationType> = {
  SHELF: 'AISLE',
  LEVEL: 'SHELF',
  BIN: 'LEVEL',
};

export class StorageLocation {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly warehouseId: string,
    public readonly parentId: string | null,
    public readonly type: StorageLocationType,
    public readonly code: string,
    public readonly name: string | null,
    public readonly path: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static assertValidParent(
    type: StorageLocationType,
    parentType: StorageLocationType | null,
  ): void {
    if (type === 'AISLE') {
      if (parentType !== null) {
        throw new Error('Un pasillo (AISLE) no puede tener padre');
      }
      return;
    }
    const expected = PARENT_TYPE[type];
    if (parentType !== expected) {
      throw new Error(`${type} requiere un padre de tipo ${expected}`);
    }
  }

  static buildPath(parentPath: string | null, code: string): string {
    const normalized = code.trim();
    if (!normalized) {
      throw new Error('El código de ubicación es obligatorio');
    }
    return parentPath ? `${parentPath}/${normalized}` : normalized;
  }

  static alphabeticCode(index: number): string {
    let value = index + 1;
    let code = '';
    while (value > 0) {
      const remainder = (value - 1) % 26;
      code = String.fromCharCode(65 + remainder) + code;
      value = Math.floor((value - 1) / 26);
    }
    return code;
  }

  static numericCode(index: number, width = 0): string {
    return String(index + 1).padStart(width, '0');
  }

  static codeForIndex(type: StorageLocationType, index: number): string {
    return type === 'AISLE'
      ? StorageLocation.alphabeticCode(index)
      : StorageLocation.numericCode(index, type === 'BIN' ? 2 : 0);
  }

  static nextCode(type: StorageLocationType, siblingCodes: string[]): string {
    const normalized = siblingCodes.map((code) => code.trim()).filter(Boolean);

    if (type === 'AISLE') {
      const taken = new Set(normalized);
      for (let index = 0; ; index += 1) {
        const candidate = StorageLocation.alphabeticCode(index);
        if (!taken.has(candidate)) return candidate;
      }
    }

    const takenNumbers = new Set(
      normalized.filter((code) => /^\d+$/.test(code)).map((code) => Number(code)),
    );
    for (let value = 1; ; value += 1) {
      if (!takenNumbers.has(value)) {
        return StorageLocation.numericCode(value - 1, type === 'BIN' ? 2 : 0);
      }
    }
  }
}
