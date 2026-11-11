import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  MinLength,
  Min,
} from 'class-validator';

export class CreatePayrollPeriodDto {
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsOptional()
  @IsIn(['WEEKLY', 'BIWEEKLY', 'SEMI_MONTHLY', 'MONTHLY', 'CUSTOM'])
  frequency?: 'WEEKLY' | 'BIWEEKLY' | 'SEMI_MONTHLY' | 'MONTHLY' | 'CUSTOM';
  @IsOptional() @IsString() notes?: string;
}

export class CreatePayrollConceptDto {
  @IsString() @MinLength(2) @MaxLength(30) code!: string;
  @IsString() @MinLength(1) @MaxLength(120) name!: string;
  @IsIn(['EARNING', 'DEDUCTION']) type!: 'EARNING' | 'DEDUCTION';
  @IsIn(['FIXED', 'BASE_PERCENTAGE']) calculationMode!: 'FIXED' | 'BASE_PERCENTAGE';
  @IsNumber() @Min(0.01) @Max(1000000000) amount!: number;
  @IsString() @MinLength(3) @MaxLength(3) currency!: string;
  @IsBoolean() recurring!: boolean;
}

export class UpdatePayrollConceptDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) name?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(1000000000) amount?: number;
  @IsOptional() @IsString() @MinLength(3) @MaxLength(3) currency?: string;
  @IsOptional() @IsBoolean() recurring?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreatePayrollInputDto {
  @IsUUID() relationshipId!: string;
  @IsUUID() conceptId!: string;
  @IsNumber() @Min(0.01) @Max(1000000000) amount!: number;
  @IsOptional() @IsString() @MaxLength(240) description?: string;
}

export class UpdatePayrollInputDto {
  @IsNumber() @Min(0.01) @Max(1000000000) amount!: number;
  @IsOptional() @IsString() @MaxLength(240) description?: string;
}

export class CreateEmployeeLoanDto {
  @IsUUID() relationshipId!: string;
  @IsNumber() @Min(0.01) @Max(1000000000) principal!: number;
  @IsInt() @Min(1) @Max(1000) installmentCount!: number;
  @IsString() @MinLength(3) @MaxLength(3) currency!: string;
  @IsString() @MinLength(1) @MaxLength(240) reason!: string;
}

export class PayPayrollPeriodDto {
  @IsIn(['cash', 'bank']) method!: 'cash' | 'bank';
  @IsOptional() @IsUUID() cashRegisterId?: string;
  @IsOptional() @IsUUID() bankAccountId?: string;
}
