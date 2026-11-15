import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

const PAYMENT_METHOD_VALUES = [
  'cash',
  'card',
  'transfer',
  'mobile_payment',
  'digital',
  'point',
  'other',
];

export class OpenSessionDto {
  @IsString() cashRegisterId!: string;
  @IsNumber() @Min(0) openingBalance!: number;
  @IsOptional() openingDenominations?: unknown;
}

export class CloseSessionDto {
  @IsNumber() @Min(0) closingBalance!: number;
  @IsOptional() @IsNumber() closingDifference?: number;
  @IsOptional() @IsString() closingNote?: string;
  @IsOptional() closingDenominations?: unknown;
}

export class QuickSaleItemDto {
  @IsUUID() productId!: string;
  @IsUUID() warehouseId!: string;
  @IsNumber() @Min(1) quantity!: number;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class QuickSalePaymentAllocationDto {
  @IsIn(PAYMENT_METHOD_VALUES) method!: string;
  @IsNumber() @Min(0) amount!: number;
  @IsString() currency!: string;
  @IsNumber() @Min(0) exchangeRate!: number;
  @IsOptional() @IsString() bankName?: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() details?: string;
}

export class QuickSaleDto {
  @IsOptional() @IsString() clientId?: string;
  @IsString() cashRegisterId!: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
  @IsIn(PAYMENT_METHOD_VALUES) paymentMethod!: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => QuickSalePaymentAllocationDto)
  paymentAllocations?: QuickSalePaymentAllocationDto[];
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1) @Type(() => QuickSaleItemDto)
  items!: QuickSaleItemDto[];
}
