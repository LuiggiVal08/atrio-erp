import { IsString, IsNumber, IsOptional, Min, IsEnum, IsEmail } from 'class-validator';
import { EmployeeStatus } from '../../domain/employee.entity';
import { IdentificationType } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() secondLastName?: string;
  @IsOptional() @IsString() identityDoc?: string;
  @IsOptional() @IsEnum(IdentificationType) identificationType?: IdentificationType;
  @IsOptional() @IsString() taxIdentifier?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() emergencyContactName?: string;
  @IsOptional() @IsString() emergencyContactPhone?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsNumber() @Min(0) baseSalary?: number;
  @IsOptional() @IsString() status?: string;
}
