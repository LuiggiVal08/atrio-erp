import { Controller, Post, Get, Delete, Param, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
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
import * as fs from 'fs';

const UPLOAD_DIR = join(__dirname, '..', '..', '..', '..', 'uploads', 'products');
const MAX_PRODUCT_IMAGES = 3;

interface AuthUser {
  id: string;
  tenantId: string;
}

const imageFileFilter = (_req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
  if (!allowedExtensions.test(extname(file.originalname))) {
    return callback(new Error('Only image files (jpg, png, webp, gif) are allowed'), false);
  }
  callback(null, true);
};

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory/products')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('inventory')
export class ProductImageController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MinioStorageService,
  ) {}

  @Post(':id/image')
  @RequirePermission('inventory:product:update')
  @ApiOperation({ summary: 'Upload product image' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          fs.mkdirSync(UPLOAD_DIR, { recursive: true });
          callback(null, UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          const uniqueName = `${uuid()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');

    const imageUrl = `/uploads/products/${file.filename}`;
    await this.prisma.product.update({ where: { id }, data: { imageUrl } });

    return { imageUrl };
  }

  @Delete(':id/image')
  @RequirePermission('inventory:product:update')
  @ApiOperation({ summary: 'Delete product image' })
  async deleteImage(@Param('id') id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');

    if (product.imageUrl) {
      const filePath = join(UPLOAD_DIR, product.imageUrl.replace('/uploads/products/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.prisma.product.update({ where: { id }, data: { imageUrl: null } });

    return { imageUrl: null };
  }

  @Post(':id/images')
  @RequirePermission('inventory:product:update')
  @ApiOperation({ summary: 'Upload up to 3 product images' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FilesInterceptor('images', MAX_PRODUCT_IMAGES, {
      storage: memoryStorage(),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthUser,
  ) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId: user.tenantId, deletedAt: null } });
    if (!product) throw new NotFoundException('Product not found');
    if (!files?.length) throw new BadRequestException('No images provided');

    const prepared = files.map((file) => ({
      file,
      checksum: crypto.createHash('sha256').update(file.buffer).digest('hex'),
      storageKey: `products/${uuid()}${extname(file.originalname)}`,
    }));
    const unique = [...new Map(prepared.map((item) => [item.checksum, item])).values()];

    const existingLinks = await this.prisma.productFile.findMany({
      where: {
        productId: id,
        tenantId: user.tenantId,
        file: { deletedAt: null, checksumSha256: { in: unique.map((item) => item.checksum) } },
      },
      include: { file: true },
    });
    const existingByChecksum = new Map(existingLinks.map((link) => [link.file.checksumSha256, link.file]));
    const toUpload = unique.filter((item) => !existingByChecksum.has(item.checksum));

    const existingCount = await this.prisma.productFile.count({
      where: { productId: id, tenantId: user.tenantId, file: { deletedAt: null } },
    });
    if (existingCount + toUpload.length > MAX_PRODUCT_IMAGES) {
      throw new BadRequestException(`A product can have at most ${MAX_PRODUCT_IMAGES} images`);
    }

    const uploadedKeys: string[] = [];
    try {
      for (const item of toUpload) {
        await this.storage.uploadAsset(user.tenantId, item.storageKey, item.file.buffer, {
          'Content-Type': item.file.mimetype,
        });
        uploadedKeys.push(item.storageKey);
      }

      const records = toUpload.length
        ? await this.prisma.$transaction(
          toUpload.map((item) => this.prisma.file.create({
            data: {
              tenantId: user.tenantId,
              originalName: item.file.originalname,
              storageKey: item.storageKey,
              mimeType: item.file.mimetype,
              sizeBytes: BigInt(item.file.size),
              checksumSha256: item.checksum,
              uploadedById: user.id,
              productFile: { create: { productId: id } },
            },
          })),
        )
        : [];

      const created = await Promise.all(toUpload.map(async (item, index) => ({
        id: records[index].id,
        url: await this.storage.getSignedUrl(user.tenantId, item.storageKey),
        originalName: records[index].originalName,
      })));
      const existing = await Promise.all(existingLinks.map(async ({ file }) => ({
        id: file.id,
        url: await this.storage.getSignedUrl(user.tenantId, file.storageKey),
        originalName: file.originalName,
      })));
      return [...existing, ...created];
    } catch (error) {
      await Promise.allSettled(uploadedKeys.map((key) => this.storage.deleteAsset(user.tenantId, key)));
      throw error;
    }
  }

  @Get(':id/images')
  @RequirePermission('inventory:product:read')
  @ApiOperation({ summary: 'List product images' })
  async listImages(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const links = await this.prisma.productFile.findMany({
      where: { productId: id, tenantId: user.tenantId, file: { deletedAt: null } },
      include: { file: true },
      orderBy: { file: { createdAt: 'asc' } },
    });
    return Promise.all(links.map(async ({ file }) => ({
      id: file.id,
      url: await this.storage.getSignedUrl(user.tenantId, file.storageKey),
      originalName: file.originalName,
    })));
  }

  @Delete(':id/images/:fileId')
  @RequirePermission('inventory:product:update')
  @ApiOperation({ summary: 'Delete a product image' })
  async deleteImageById(@Param('id') id: string, @Param('fileId') fileId: string, @CurrentUser() user: AuthUser) {
    const link = await this.prisma.productFile.findFirst({
      where: { productId: id, fileId, tenantId: user.tenantId },
      include: { file: true },
    });
    if (!link) throw new NotFoundException('Image not found');

    await this.prisma.$transaction([
      this.prisma.productFile.delete({ where: { tenantId_fileId: { tenantId: user.tenantId, fileId } } }),
      this.prisma.file.update({ where: { id: fileId }, data: { deletedAt: new Date() } }),
    ]);
    await this.storage.deleteAsset(user.tenantId, link.file.storageKey);

    return { id: fileId };
  }
}
