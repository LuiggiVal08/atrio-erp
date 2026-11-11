import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString() name!: string;
  @IsOptional() @IsString() parentId?: string;
}

export class UpdateProductCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentId?: string;
}

export class CreateProductBrandDto {
  @IsString() name!: string;
  @IsOptional() @IsUUID() logoFileId?: string;
}

export class UpdateProductBrandDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsUUID() logoFileId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateProductDto {
  @IsString() sku!: string;
  @IsOptional() @IsString() barcode?: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsNumber() @Min(0) costPrice!: number;
  @IsOptional() @IsString() taxId?: string;
  @IsBoolean() isService!: boolean;
  @IsOptional() @IsString() brandId?: string;
  @IsOptional() @IsString() baseUnit?: string;
  @IsOptional() @IsString() purchaseUnit?: string;
  @IsOptional() @IsNumber() @Min(0.000001) conversionFactor?: number;
  @IsOptional() @IsNumber() @Min(0) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) maxStock?: number;
  @IsOptional() @IsNumber() @Min(0) reorderPoint?: number;
  @IsOptional() @IsUUID() primarySupplierId?: string;
  @IsOptional() @IsString() supplierSku?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() barcode?: string | null;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsBoolean() isService?: boolean;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() brandId?: string | null;
  @IsOptional() @IsString() baseUnit?: string;
  @IsOptional() @IsString() purchaseUnit?: string | null;
  @IsOptional() @IsNumber() @Min(0.000001) conversionFactor?: number;
  @IsOptional() @IsNumber() @Min(0) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) maxStock?: number | null;
  @IsOptional() @IsNumber() @Min(0) reorderPoint?: number;
  @IsOptional() @IsUUID() primarySupplierId?: string | null;
  @IsOptional() @IsString() supplierSku?: string | null;
}

export class CreateWarehouseDto {
  @IsString() name!: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsString() aisle?: string;
  @IsOptional() @IsString() shelf?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() bin?: string;
}

export class UpdateWarehouseDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string | null;
  @IsOptional() @IsUUID() branchId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @IsString() aisle?: string | null;
  @IsOptional() @IsString() shelf?: string | null;
  @IsOptional() @IsString() level?: string | null;
  @IsOptional() @IsString() bin?: string | null;
}

export class CreateBranchDto {
  @IsString() name!: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() phone?: string;
}

export class UpdateBranchDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string | null;
  @IsOptional() @IsString() address?: string | null;
  @IsOptional() @IsString() phone?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AdjustStockDto {
  @IsString() type!: 'in' | 'out';
  @IsNumber() @Min(1) quantity!: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsString() expirationDate?: string;
}

export class CreateTransferDto {
  @IsUUID() fromWarehouseId!: string;
  @IsUUID() toWarehouseId!: string;
  @IsUUID() productId!: string;
  @IsNumber() @Min(1) quantity!: number;
  @IsOptional() @IsString() notes?: string;
}

export class SetReorderPointDto {
  @IsUUID() productId!: string;
  @IsUUID() warehouseId!: string;
  @IsNumber() @Min(0) minQuantity!: number;
  @IsNumber() maxQuantity!: number;
}

export class UpdateReorderPointDto {
  @IsOptional() @IsNumber() @Min(0) minQuantity?: number;
  @IsOptional() @IsNumber() maxQuantity?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
