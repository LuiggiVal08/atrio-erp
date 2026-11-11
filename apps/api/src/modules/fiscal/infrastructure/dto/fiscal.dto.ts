import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class FiscalLineDto {
  @IsString() description!: string;
  @IsNumber() quantity!: number;
  @IsNumber() unitPrice!: number;
  @IsNumber() taxRate!: number;
  @IsOptional() @IsNumber() discountRate?: number;
}

export class CalculateTaxesDto {
  @IsString() documentNumber!: string;
  @IsString() clientId!: string;
  @IsString() clientName!: string;
  @IsString() clientTaxId!: string;
  @IsOptional() @IsString() clientContributorType?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => FiscalLineDto)
  lines!: FiscalLineDto[];
  @IsNumber() subtotal!: number;
  @IsString() currency!: string;
  @IsOptional() @IsNumber() exchangeRate?: number;
  @IsString() countryCode!: string;
}

export class ProcessInvoiceDto {
  @IsString() invoiceId!: string;
}

export class SubmitInvoiceDto {
  @IsString() invoiceId!: string;
}
