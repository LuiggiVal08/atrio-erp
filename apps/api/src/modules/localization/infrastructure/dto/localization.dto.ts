import { IsString, IsNumber, IsEnum, IsOptional, Min, IsArray } from 'class-validator';

export class CreateTaxDto {
  @IsString() name!: string;
  @IsNumber() @Min(0) rate!: number;
  @IsEnum(['percentage', 'fixed']) type!: 'percentage' | 'fixed';
}

export class UpdateTaxDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsNumber() @Min(0) rate?: number;
  @IsOptional() @IsEnum(['percentage', 'fixed']) type?: 'percentage' | 'fixed';
  @IsOptional() @IsString() isActive?: string;
}

export class CreateCurrencyRateDto {
  @IsString() fromCurrency!: string;
  @IsString() toCurrency!: string;
  @IsNumber() @Min(0.000001) rate!: number;
  @IsString() date!: string; // ISO date
}

export class SyncCurrencyRateDto {
  @IsString() fromCurrency!: string;
  @IsString() toCurrency!: string;
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  providerIds?: string[];
}
