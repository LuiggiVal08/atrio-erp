import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { PrismaInventoryRepository } from '../../../src/modules/inventory/infrastructure/prisma-inventory.repository';

const record = {
  id: 'product-1',
  tenantId: 'tenant-1',
  sku: 'SKU-001',
  name: 'Taladro percutor',
  description: null,
  categoryId: 'cat-1',
  unitPrice: 25,
  costPrice: 10,
  taxId: 'tax-1',
  isService: false,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-02T00:00:00Z'),
  deletedAt: null,
  barcode: null,
  brandId: 'brand-1',
  baseUnit: 'unidad',
  purchaseUnit: 'caja',
  conversionFactor: 4,
  minStock: 2,
  maxStock: 50,
  reorderPoint: 5,
  supplierSku: 'TR-500',
  imageUrl: 'https://cdn.example.com/product-1.jpg',
  brand: { name: 'Truper' },
  category: { name: 'Herramientas' },
  tax: { name: 'IVA' },
};

const include = {
  brand: { select: { name: true } },
  category: { select: { name: true } },
  tax: { select: { name: true } },
};

function barcodeConflict() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`barcode`)', {
    code: 'P2002', clientVersion: 'test', meta: { target: ['barcode'] },
  });
}

function skuConflict() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`tenantId`,`sku`)', {
    code: 'P2002', clientVersion: 'test', meta: { target: ['tenantId', 'sku'] },
  });
}

function sequenceExhausted() {
  return new Prisma.PrismaClientKnownRequestError('Raw query failed', {
    code: 'P2010', clientVersion: 'test', meta: { code: '2200H', message: 'nextval: reached maximum value of sequence' },
  });
}

function createRepository(found = true) {
  let stored: (Omit<typeof record, 'barcode'> & { barcode: string | null }) | null = found ? { ...record } : null;
  const prisma = {
    product: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        if (!stored || (where.tenantId && where.tenantId !== stored.tenantId)) return null;
        return { ...stored };
      }),
      create: jest.fn().mockImplementation(async ({ data }) => ({ ...record, ...data })),
      update: jest.fn().mockImplementation(async ({ data }) => {
        if (!stored) return null;
        stored = { ...stored, ...data };
        return { ...stored };
      }),
      updateMany: jest.fn().mockImplementation(async ({ where, data }) => {
        if (!stored || where.tenantId !== stored.tenantId || where.barcode !== stored.barcode) return { count: 0 };
        stored = { ...stored, ...data };
        return { count: 1 };
      }),
    },
    productCostHistory: {
      create: jest.fn().mockResolvedValue({}),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ nextval: 1n }]),
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  (prisma.$transaction as jest.Mock).mockImplementation((operation) => operation(prisma));
  return { repository: new PrismaInventoryRepository(prisma), prisma };
}

describe('PrismaInventoryRepository findProductById', () => {
  it('finds product by id with brand/category/tax included', async () => {
    const { repository, prisma } = createRepository();

    const product = await repository.findProductById('product-1', 'tenant-1');

    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: { id: 'product-1', tenantId: 'tenant-1', deletedAt: null },
      include,
    });
    expect(product).toMatchObject({
      id: 'product-1', sku: 'SKU-001', name: 'Taladro percutor',
      brand: 'Truper', category: 'Herramientas', taxName: 'IVA',
      imageUrl: 'https://cdn.example.com/product-1.jpg',
    });
  });

  it('returns null for missing or soft-deleted products', async () => {
    const { repository } = createRepository(false);
    await expect(repository.findProductById('missing', 'tenant-1')).resolves.toBeNull();
  });
});

describe('PrismaInventoryRepository updateProduct', () => {
  it('returns the same extended shape as findProductById', async () => {
    const { repository, prisma } = createRepository();

    const product = await repository.updateProduct('product-1', { minStock: 7, brandId: null }, 'tenant-1');

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'product-1', tenantId: 'tenant-1' },
      data: { minStock: 7, brandId: null },
      include,
    });
    expect(product).toMatchObject({
      id: 'product-1', brand: 'Truper', category: 'Herramientas',
      imageUrl: 'https://cdn.example.com/product-1.jpg',
    });
  });

  it('records cost history only when costPrice is sent', async () => {
    const { repository, prisma } = createRepository();

    await repository.updateProduct('product-1', { name: 'Otro nombre' }, 'tenant-1');
    expect(prisma.productCostHistory.create).not.toHaveBeenCalled();

    await repository.updateProduct('product-1', { costPrice: 12 }, 'tenant-1');
    expect(prisma.productCostHistory.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', productId: 'product-1', unitCost: 12, supplierId: null, createdById: null },
    });
  });
});

describe('PrismaInventoryRepository createProduct', () => {
  const newProduct = {
    tenantId: 'tenant-1', sku: 'SKU-001', name: 'Taladro percutor',
    unitPrice: 25, costPrice: 10, isService: false,
  };

  it('persists the supplied barcode and never touches the sequence', async () => {
    const { repository, prisma } = createRepository();
    (prisma.product.create as jest.Mock).mockResolvedValue({ ...record, barcode: '7501234567890' });

    const product = await repository.createProduct({ ...newProduct, barcode: '7501234567890' });

    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ barcode: '7501234567890' }),
    }));
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(product.barcode).toBe('7501234567890');
  });

  it('auto-generates an internal EAN-13 from the sequence when none is provided', async () => {
    const { repository, prisma } = createRepository();

    const product = await repository.createProduct(newProduct);

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ barcode: '2000000000015' }),
    }));
    expect(product.barcode).toBe('2000000000015');
  });

  it('treats a blank/whitespace barcode as missing and generates one', async () => {
    const { repository, prisma } = createRepository();

    await repository.createProduct({ ...newProduct, barcode: '   ' });

    expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ barcode: '2000000000015' }),
    }));
  });

  it('retries with a fresh sequence value on a barcode collision', async () => {
    const { repository, prisma } = createRepository();
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([{ nextval: 1n }])
      .mockResolvedValueOnce([{ nextval: 2n }]);
    (prisma.product.create as jest.Mock)
      .mockRejectedValueOnce(barcodeConflict())
      .mockImplementation(async ({ data }) => ({ ...record, ...data }));

    const product = await repository.createProduct(newProduct);

    expect(prisma.product.create).toHaveBeenCalledTimes(2);
    expect(product.barcode).toBe('2000000000022');
  });

  it('does not retry when the caller supplied the barcode', async () => {
    const { repository, prisma } = createRepository();
    (prisma.product.create as jest.Mock).mockRejectedValueOnce(barcodeConflict());

    await expect(repository.createProduct({ ...newProduct, barcode: '7501234567890' }))
      .rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  it('does not retry on a SKU collision', async () => {
    const { repository, prisma } = createRepository();
    const error = skuConflict();
    (prisma.product.create as jest.Mock).mockRejectedValueOnce(error);

    await expect(repository.createProduct(newProduct)).rejects.toBe(error);
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  it('gives up after 10 barcode-collision attempts', async () => {
    const { repository, prisma } = createRepository();
    (prisma.product.create as jest.Mock).mockRejectedValue(barcodeConflict());

    await expect(repository.createProduct(newProduct))
      .rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect(prisma.product.create).toHaveBeenCalledTimes(10);
  });

  it('maps sequence exhaustion to a conflict on create', async () => {
    const { repository, prisma } = createRepository();
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(sequenceExhausted());

    await expect(repository.createProduct(newProduct)).rejects.toThrow('Internal barcode sequence exhausted');
  });

  it('records cost history when costPrice > 0', async () => {
    const { repository, prisma } = createRepository();

    await repository.createProduct(newProduct);

    expect(prisma.productCostHistory.create).toHaveBeenCalledTimes(1);
  });

  it('skips cost history when costPrice is 0', async () => {
    const { repository, prisma } = createRepository();

    await repository.createProduct({ ...newProduct, costPrice: 0 });

    expect(prisma.productCostHistory.create).not.toHaveBeenCalled();
  });
});

describe('PrismaInventoryRepository generateProductBarcode', () => {
  it('claims the barcode with a tenant-scoped conditional updateMany', async () => {
    const { repository, prisma } = createRepository();

    const product = await repository.generateProductBarcode('tenant-1', 'product-1');

    expect(prisma.product.updateMany).toHaveBeenCalledWith({
      where: { id: 'product-1', tenantId: 'tenant-1', deletedAt: null, barcode: null },
      data: { barcode: '2000000000015' },
    });
    expect(product.barcode).toBe('2000000000015');
  });

  it('leaves an existing barcode untouched and never allocates a sequence value', async () => {
    const { repository, prisma } = createRepository();
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ ...record, barcode: '7501234567890' });

    const product = await repository.generateProductBarcode('tenant-1', 'product-1');

    expect(prisma.product.updateMany).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
    expect(product.barcode).toBe('7501234567890');
  });

  it('converges to the same code under concurrent calls', async () => {
    const { repository } = createRepository();

    const [a, b] = await Promise.all([
      repository.generateProductBarcode('tenant-1', 'product-1'),
      repository.generateProductBarcode('tenant-1', 'product-1'),
    ]);

    expect(a.barcode).toBe('2000000000015');
    expect(b.barcode).toBe('2000000000015');
  });

  it('retries with a fresh sequence value on a barcode collision', async () => {
    const { repository, prisma } = createRepository();
    let storedBarcode: string | null = null;
    (prisma.product.findFirst as jest.Mock).mockImplementation(async () => ({ ...record, barcode: storedBarcode }));
    (prisma.product.updateMany as jest.Mock)
      .mockRejectedValueOnce(barcodeConflict())
      .mockImplementation(async ({ data }) => { storedBarcode = data.barcode; return { count: 1 }; });
    (prisma.$queryRaw as jest.Mock)
      .mockResolvedValueOnce([{ nextval: 1n }])
      .mockResolvedValueOnce([{ nextval: 2n }]);

    const product = await repository.generateProductBarcode('tenant-1', 'product-1');

    expect(prisma.product.updateMany).toHaveBeenCalledTimes(2);
    expect(product.barcode).toBe('2000000000022');
  });

  it('gives up after 10 barcode-collision attempts', async () => {
    const { repository, prisma } = createRepository();
    (prisma.product.findFirst as jest.Mock).mockResolvedValue({ ...record, barcode: null });
    (prisma.product.updateMany as jest.Mock).mockRejectedValue(barcodeConflict());

    await expect(repository.generateProductBarcode('tenant-1', 'product-1'))
      .rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    expect(prisma.product.updateMany).toHaveBeenCalledTimes(10);
  });

  it('rejects a cross-tenant request as not found', async () => {
    const { repository } = createRepository();
    await expect(repository.generateProductBarcode('other-tenant', 'product-1')).rejects.toThrow('Product not found');
  });

  it('rejects a missing product as not found', async () => {
    const { repository } = createRepository(false);
    await expect(repository.generateProductBarcode('tenant-1', 'missing')).rejects.toThrow('Product not found');
  });

  it('maps sequence exhaustion to a conflict', async () => {
    const { repository, prisma } = createRepository();
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(sequenceExhausted());

    await expect(repository.generateProductBarcode('tenant-1', 'product-1'))
      .rejects.toThrow('Internal barcode sequence exhausted');
  });
});