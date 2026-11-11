import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
  NotFoundException, BadRequestException, HttpCode, HttpStatus, Inject,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PartnerService } from '../application/partner.service';
import { PARTNER_REPOSITORY } from '../domain/partner.repository.interface';
import type { PartnerRepository } from '../domain/partner.repository.interface';
import {
  CreatePartnerDto, UpdatePartnerDto, PartnerFiltersDto,
  AssignRoleDto, CreateContactDto, UpdateContactDto,
  CreateAddressDto, UpdateAddressDto, TagsDto,
} from './dto/partner.dto';
@ApiTags('Business Partners')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
    @Inject(PARTNER_REPOSITORY) private readonly partnerRepository: PartnerRepository,
  ) {}

  @Get('tenants/:tenantId/partners')
  @ApiOperation({ summary: 'List partners with filters and pagination' })
  async findAll(
    @Param('tenantId') tenantId: string,
    @Query() filters: PartnerFiltersDto,
  ) {
    const result = await this.partnerRepository.findMany({
      tenantId,
      search: filters.search,
      roles: filters.roles as any,
      types: filters.types as any,
      statuses: filters.statuses as any,
      tags: filters.tags,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 50,
      sortBy: (filters.sortBy as any) ?? 'legalName',
      sortOrder: filters.sortOrder ?? 'asc',
    });
    return result;
  }

  @Post('tenants/:tenantId/partners')
  @ApiOperation({ summary: 'Create a partner' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreatePartnerDto,
    @CurrentUser() user: any,
  ) {
    try {
      const partner = await this.partnerService.createPartner({
        tenantId,
        type: dto.type as any,
        legalName: dto.legalName,
        taxId: dto.taxId ?? null,
        commercialName: dto.commercialName ?? null,
        website: dto.website ?? null,
        paymentTerms: dto.paymentTerms ?? null,
        deliveryDays: dto.deliveryDays ?? null,
        roles: [(dto.type === 'COMPANY' ? 'CUSTOMER' : 'PROSPECT') as any],
        tags: dto.tags,
        createdById: user?.id ?? 'system',
        updatedById: user?.id ?? 'system',
      });

      if (dto.contacts?.length) {
        for (const c of dto.contacts) {
          await this.partnerRepository.addContact({
            partnerId: partner.id,
            fullName: c.fullName,
            position: c.position ?? null,
            email: c.email ?? null,
            phone: c.phone ?? null,
            mobile: c.mobile ?? null,
            isPrimary: c.isPrimary ?? false,
            createdById: user?.id ?? 'system',
            updatedById: user?.id ?? 'system',
          });
        }
      }

      if (dto.addresses?.length) {
        for (const a of dto.addresses) {
          await this.partnerRepository.addAddress({
            partnerId: partner.id,
            type: a.type as any,
            line1: a.line1,
            line2: a.line2 ?? null,
            city: a.city,
            state: a.state,
            country: a.country,
            postalCode: a.postalCode ?? null,
            isPrimary: a.isPrimary ?? false,
            createdById: user?.id ?? 'system',
            updatedById: user?.id ?? 'system',
          });
        }
      }

      return this.partnerRepository.findById(partner.id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('tenants/:tenantId/partners/:id')
  @ApiOperation({ summary: 'Get partner detail with relations' })
  async findOne(@Param('id') id: string) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  @Patch('tenants/:tenantId/partners/:id')
  @ApiOperation({ summary: 'Update a partner' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePartnerDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.partnerService.updatePartner(id, {
        legalName: dto.legalName,
        type: dto.type as any,
        taxId: dto.taxId ?? null,
        commercialName: dto.commercialName ?? null,
        website: dto.website ?? null,
        paymentTerms: dto.paymentTerms ?? null,
        deliveryDays: dto.deliveryDays ?? null,
        updatedById: user?.id ?? 'system',
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  @Delete('tenants/:tenantId/partners/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a partner (soft delete)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.partnerService.softDeletePartner(id, user?.id ?? 'system');
  }

  @Post('tenants/:tenantId/partners/:id/roles')
  @ApiOperation({ summary: 'Assign a role to partner' })
  async assignRole(
    @Param('id') id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerService.assignRole(id, dto.role as any);
    await this.partnerRepository.addEvent(id, 'role.assigned', { role: dto.role }, user?.id ?? 'system');
    return { role: dto.role, assignedAt: new Date().toISOString() };
  }

  @Delete('tenants/:tenantId/partners/:id/roles/:role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a role from partner' })
  async removeRole(
    @Param('id') id: string,
    @Param('role') role: string,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.removeRole(id, role as any);
    await this.partnerRepository.addEvent(id, 'role.removed', { role }, user?.id ?? 'system');
  }

  @Post('tenants/:tenantId/partners/:id/contacts')
  @ApiOperation({ summary: 'Add a contact to partner' })
  async addContact(
    @Param('id') id: string,
    @Body() dto: CreateContactDto,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    return this.partnerRepository.addContact({
      partnerId: id,
      fullName: dto.fullName,
      position: dto.position ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      mobile: dto.mobile ?? null,
      isPrimary: dto.isPrimary ?? false,
      createdById: user?.id ?? 'system',
      updatedById: user?.id ?? 'system',
    });
  }

  @Patch('tenants/:tenantId/partners/:id/contacts/:contactId')
  @ApiOperation({ summary: 'Update a contact' })
  async updateContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
    @Body() dto: UpdateContactDto,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.updateContact(contactId, {
      fullName: dto.fullName,
      position: dto.position ?? null,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      mobile: dto.mobile ?? null,
      isPrimary: dto.isPrimary,
      updatedById: user?.id ?? 'system',
    });
  }

  @Delete('tenants/:tenantId/partners/:id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contact' })
  async removeContact(
    @Param('id') id: string,
    @Param('contactId') contactId: string,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.softDeleteContact(contactId);
  }

  @Post('tenants/:tenantId/partners/:id/addresses')
  @ApiOperation({ summary: 'Add an address to partner' })
  async addAddress(
    @Param('id') id: string,
    @Body() dto: CreateAddressDto,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    return this.partnerRepository.addAddress({
      partnerId: id,
      type: dto.type as any,
      line1: dto.line1,
      line2: dto.line2 ?? null,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      postalCode: dto.postalCode ?? null,
      isPrimary: dto.isPrimary ?? false,
      createdById: user?.id ?? 'system',
      updatedById: user?.id ?? 'system',
    });
  }

  @Patch('tenants/:tenantId/partners/:id/addresses/:addressId')
  @ApiOperation({ summary: 'Update an address' })
  async updateAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.updateAddress(addressId, {
      type: dto.type as any,
      line1: dto.line1,
      line2: dto.line2 ?? null,
      city: dto.city,
      state: dto.state,
      country: dto.country,
      postalCode: dto.postalCode ?? null,
      isPrimary: dto.isPrimary,
      updatedById: user?.id ?? 'system',
    });
  }

  @Delete('tenants/:tenantId/partners/:id/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  async removeAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.softDeleteAddress(addressId);
  }

  @Post('tenants/:tenantId/partners/:id/tags')
  @ApiOperation({ summary: 'Add tags to partner' })
  async addTags(
    @Param('id') id: string,
    @Body() dto: TagsDto,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.addTags(id, dto.tags);
    await this.partnerRepository.addEvent(id, 'tags.updated', { added: dto.tags }, user?.id ?? 'system');
    return { tags: dto.tags };
  }

  @Delete('tenants/:tenantId/partners/:id/tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove tags from partner' })
  async removeTags(
    @Param('id') id: string,
    @Body() dto: TagsDto,
    @CurrentUser() user: any,
  ) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    await this.partnerRepository.removeTags(id, dto.tags);
    await this.partnerRepository.addEvent(id, 'tags.updated', { removed: dto.tags }, user?.id ?? 'system');
    return { tags: dto.tags };
  }

  @Get('tenants/:tenantId/partners/:id/commercial-history')
  @ApiOperation({ summary: 'Get commercial history (delegated to Sales/Purchasing)' })
  async getCommercialHistory(@Param('id') id: string) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    return {
      sales: { lastInvoices: [], pendingInvoices: [], totalPaid: { amount: 0, currency: 'USD' }, totalPending: { amount: 0, currency: 'USD' } },
      purchases: { lastOrders: [], totalSpent: { amount: 0, currency: 'USD' } },
      credit: { limit: { amount: 0, currency: 'USD' }, currentBalance: { amount: 0, currency: 'USD' }, available: { amount: 0, currency: 'USD' } },
    };
  }

  @Get('tenants/:tenantId/partners/:id/events')
  @ApiOperation({ summary: 'Get partner event timeline' })
  async getEvents(@Param('id') id: string) {
    const partner = await this.partnerService.findPartnerById(id);
    if (!partner) throw new NotFoundException('Partner not found');
    return this.partnerRepository.findEvents(id);
  }
}
