import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  BUSINESS = 'business',
  ENTERPRISE = 'enterprise',
}

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  legalName: string;

  @IsString()
  @IsNotEmpty()
  taxId: string;

  @IsString()
  @IsOptional()
  baseCurrency? = 'VED';

  @IsString()
  @IsOptional()
  timezone? = 'UTC';

  @IsEnum(SubscriptionPlan)
  @IsOptional()
  subscriptionPlan? = SubscriptionPlan.FREE;

  @IsString()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  adminName: string;
}
