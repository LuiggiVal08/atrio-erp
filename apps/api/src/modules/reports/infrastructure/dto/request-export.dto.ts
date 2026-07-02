import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';

export class RequestExportDto {
  @IsEnum(['SALES', 'INVENTORY', 'CASH', 'CLIENTS', 'TAXES', 'PROFIT'])
  reportType!: string;

  @IsEnum(['PDF', 'XLSX', 'CSV'])
  format!: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;

  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}
