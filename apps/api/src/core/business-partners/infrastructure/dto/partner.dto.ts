import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray, IsBoolean, IsNumber, Min, Max, IsObject, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class TaxIdDto {
  @IsString() @IsNotEmpty() value!: string;
  @IsString() @IsNotEmpty() country!: string;
  @IsString() @IsNotEmpty() type!: string;
}

class ContactDto {
  @IsString() @IsNotEmpty() fullName!: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

class AddressDto {
  @IsIn(['FISCAL', 'BILLING', 'SHIPPING', 'BRANCH', 'PRIMARY', 'OTHER']) type!: string;
  @IsString() @IsNotEmpty() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() @IsNotEmpty() city!: string;
  @IsString() @IsNotEmpty() state!: string;
  @IsString() @IsNotEmpty() country!: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class CreatePartnerDto {
  @IsIn(['PERSON', 'COMPANY']) @IsNotEmpty() type!: string;
  @IsString() @IsNotEmpty() legalName!: string;

  @IsOptional() @IsObject() @ValidateNested() @Type(() => TaxIdDto)
  taxId?: TaxIdDto;

  @IsOptional() @IsString() commercialName?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deliveryDays?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ContactDto)
  contacts?: ContactDto[];

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AddressDto)
  addresses?: AddressDto[];
}

export class UpdatePartnerDto {
  @IsOptional() @IsIn(['PERSON', 'COMPANY']) type?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsObject() @ValidateNested() @Type(() => TaxIdDto)
  taxId?: TaxIdDto;
  @IsOptional() @IsString() commercialName?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() paymentTerms?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) deliveryDays?: number;
}

export class PartnerFiltersDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) roles?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) types?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) statuses?: string[];
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(1) @Max(200) pageSize?: number;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
}

export class AssignRoleDto {
  @IsIn(['CUSTOMER', 'SUPPLIER', 'PROSPECT', 'DISTRIBUTOR', 'CARRIER', 'MANUFACTURER', 'CREDITOR']) @IsNotEmpty() role!: string;
}

export class CreateContactDto {
  @IsString() @IsNotEmpty() fullName!: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class UpdateContactDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() mobile?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class CreateAddressDto {
  @IsIn(['FISCAL', 'BILLING', 'SHIPPING', 'BRANCH', 'PRIMARY', 'OTHER']) @IsNotEmpty() type!: string;
  @IsString() @IsNotEmpty() line1!: string;
  @IsOptional() @IsString() line2?: string;
  @IsString() @IsNotEmpty() city!: string;
  @IsString() @IsNotEmpty() state!: string;
  @IsString() @IsNotEmpty() country!: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class UpdateAddressDto {
  @IsOptional() @IsIn(['FISCAL', 'BILLING', 'SHIPPING', 'BRANCH', 'PRIMARY', 'OTHER']) type?: string;
  @IsOptional() @IsString() line1?: string;
  @IsOptional() @IsString() line2?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsBoolean() isPrimary?: boolean;
}

export class TagsDto {
  @IsArray() @IsString({ each: true }) @ArrayMinSize(1) tags!: string[];
}
