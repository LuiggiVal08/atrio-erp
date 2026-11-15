import { Type } from 'class-transformer';
import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, Min, Max, IsInt, IsIn, MaxLength, Matches, IsPositive, IsDateString, ValidateIf } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString() name!: string;
  @IsOptional() @IsString() parentId?: string | null;
}

export class UpdateProductCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentId?: string | null;
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
  @IsOptional() @IsString() @Matches(/^[\x20-\x7E]*$/, { message: 'Barcode must contain printable ASCII characters only' }) barcode?: string;
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
  @ValidateIf((_, value) => value !== undefined) @IsNumber() @Min(0) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) maxStock?: number;
  @ValidateIf((_, value) => value !== undefined) @IsNumber() @Min(0) reorderPoint?: number;
  @IsOptional() @IsUUID() primarySupplierId?: string;
  @IsOptional() @IsString() supplierSku?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() @Matches(/^[\x20-\x7E]*$/, { message: 'Barcode must contain printable ASCII characters only' }) barcode?: string | null;
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
  @ValidateIf((_, value) => value !== undefined) @IsNumber() @Min(0) minStock?: number;
  @IsOptional() @IsNumber() @Min(0) maxStock?: number | null;
  @ValidateIf((_, value) => value !== undefined) @IsNumber() @Min(0) reorderPoint?: number;
  @IsOptional() @IsUUID() primarySupplierId?: string | null;
  @IsOptional() @IsString() supplierSku?: string | null;
}

export class CreateWarehouseDto {
  @IsString() name!: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsUUID() branchId?: string;
}

export class UpdateWarehouseDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string | null;
  @IsOptional() @IsUUID() branchId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export const STORAGE_LOCATION_TYPES = ['AISLE', 'SHELF', 'LEVEL', 'BIN'] as const;
export type StorageLocationTypeValue = (typeof STORAGE_LOCATION_TYPES)[number];

export class CreateStorageLocationDto {
  @IsOptional() @IsUUID() parentId?: string | null;
  @IsIn(STORAGE_LOCATION_TYPES) type!: StorageLocationTypeValue;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
}

export class UpdateStorageLocationDto {
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class GenerateStorageLocationsDto {
  @IsInt() @Min(1) @Max(20) aisles!: number;
  @IsInt() @Min(1) @Max(50) shelves!: number;
  @IsInt() @Min(1) @Max(20) levels!: number;
  @IsInt() @Min(1) @Max(50) bins!: number;
}

export class CreateBranchDto {
  @IsString() @MaxLength(120) name!: string;
  @IsOptional() @IsString() @MaxLength(20) @Matches(/^[A-Za-z0-9-]*$/) code?: string;
  @IsOptional() @IsString() @MaxLength(200) address?: string;
  @IsOptional() @IsString() @MaxLength(100) city?: string;
  @IsOptional() @IsString() @MaxLength(100) state?: string;
  @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @IsUUID() managerEmployeeId?: string;
}

export class UpdateBranchDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(20) @Matches(/^[A-Za-z0-9-]*$/) code?: string | null;
  @IsOptional() @IsString() @MaxLength(200) address?: string | null;
  @IsOptional() @IsString() @MaxLength(100) city?: string | null;
  @IsOptional() @IsString() @MaxLength(100) state?: string | null;
  @IsOptional() @IsString() @MaxLength(30) phone?: string | null;
  @IsOptional() @IsUUID() managerEmployeeId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class StockMovementQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() productId?: string;
  @IsOptional() @IsUUID() warehouseId?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsIn(['in', 'out']) type?: 'in' | 'out';
  @IsOptional() @IsDateString({ strict: true }) dateFrom?: string;
  @IsOptional() @IsDateString({ strict: true }) dateTo?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) pageSize?: number;
}

export class AdjustStockDto {
  @IsIn(['in', 'out']) type!: 'in' | 'out';
  @IsNumber() @IsPositive() quantity!: number;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsString() serialNumber?: string;
  @IsOptional() @IsDateString({ strict: true }) expirationDate?: string;
  @IsOptional() @IsString() @MaxLength(200) operationId?: string;
  @IsOptional() @IsString() referenceType?: string;
  @IsOptional() @IsString() referenceId?: string;
  @ValidateIf((_, value) => value !== undefined) @IsNumber() @Min(0) expectedQuantity?: number;
}

export class CreateTransferDto {
  @IsUUID() fromWarehouseId!: string;
  @IsUUID() toWarehouseId!: string;
  @IsUUID() productId!: string;
  @IsNumber() @IsPositive() quantity!: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() lotNumber?: string;
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
