import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { MinioStorageService } from '../../reports/infrastructure/minio-storage.service';

const logoFileSelect = {
  id: true,
  originalName: true,
  storageKey: true,
  mimeType: true,
} as const;

@Injectable()
export class ProductBrandService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MinioStorageService,
  ) {}

  async create(data: { tenantId: string; name: string; logoFileId?: string }) {
    const name = data.name.trim();
    await this.assertLogoFile(data.tenantId, data.logoFileId);
    try {
      const brand = await this.prisma.productBrand.create({
        data: { tenantId: data.tenantId, name, logoFileId: data.logoFileId ?? null },
        include: { logoFile: { select: logoFileSelect } },
      });
      return this.withLogoUrl(data.tenantId, brand);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('A brand with this name already exists');
      throw error;
    }
  }

  async findAll(tenantId: string, isActive?: boolean) {
    const brands = await this.prisma.productBrand.findMany({
      where: { tenantId, ...(isActive === undefined ? {} : { isActive }) },
      include: { logoFile: { select: logoFileSelect } },
      orderBy: { name: 'asc' },
    });
    return Promise.all(brands.map((brand) => this.withLogoUrl(tenantId, brand)));
  }

  async findById(tenantId: string, id: string) {
    const brand = await this.prisma.productBrand.findFirst({
      where: { tenantId, id },
      include: { logoFile: { select: logoFileSelect } },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return this.withLogoUrl(tenantId, brand);
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string; logoFileId?: string | null; isActive?: boolean },
  ) {
    await this.findById(tenantId, id);
    if (data.logoFileId !== undefined) await this.assertLogoFile(tenantId, data.logoFileId);
    try {
      const brand = await this.prisma.productBrand.update({
        where: { id },
        data: {
          ...(data.name === undefined ? {} : { name: data.name.trim() }),
          ...(data.logoFileId === undefined ? {} : { logoFileId: data.logoFileId }),
          ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
        },
        include: { logoFile: { select: logoFileSelect } },
      });
      return this.withLogoUrl(tenantId, brand);
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('A brand with this name already exists');
      throw error;
    }
  }

  async deactivate(tenantId: string, id: string) {
    await this.findById(tenantId, id);
    return this.prisma.productBrand.update({ where: { id }, data: { isActive: false } });
  }

  private async assertLogoFile(tenantId: string, logoFileId?: string | null) {
    if (!logoFileId) return;
    const file = await this.prisma.file.findFirst({
      where: { id: logoFileId, tenantId, deletedAt: null },
      select: { mimeType: true },
    });
    if (!file) throw new NotFoundException('Logo file not found');
    if (!file.mimeType.startsWith('image/')) throw new ConflictException('Brand logo must be an image');
  }

  private async withLogoUrl<T extends { logoFile: { storageKey: string } | null }>(tenantId: string, brand: T) {
    return {
      ...brand,
      logoUrl: brand.logoFile
        ? await this.storage.getSignedUrl(tenantId, brand.logoFile.storageKey)
        : null,
    };
  }
}
