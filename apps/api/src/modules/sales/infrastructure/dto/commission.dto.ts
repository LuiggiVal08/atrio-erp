import { IsUUID, IsOptional, IsString } from 'class-validator';

export class PayCommissionDto {
  @IsOptional() @IsString() notes?: string;
}

export class CommissionSummaryDto {
  pending!: number;
  paid!: number;
  total!: number;
}
