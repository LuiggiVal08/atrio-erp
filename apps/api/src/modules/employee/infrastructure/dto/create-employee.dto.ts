import { IsString, IsNotEmpty, IsNumber, Min, IsDateString, IsOptional, IsEnum, IsEmail, IsUUID } from 'class-validator';
import { IdentificationType } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsOptional() @IsString() middleName?: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsOptional() @IsString() secondLastName?: string;
  @IsString() @IsNotEmpty() identityDoc: string;
  @IsOptional() @IsEnum(IdentificationType) identificationType?: IdentificationType;
  @IsOptional() @IsString() taxIdentifier?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsDateString() @IsNotEmpty() hireDate: string;
  @IsString() @IsNotEmpty() department: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @IsString() @IsNotEmpty() position: string;
  @IsNumber() @Min(0) baseSalary: number;
}
