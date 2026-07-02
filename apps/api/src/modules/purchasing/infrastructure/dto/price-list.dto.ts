import { IsString, IsNumber, IsOptional, IsBoolean, Min, IsArray, ValidateNested, ArrayMinSize, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePriceListItemDto {
  @IsString() productId!: string;
  @IsNumber() @Min(0) unitPrice!: number;
}

export class CreatePriceListDto {
  @IsString() name!: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validTo?: string;
}

export class UpdatePriceListDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() vendorId?: string;
  @IsOptional() @IsDateString() validFrom?: string;
  @IsOptional() @IsDateString() validTo?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class AddPriceListItemDto {
  @IsString() productId!: string;
  @IsNumber() @Min(0) unitPrice!: number;
}
