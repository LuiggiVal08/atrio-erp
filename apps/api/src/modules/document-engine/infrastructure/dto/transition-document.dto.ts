import { IsEnum, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentStatus } from '../../domain/document.entity';
import { CreateDocumentLineDto } from './create-document.dto';

export class TransitionDocumentDto {
  @IsEnum(DocumentStatus)
  targetStatus: DocumentStatus;
}

export class SubmitDocumentDto {}

export class ApproveDocumentDto {}

export class RejectDocumentDto {
  @IsString()
  rejectionReason: string;
}

export class CreateCounterDocumentDto {
  @IsString()
  counterDocumentType: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDocumentLineDto)
  lines: CreateDocumentLineDto[];
}
