import { IsString, IsArray, IsNumber, Min, IsOptional, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CompensationComponentDto {
  @IsString() type!: string;
  @IsNumber() @Min(0.01) amount!: number;
}

export class CreateCompensationDto {
  @IsString() effectiveDate!: string;
  @IsOptional() @IsString() currency?: string;
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1)
  @Type(() => CompensationComponentDto) components!: CompensationComponentDto[];
}

export class AdjustCompensationDto {
  @IsString() effectiveDate!: string;
  @IsOptional() @IsString() currency?: string;
  @IsArray() @ValidateNested({ each: true }) @ArrayMinSize(1)
  @Type(() => CompensationComponentDto) components!: CompensationComponentDto[];
}
