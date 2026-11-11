import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateContractDto {
  @IsString() contractType!: string;
  @IsString() startDate!: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class RenewContractDto {
  @IsString() contractType!: string;
  @IsString() startDate!: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() reason?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class TerminateContractDto {
  @IsString() terminatedAt!: string;
  @IsString() reason!: string;
}
