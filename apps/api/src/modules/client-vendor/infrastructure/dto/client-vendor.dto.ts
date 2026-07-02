import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CreateClientDto {
  @IsString() legalName!: string;
  @IsString() taxId!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}

export class UpdateClientDto {
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}

export class CreateVendorDto {
  @IsString() legalName!: string;
  @IsString() taxId!: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}

export class UpdateVendorDto {
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
}
