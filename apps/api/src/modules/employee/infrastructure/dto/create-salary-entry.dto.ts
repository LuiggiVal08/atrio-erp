import { IsString, IsNumber, Min, IsDateString, IsOptional } from 'class-validator';

export class CreateSalaryEntryDto {
  @IsNumber() @Min(0) salary!: number;
  @IsDateString() effectiveDate!: string;
  @IsOptional() @IsString() reason?: string;
}
