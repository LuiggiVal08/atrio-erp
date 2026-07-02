import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';

export class CreateSalesReturnDto {
  @IsUUID() invoiceId!: string;
  @IsString() reason!: string;
  @IsNumber() @Min(0) subtotal!: number;
  @IsNumber() @Min(0) taxAmount!: number;
  @IsNumber() @Min(0) total!: number;
}

export class UpdateSalesReturnStatusDto {
  @IsString() status!: string;
}
