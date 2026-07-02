import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateSalesOrderDto {
  @IsString() documentId!: string;
  @IsString() clientId!: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
  @IsString() currency!: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateSalesOrderDto {
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsNumber() @Min(0) subtotal?: number;
  @IsOptional() @IsNumber() @Min(0) taxAmount?: number;
  @IsOptional() @IsNumber() @Min(0) total?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateSalesOrderStatusDto {
  @IsString() status!: string;
}

export class CreateSalesInvoiceDto {
  @IsString() documentId!: string;
  @IsOptional() @IsString() salesOrderId?: string;
  @IsString() clientId!: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
  @IsString() currency!: string;
  @IsOptional() @IsNumber() currencyRate?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsUUID() salespersonId?: string;
  @IsOptional() @IsNumber() commissionRate?: number;
}

export class UpdateSalesInvoiceDto {
  @IsOptional() @IsString() clientId?: string;
  @IsOptional() @IsNumber() @Min(0) subtotal?: number;
  @IsOptional() @IsNumber() @Min(0) taxAmount?: number;
  @IsOptional() @IsNumber() @Min(0) total?: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() currencyRate?: number;
  @IsOptional() @IsString() notes?: string;
}

export class PayInvoiceDto {
  @IsUUID() paymentMethodId!: string;
}
