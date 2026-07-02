import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString() name!: string;
  @IsOptional() @IsString() parentId?: string;
}

export class UpdateProductCategoryDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() parentId?: string;
}

export class CreateProductDto {
  @IsString() sku!: string;
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsNumber() @Min(0) unitPrice!: number;
  @IsNumber() @Min(0) costPrice!: number;
  @IsOptional() @IsString() taxId?: string;
  @IsBoolean() isService!: boolean;
}

export class UpdateProductDto {
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsBoolean() isService?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateWarehouseDto {
  @IsString() name!: string;
}

export class AdjustStockDto {
  @IsString() type!: 'in' | 'out';
  @IsNumber() @Min(1) quantity!: number;
  @IsOptional() @IsString() reason?: string;
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
