import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManageEmploymentUseCase } from '../application/manage-employment.use-case';
import { CreateEmploymentDto, TerminateEmploymentDto, EmploymentActionDto } from './dto/create-employment.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { EmployeeTenantGuard } from '../../employee/infrastructure/employee-tenant.guard';

@ApiTags('Employment')
@UseGuards(JwtAuthGuard, EmployeeTenantGuard)
@ApiBearerAuth()
@Controller()
export class EmploymentController {
  constructor(
    private readonly manageEmploymentUseCase: ManageEmploymentUseCase,
  ) {}

  @Post('tenants/:tenantId/employment-relationships')
  @ApiOperation({ summary: 'Start an employment relationship' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateEmploymentDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageEmploymentUseCase.create({
        ...dto, tenantId, changedBy: user?.id || 'system',
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('tenants/:tenantId/employment-relationships')
  @ApiOperation({ summary: 'List employment relationships' })
  findAll(
    @Param('tenantId') tenantId: string,
    @Query('status') status?: string,
  ) {
    return this.manageEmploymentUseCase.findByTenant(tenantId, status);
  }

  @Get('employees/:employeeId/employment-relationships')
  @ApiOperation({ summary: 'Find relationships by employee' })
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.manageEmploymentUseCase.findByEmployee(employeeId);
  }

  @Get('employment-relationships/:id')
  @ApiOperation({ summary: 'Get employment relationship' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.manageEmploymentUseCase.findById(id);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  @Post('employment-relationships/:id/terminate')
  @ApiOperation({ summary: 'Terminate an employment relationship' })
  async terminate(
    @Param('id') id: string,
    @Body() dto: TerminateEmploymentDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageEmploymentUseCase.terminate(id, dto.endDate, dto.reason, user?.id || 'system');
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('employment-relationships/:id/suspend')
  @ApiOperation({ summary: 'Suspend an employment relationship' })
  async suspend(
    @Param('id') id: string,
    @Body() dto: EmploymentActionDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageEmploymentUseCase.suspend(id, dto.reason, user?.id || 'system');
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('employment-relationships/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended employment relationship' })
  async reactivate(
    @Param('id') id: string,
    @Body() dto: EmploymentActionDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageEmploymentUseCase.reactivate(id, dto.reason, user?.id || 'system');
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('employment-relationships/:id/changes')
  @ApiOperation({ summary: 'Get change history' })
  async getChanges(@Param('id') id: string) {
    return this.manageEmploymentUseCase.getChanges(id);
  }
}
