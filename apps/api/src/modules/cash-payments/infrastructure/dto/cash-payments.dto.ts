import { IsString, IsNumber, IsBoolean, IsEnum, IsOptional, Min, Max } from 'class-validator';

export class CreateCashRegisterDto {
  @IsString() name!: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() currency?: string;
}

export class CreatePaymentMethodDto {
  @IsString() name!: string;
  @IsEnum(['cash', 'digital', 'card', 'other']) type!: 'cash' | 'digital' | 'card' | 'other';
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1) commissionRate?: number;
}

export class UpdatePaymentMethodDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEnum(['cash', 'digital', 'card', 'other']) type?: 'cash' | 'digital' | 'card' | 'other';
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1) commissionRate?: number | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class RegisterMovementDto {
  @IsEnum(['in', 'out']) type!: 'in' | 'out';
  @IsNumber() @Min(1) amount!: number;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsNumber() @Min(0) exchangeRate?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() receiptName?: string;
}

export class CreateBankAccountDto {
  @IsString() name!: string;
  @IsString() accountNumber!: string;
  @IsString() bankName!: string;
  @IsEnum(['checking', 'savings', 'cash']) accountType!: string;
  @IsOptional() @IsString() currency?: string;
}

export class UpdateBankAccountDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
