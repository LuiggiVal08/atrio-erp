import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, ArrayMinSize, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OpenSessionDto {
  @IsString() cashRegisterId!: string;
  @IsNumber() @Min(0) openingBalance!: number;
}

export class CloseSessionDto {
  @IsNumber() @Min(0) closingBalance!: number;
}

export class QuickSaleItemDto {
  @IsString() productId!: string;
  @IsString() warehouseId!: string;
  @IsNumber() @Min(1) quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class QuickSaleDto {
  @IsString() clientId!: string;
  @IsString() cashRegisterId!: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
  @IsString() paymentMethod!: string;
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1) @Type(() => QuickSaleItemDto)
  items!: QuickSaleItemDto[];
}
