import { IsString, IsOptional } from 'class-validator';

export class CreateAssignmentDto {
  @IsString() employeeId!: string;
  @IsString() positionId!: string;
  @IsString() startDate!: string;
  @IsOptional() @IsString() endDate?: string;
}

export class EndAssignmentDto {
  @IsString() endDate!: string;
}
