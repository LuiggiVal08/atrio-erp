import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';

export class CreateReportDefinitionDto {
  @IsString()
  name!: string;

  @IsEnum(['SALES', 'INVENTORY', 'CASH', 'CLIENTS', 'TAXES', 'PROFIT'])
  type!: string;

  @IsOptional()
  @IsEnum(['PDF', 'XLSX', 'CSV'])
  format?: string;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[];

  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
