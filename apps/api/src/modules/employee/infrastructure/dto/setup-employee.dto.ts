import { OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID, IsDefined, ValidateNested, Min } from 'class-validator';
import { CreateEmployeeDto } from './create-employee.dto';
import { CreateDepartmentDto } from './create-department.dto';
import { CreatePositionDto } from '../../../organization/infrastructure/dto/create-position.dto';
import { CreateEmploymentDto } from '../../../employment/infrastructure/dto/create-employment.dto';
import { CreateContractDto } from '../../../employment/infrastructure/dto/contract.dto';
import { CreateCompensationDto } from '../../../employment/infrastructure/dto/compensation.dto';

class SetupIdentityDto extends OmitType(CreateEmployeeDto, ['department', 'departmentId', 'position'] as const) {
  @IsUUID() id!: string;
  @Min(0.01) baseSalary!: number;
}
class SetupEmploymentDto extends OmitType(CreateEmploymentDto, ['employeeId'] as const) {}
class SetupPositionDto extends OmitType(CreatePositionDto, ['departmentId'] as const) {}

export class SetupEmployeeDto {
  @IsOptional() @IsUUID() departmentId?: string;
  @IsOptional() @ValidateNested() @Type(() => CreateDepartmentDto) department?: CreateDepartmentDto;
  @IsOptional() @IsUUID() positionId?: string;
  @IsOptional() @ValidateNested() @Type(() => SetupPositionDto) position?: SetupPositionDto;
  @IsDefined() @ValidateNested() @Type(() => SetupIdentityDto) employee!: SetupIdentityDto;
  @IsDefined() @ValidateNested() @Type(() => SetupEmploymentDto) employment!: SetupEmploymentDto;
  @IsDefined() @ValidateNested() @Type(() => CreateContractDto) contract!: CreateContractDto;
  @IsDefined() @ValidateNested() @Type(() => CreateCompensationDto) compensation!: CreateCompensationDto;
}
