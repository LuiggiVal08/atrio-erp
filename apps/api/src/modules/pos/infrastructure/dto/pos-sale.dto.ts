import { IsString, IsOptional, IsUUID, IsNumber, Min, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePosSaleDto {
  @IsUUID()
  partnerId: string;

  @IsString()
  partnerName: string;

  @IsOptional()
  @IsString()
  partnerTaxId?: string;

  @IsOptional()
  @IsString()
  partnerAddress?: string;

  @IsOptional()
  @IsString()
  partnerEmail?: string;

  @IsOptional()
  @IsString()
  partnerPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePosSaleLineDto)
  lines?: CreatePosSaleLineDto[];
}

export class CreatePosSaleLineDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class UpdatePosSaleDto {
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @IsOptional()
  @IsString()
  partnerName?: string;

  @IsOptional()
  @IsString()
  partnerTaxId?: string;

  @IsOptional()
  @IsString()
  partnerAddress?: string;

  @IsOptional()
  @IsString()
  partnerEmail?: string;

  @IsOptional()
  @IsString()
  partnerPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePosSaleLineDto)
  lines?: UpdatePosSaleLineDto[];
}

export class UpdatePosSaleLineDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lineTotal?: number;
}

export class CheckoutPosSaleDto {
  @IsUUID()
  @IsString()
  warehouseId: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}

export class PayPosSaleDto {
  @IsUUID()
  paymentMethodId: string;

  @IsNumber()
  @Min(0)
  amountReceived: number;

  @IsUUID()
  cashRegisterId: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;
}
