import { IsString, IsNumber, IsOptional, IsDateString, Min, IsArray, ValidateNested, ArrayMinSize, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseOrderDto {
  @IsOptional() @IsString() documentId?: string;
  @IsString() vendorId!: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
  @IsString() currency!: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() expectedDate?: string;
}

export class ReturnLineDto {
  @IsString() productId!: string;
  @IsString() warehouseId!: string;
  @IsNumber() @Min(0) quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class CreatePurchaseReturnDto {
  @IsString() reason!: string;
  @IsOptional() @IsString() reasonCode?: string;
  @IsOptional() @IsString() resolution?: string;
  @IsOptional() @IsString() supplierCreditNo?: string;
  @IsOptional() @IsUUID() warehouseId?: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1) @Type(() => ReturnLineDto)
  lines!: ReturnLineDto[];
}

export class UpdatePurchaseReturnStatusDto {
  @IsString() status!: string;
}

export class UpdatePurchaseOrderStatusDto {
  @IsString() status!: string;
}

export class ReceiveLineDto {
  @IsString() lineId!: string;
  @IsNumber() @Min(0) quantity!: number;
}

export class ReceiveOrderDto {
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1) @Type(() => ReceiveLineDto)
  lines!: ReceiveLineDto[];
}

export class UpdatePurchaseOrderDto {
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsNumber() @Min(0) subtotal?: number;
  @IsOptional() @IsNumber() @Min(0) taxAmount?: number;
  @IsOptional() @IsNumber() @Min(0) total?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() expectedDate?: string;
}
