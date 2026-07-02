import { IsString, IsNumber, IsBoolean, IsEnum, IsOptional, Min } from 'class-validator';

export class CreateCashRegisterDto {
  @IsString() name!: string;
  @IsString() currency!: string;
}

export class CreatePaymentMethodDto {
  @IsString() name!: string;
  @IsEnum(['cash', 'transfer', 'card', 'check', 'other']) type!: 'cash' | 'transfer' | 'card' | 'check' | 'other';
  @IsOptional() @IsNumber() commissionRate?: number;
}

export class RegisterMovementDto {
  @IsEnum(['in', 'out']) type!: 'in' | 'out';
  @IsNumber() @Min(1) amount!: number;
  @IsOptional() @IsString() description?: string;
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
