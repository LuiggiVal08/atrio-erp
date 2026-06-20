import {
  Controller, Get, Post, Body, Param, Delete, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManageEmployeeUseCase } from '../application/manage-employee.use-case';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

@ApiTags('Employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class EmployeeController {
  constructor(
    private readonly manageEmployeeUseCase: ManageEmployeeUseCase,
  ) {}

  @Get('tenants/:tenantId/employees')
  @ApiOperation({ summary: 'List employees for a tenant' })
  findAll(@Param('tenantId') tenantId: string) {
    return this.manageEmployeeUseCase.findByTenant(tenantId);
  }

  @Post('tenants/:tenantId/employees')
  @ApiOperation({ summary: 'Create an employee' })
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateEmployeeDto) {
    try {
      return await this.manageEmployeeUseCase.create({ ...dto, tenantId });
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  async findOne(@Param('id') id: string) {
    const employee = await this.manageEmployeeUseCase.findById(id);
    if (!employee || employee.deletedAt) throw new NotFoundException('Employee not found');
    return employee;
  }

  @Delete('tenants/:tenantId/employees/:id')
  @ApiOperation({ summary: 'Soft delete an employee' })
  async remove(@Param('id') id: string) {
    try {
      return await this.manageEmployeeUseCase.softDelete(id);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }
}
