import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductBrandService } from '../../../src/modules/inventory/application/product-brand.service';

describe('ProductBrandService', () => {
  const prisma = {
    file: { findFirst: jest.fn() },
    productBrand: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: ProductBrandService;
  const storage = { getSignedUrl: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    storage.getSignedUrl.mockResolvedValue('https://minio.test/logo');
    service = new ProductBrandService(prisma as never, storage as never);
  });

  it('creates a brand without a logo', async () => {
    prisma.productBrand.create.mockResolvedValue({ id: 'brand-1', name: 'Acme' });

    await service.create({ tenantId: 'tenant-1', name: ' Acme ' });

    expect(prisma.productBrand.create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', name: 'Acme', logoFileId: null },
      include: {
        logoFile: {
          select: { id: true, originalName: true, storageKey: true, mimeType: true },
        },
      },
    });
  });

  it('requires an image owned by the tenant for the logo', async () => {
    prisma.file.findFirst.mockResolvedValue(null);

    await expect(service.create({
      tenantId: 'tenant-1',
      name: 'Acme',
      logoFileId: 'file-1',
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.productBrand.create).not.toHaveBeenCalled();
  });

  it('rejects non-image logos', async () => {
    prisma.file.findFirst.mockResolvedValue({ mimeType: 'application/pdf' });

    await expect(service.create({
      tenantId: 'tenant-1',
      name: 'Acme',
      logoFileId: 'file-1',
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps duplicate names to a conflict', async () => {
    prisma.productBrand.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.create({ tenantId: 'tenant-1', name: 'Acme' }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates instead of deleting a brand', async () => {
    prisma.productBrand.findFirst.mockResolvedValue({ id: 'brand-1', tenantId: 'tenant-1' });
    prisma.productBrand.update.mockResolvedValue({ id: 'brand-1', isActive: false });

    await service.deactivate('tenant-1', 'brand-1');

    expect(prisma.productBrand.update).toHaveBeenCalledWith({
      where: { id: 'brand-1' },
      data: { isActive: false },
    });
  });
});
