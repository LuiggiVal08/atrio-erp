import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { EmployeeStatus } from '../../domain/employee.entity';

export class UpdateEmployeeDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() identityDoc?: string;
  @IsOptional() @IsString() department?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsNumber() @Min(0) baseSalary?: number;
  @IsOptional() @IsString() status?: string;
}
