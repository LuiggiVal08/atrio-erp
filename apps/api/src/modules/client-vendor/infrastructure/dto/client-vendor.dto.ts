import { IsString, IsOptional, IsEmail, IsEnum, IsArray, IsInt, IsBoolean, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IdentificationType } from '@prisma/client';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const trimToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class VendorContactDto {
  @IsOptional() @IsString() id?: string;
  @IsString() fullName!: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @Transform(trimToUndefined) @IsEmail({}, { message: 'El correo no es válido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class VendorAddressDto {
  @IsString() country!: string;
  @IsString() state!: string;
  @IsString() city!: string;
  @IsString() addressLine!: string;
  @IsOptional() @IsString() reference?: string;
}

export class CreateClientDto {
  @IsString() documentId!: string;
  @IsOptional() @Transform(emptyToUndefined) @IsEnum(IdentificationType) identificationType?: IdentificationType;
  @IsString() legalName!: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() secondLastName?: string;
  @IsString() taxId!: string;
  @IsOptional() @Transform(trimToUndefined) @IsEmail({}, { message: 'El correo no es válido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() addressId?: string;
  @IsOptional() @IsString() contributorType?: string;
}

export class UpdateClientDto {
  @IsOptional() @IsString() documentId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsEnum(IdentificationType) identificationType?: IdentificationType;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() secondLastName?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @Transform(trimToUndefined) @IsEmail({}, { message: 'El correo no es válido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() addressId?: string;
  @IsOptional() @IsString() contributorType?: string;
}

export class CreateVendorDto {
  @IsString() documentId!: string;
  @IsOptional() @Transform(emptyToUndefined) @IsEnum(IdentificationType) identificationType?: IdentificationType;
  @IsString() legalName!: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() secondLastName?: string;
  @IsString() taxId!: string;
  @IsOptional() @Transform(trimToUndefined) @IsEmail({}, { message: 'El correo no es válido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() addressId?: string;
  @IsOptional() @ValidateNested() @Type(() => VendorAddressDto) address?: VendorAddressDto;
  @IsOptional() @IsBoolean() ownerIsPrimary?: boolean;
  @IsOptional() @IsString() commercialName?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() metadataNotes?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @Type(() => Number) @IsInt() deliveryDays?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) categoryTags?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) categoryIds?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VendorContactDto) contacts?: VendorContactDto[];
  @IsOptional() @IsString() contactFirstName?: string;
  @IsOptional() @IsString() contactMiddleName?: string;
  @IsOptional() @IsString() contactLastName?: string;
  @IsOptional() @IsString() contactSecondLastName?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsEnum(IdentificationType) contactIdentificationType?: IdentificationType;
  @IsOptional() @IsString() contactIdentificationNumber?: string;
  @IsOptional() @Transform(trimToUndefined) @IsEmail({}, { message: 'El correo no es válido' }) contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
}

export class UpdateVendorDto {
  @IsOptional() @IsString() documentId?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsEnum(IdentificationType) identificationType?: IdentificationType;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() middleName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsString() secondLastName?: string;
  @IsOptional() @IsString() taxId?: string;
  @IsOptional() @Transform(trimToUndefined) @IsEmail({}, { message: 'El correo no es válido' }) email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() addressId?: string;
  @IsOptional() @ValidateNested() @Type(() => VendorAddressDto) address?: VendorAddressDto;
  @IsOptional() @IsBoolean() ownerIsPrimary?: boolean;
  @IsOptional() @IsString() commercialName?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() metadataNotes?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @Type(() => Number) @IsInt() deliveryDays?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) categoryTags?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) categoryIds?: string[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => VendorContactDto) contacts?: VendorContactDto[];
  @IsOptional() @IsString() contactFirstName?: string;
  @IsOptional() @IsString() contactMiddleName?: string;
  @IsOptional() @IsString() contactLastName?: string;
  @IsOptional() @IsString() contactSecondLastName?: string;
  @IsOptional() @Transform(emptyToUndefined) @IsEnum(IdentificationType) contactIdentificationType?: IdentificationType;
  @IsOptional() @IsString() contactIdentificationNumber?: string;
  @IsOptional() @Transform(trimToUndefined) @IsEmail({}, { message: 'El correo no es válido' }) contactEmail?: string;
  @IsOptional() @IsString() contactPhone?: string;
}
