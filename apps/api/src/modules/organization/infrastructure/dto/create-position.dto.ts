import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreatePositionDto {
  @IsString() name!: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isLeadership?: boolean;
}

export class UpdatePositionDto {
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isLeadership?: boolean;
  @IsOptional() @IsBoolean() active?: boolean;
}
