import { IsString, IsOptional, IsIn, MinLength, Matches, IsUUID } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['es', 'en'])
  locale?: string;

  @IsString()
  @IsOptional()
  @Matches(/^[\d\s\-+()]{0,20}$/)
  phone?: string;

  @IsUUID('4')
  @IsOptional()
  employeeId?: string | null;
}
