import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors, NotFoundException } from '@nestjs/common';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';
import * as crypto from 'crypto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { MinioStorageService } from '../../reports/infrastructure/minio-storage.service';

const logoFileSelect = {
  id: true,
  originalName: true,
  storageKey: true,
  mimeType: true,
} as const;

@ApiTags('Inventory')
@Controller('inventory/brands')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('inventory')
export class ProductBrandImageController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MinioStorageService,
  ) {}

  @Post(':id/logo')
  @RequirePermission('inventory:brand:update')
  @ApiOperation({ summary: 'Upload brand logo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('logo', {
    storage: memoryStorage(),
    fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith('image/')),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: { id: string; tenantId: string }) {
    if (!file) throw new BadRequestException('No logo provided');
    const brand = await this.prisma.productBrand.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!brand) throw new NotFoundException('Brand not found');

    const filename = `${uuid()}${extname(file.originalname)}`;
    const storageKey = `brands/${filename}`;
    await this.storage.uploadAsset(user.tenantId, storageKey, file.buffer, { 'Content-Type': file.mimetype });
    const record = await this.prisma.file.create({
      data: {
        tenantId: user.tenantId,
        originalName: file.originalname,
        storageKey,
        mimeType: file.mimetype,
        sizeBytes: BigInt(file.size),
        checksumSha256: crypto.createHash('sha256').update(file.buffer).digest('hex'),
        uploadedById: user.id,
      },
    });
    return this.prisma.productBrand.update({
      where: { id },
      data: { logoFileId: record.id },
      include: { logoFile: { select: logoFileSelect } },
    });
  }

  @Get(':id/logo')
  @RequirePermission('inventory:brand:read')
  @ApiOperation({ summary: 'Get brand logo' })
  async getLogo(
    @Param('id') id: string,
    @CurrentUser() user: { tenantId: string },
    @Res() response: any,
  ) {
    const brand = await this.prisma.productBrand.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { logoFile: { select: { storageKey: true, mimeType: true } } },
    });
    if (!brand?.logoFile) throw new NotFoundException('Brand logo not found');
    const stream = await this.storage.getAsset(user.tenantId, brand.logoFile.storageKey);
    response.type(brand.logoFile.mimeType);
    stream.pipe(response);
  }
}
