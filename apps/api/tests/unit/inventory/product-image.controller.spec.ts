import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { ProductImageController } from '../../../src/modules/inventory/infrastructure/product-image.controller';

function makeContext() {
  const prisma: any = {
    product: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', tenantId: 't1' }) },
    productFile: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    file: { create: jest.fn() },
    $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const storage: any = {
    uploadAsset: jest.fn().mockResolvedValue(undefined),
    getSignedUrl: jest.fn(async (_tenant: string, key: string) => `signed:${key}`),
    deleteAsset: jest.fn().mockResolvedValue(undefined),
  };
  return { prisma, storage, controller: new ProductImageController(prisma, storage) };
}

function file(name: string, content = 'image'): Express.Multer.File {
  const buffer = Buffer.from(content);
  return {
    originalname: name,
    mimetype: 'image/png',
    size: buffer.length,
    buffer,
  } as Express.Multer.File;
}

describe('ProductImageController.uploadImages', () => {
  it('uploads each distinct file and persists records in one transaction', async () => {
    const { prisma, storage, controller } = makeContext();
    prisma.file.create.mockImplementation(({ data }: any) => Promise.resolve({ id: data.storageKey, originalName: data.originalName, storageKey: data.storageKey }));

    const result = await controller.uploadImages('p1', [file('a.png')], { id: 'u1', tenantId: 't1' });

    expect(storage.uploadAsset).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0].originalName).toBe('a.png');
  });

  it('reuses an existing image with the same checksum instead of uploading it again', async () => {
    const { prisma, storage, controller } = makeContext();
    const existingFile = {
      id: 'f-existing', originalName: 'a.png', storageKey: 'products/existing.png',
      checksumSha256: crypto.createHash('sha256').update(Buffer.from('image')).digest('hex'),
    };
    prisma.productFile.findMany.mockResolvedValue([{ file: existingFile }]);
    prisma.productFile.count.mockResolvedValue(1);

    const result = await controller.uploadImages('p1', [file('a.png', 'image')], { id: 'u1', tenantId: 't1' });

    expect(storage.uploadAsset).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(result).toEqual([{ id: 'f-existing', url: 'signed:products/existing.png', originalName: 'a.png' }]);
  });

  it('removes uploaded objects when the database transaction fails', async () => {
    const { prisma, storage, controller } = makeContext();
    prisma.file.create.mockRejectedValue(new Error('db down'));

    await expect(controller.uploadImages('p1', [file('a.png', 'one'), file('b.png', 'two')], { id: 'u1', tenantId: 't1' }))
      .rejects.toThrow('db down');

    expect(storage.deleteAsset).toHaveBeenCalledTimes(2);
  });

  it('rejects uploads that exceed the product image limit before storing anything', async () => {
    const { prisma, storage, controller } = makeContext();
    prisma.productFile.count.mockResolvedValue(3);

    await expect(controller.uploadImages('p1', [file('a.png')], { id: 'u1', tenantId: 't1' }))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(storage.uploadAsset).not.toHaveBeenCalled();
  });
});
