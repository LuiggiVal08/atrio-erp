import { IsString, IsNumber, IsOptional, Min, IsUUID, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class SalesReturnLineDto {
  @IsUUID() productId!: string;
  @IsUUID() warehouseId!: string;
  @IsNumber() @Min(0.000001) quantity!: number;
  @IsOptional() @IsNumber() @Min(0) unitPrice?: number;
  @IsOptional() @IsString() lotNumber?: string;
  @IsOptional() @IsString() serialNumber?: string;
}

export class CreateSalesReturnDto {
  @IsUUID() invoiceId!: string;
  @IsString() reason!: string;
  @IsOptional() @IsString() reasonCode?: string;
  @IsOptional() @IsString() productCondition?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsString() resolution?: string;
  @IsOptional() @IsUUID() cashRegisterId?: string;
  @IsOptional() @IsUUID() warehouseId?: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => SalesReturnLineDto)
  lines?: SalesReturnLineDto[];
}

export class UpdateSalesReturnStatusDto {
  @IsString() status!: string;
}
