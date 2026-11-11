import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min, MinLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderLineDto {
  @IsString() productId!: string;
  @IsString() productSku!: string;
  @IsString() productName!: string;
  @IsOptional() @IsString() productUnit?: string;
  @IsOptional() @IsString() warehouseId?: string;
  @IsNumber() @Min(0.001) orderedQuantity!: number;
  @IsNumber() @Min(0.001) unitCost!: number;
  @IsOptional() @IsNumber() taxRate?: number;
  @IsOptional() @IsNumber() discountRate?: number;
}

export class CreatePurchaseOrderV2Dto {
  @IsString() supplierId!: string;
  @IsString() @MinLength(1) supplierName!: string;
  @IsOptional() @IsString() supplierTaxId?: string;
  @IsOptional() @IsString() supplierEmail?: string;
  @IsOptional() @IsString() supplierPhone?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderLineDto) lines!: CreateOrderLineDto[];
  @IsOptional() @IsString() notes?: string;
}

export class StartReceivingDto {
  @IsDateString() receivedAt!: string;
}

export class ReceiveGoodsLineDto {
  @IsString() purchasingOrderLineId!: string;
  @IsNumber() @Min(0.001) receivedQuantity!: number;
  @IsOptional() @IsNumber() damagedQuantity?: number;
  @IsOptional() @IsString() notes?: string;
}

export class ReceiveGoodsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => ReceiveGoodsLineDto) lines!: ReceiveGoodsLineDto[];
}

export class PurchaseOrderV2ResponseDto {
  id!: string;
  tenantId!: string;
  status!: string;
  supplierId!: string;
  supplierName!: string;
  supplierTaxId?: string | null;
  supplierEmail?: string | null;
  supplierPhone?: string | null;
  lines!: Array<{
    id: string;
    productId: string;
    productSku: string;
    productName: string;
    productUnit?: string | null;
    warehouseId?: string | null;
    orderedQuantity: number;
    unitCost: number;
    taxRate: number;
    discountRate: number;
    totalCost: number;
    receivedQuantity: number;
  }>;
  notes?: string | null;
  completedAt?: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class GoodsReceiptResponseDto {
  id!: string;
  purchasingOrderId!: string;
  tenantId!: string;
  status!: string;
  receivedAt!: string;
  lines!: Array<{
    id: string;
    purchasingOrderLineId: string;
    receivedQuantity: number;
    damagedQuantity: number;
    notes?: string | null;
  }>;
  notes?: string | null;
  createdAt!: string;
  updatedAt!: string;
}
