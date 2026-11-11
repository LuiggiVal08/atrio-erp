import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
