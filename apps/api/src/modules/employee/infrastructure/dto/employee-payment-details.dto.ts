import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class EmployeePaymentDetailsDto {
  @IsIn(['BANK', 'MOBILE_PAYMENT']) method!: 'BANK' | 'MOBILE_PAYMENT';
  @ValidateIf((data: EmployeePaymentDetailsDto) => data.method === 'BANK')
  @IsString() @MinLength(1) @MaxLength(120) bankName?: string;
  @ValidateIf((data: EmployeePaymentDetailsDto) => data.method === 'BANK')
  @IsIn(['SAVINGS', 'CHECKING', 'OTHER'])
  accountType?: 'SAVINGS' | 'CHECKING' | 'OTHER';
  @ValidateIf((data: EmployeePaymentDetailsDto) => data.method === 'BANK')
  @IsString() @MinLength(4) @MaxLength(80) accountNumber?: string;
  @ValidateIf((data: EmployeePaymentDetailsDto) =>
    data.method === 'MOBILE_PAYMENT' || data.mobilePaymentPhone !== undefined,
  )
  @IsString() @IsNotEmpty() @MinLength(6) @MaxLength(40) mobilePaymentPhone?: string;
}
