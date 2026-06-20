import {
  IsString, IsEnum, IsOptional, IsArray, IsNumber, Min, ValidateNested, IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentType } from '../../domain/document.entity';

export class CreateDocumentLineDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @Min(0)
  taxRate: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountRate?: number;

  @IsOptional()
  @IsUUID()
  productId?: string;
}

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentLineDto)
  lines: CreateDocumentLineDto[];
}
