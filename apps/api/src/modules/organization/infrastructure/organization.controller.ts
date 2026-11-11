import {
  Controller, Get, Post, Patch, Body, Param, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManagePositionUseCase } from '../application/manage-position.use-case';
import { CreatePositionDto, UpdatePositionDto } from './dto/create-position.dto';
import { CreateAssignmentDto, EndAssignmentDto } from './dto/create-position-assignment.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

@ApiTags('Organization')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class OrganizationController {
  constructor(
    private readonly managePositionUseCase: ManagePositionUseCase,
  ) {}

  // ---- Positions ----

  @Get('tenants/:tenantId/positions')
  @ApiOperation({ summary: 'List positions for a tenant' })
  findAll(@Param('tenantId') tenantId: string) {
    return this.managePositionUseCase.findByTenant(tenantId);
  }

  @Post('tenants/:tenantId/positions')
  @ApiOperation({ summary: 'Create a position' })
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreatePositionDto) {
    try {
      return await this.managePositionUseCase.create({ ...dto, tenantId });
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('positions/:id')
  @ApiOperation({ summary: 'Get position by ID' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.managePositionUseCase.findById(id);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  @Patch('positions/:id')
  @ApiOperation({ summary: 'Update position' })
  async update(@Param('id') id: string, @Body() dto: UpdatePositionDto) {
    try {
      return await this.managePositionUseCase.update(id, dto);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('departments/:departmentId/positions')
  @ApiOperation({ summary: 'List positions by department' })
  findByDepartment(@Param('departmentId') departmentId: string) {
    return this.managePositionUseCase.findByDepartment(departmentId);
  }

  // ---- Position Assignments ----

  @Post('tenants/:tenantId/assignments')
  @ApiOperation({ summary: 'Assign an employee to a position' })
  async createAssignment(@Param('tenantId') tenantId: string, @Body() dto: CreateAssignmentDto) {
    return this.managePositionUseCase.createAssignment({ ...dto, tenantId });
  }

  @Get('employees/:employeeId/assignments')
  @ApiOperation({ summary: 'Get position assignments for an employee' })
  getAssignments(@Param('employeeId') employeeId: string) {
    return this.managePositionUseCase.findAssignmentsByEmployee(employeeId);
  }

  @Get('employees/:employeeId/current-assignment')
  @ApiOperation({ summary: 'Get current position assignment' })
  async getCurrentAssignment(@Param('employeeId') employeeId: string) {
    const assignment = await this.managePositionUseCase.findCurrentAssignment(employeeId);
    if (!assignment) throw new NotFoundException('No current assignment found');
    return assignment;
  }

  @Post('assignments/:id/end')
  @ApiOperation({ summary: 'End a position assignment' })
  async endAssignment(@Param('id') id: string, @Body() dto: EndAssignmentDto) {
    return this.managePositionUseCase.endAssignment(id, dto.endDate);
  }
}
