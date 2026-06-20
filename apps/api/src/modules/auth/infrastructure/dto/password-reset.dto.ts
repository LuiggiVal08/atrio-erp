import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class PasswordResetDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
