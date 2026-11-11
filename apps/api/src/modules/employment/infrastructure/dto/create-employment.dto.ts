import { IsString } from 'class-validator';

export class CreateEmploymentDto {
  @IsString() employeeId!: string;
  @IsString() startDate!: string;
  @IsString() reason!: string;
}

export class TerminateEmploymentDto {
  @IsString() endDate!: string;
  @IsString() reason!: string;
}

export class EmploymentActionDto {
  @IsString() reason!: string;
}
