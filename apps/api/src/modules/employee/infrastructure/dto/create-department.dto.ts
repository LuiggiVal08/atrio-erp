import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @IsString() name!: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateDepartmentDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
