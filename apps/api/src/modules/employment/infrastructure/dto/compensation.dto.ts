import { IsArray, IsNumber, Min, IsOptional, ValidateNested, ArrayMinSize, IsDateString, IsEnum, Matches, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CompensationType, EmploymentReason } from '@prisma/client';

export class CompensationComponentDto {
  @IsEnum(CompensationType) type!: CompensationType;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) amount!: number;
}

export class CreateCompensationDto {
  @IsDateString() effectiveDate!: string;
  @IsOptional() @IsString() @Matches(/^[A-Z]{3}$/) currency?: string;
  @IsOptional() @IsEnum(EmploymentReason) reason?: EmploymentReason;
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1)
  @Type(() => CompensationComponentDto) components!: CompensationComponentDto[];
}

export class AdjustCompensationDto {
  @IsDateString() effectiveDate!: string;
  @IsOptional() @IsString() @Matches(/^[A-Z]{3}$/) currency?: string;
  @IsEnum(EmploymentReason) reason!: EmploymentReason;
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1)
  @Type(() => CompensationComponentDto) components!: CompensationComponentDto[];
}
