import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
  NotFoundException, BadRequestException, Put, UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManageEmployeeUseCase } from '../application/manage-employee.use-case';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/create-department.dto';
import { CreateSalaryEntryDto } from './dto/create-salary-entry.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { EmployeePaymentDetailsDto } from './dto/employee-payment-details.dto';

interface EmployeeUser {
  id: string;
  tenantId: string;
}

@ApiTags('Employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class EmployeeController {
  constructor(
    private readonly manageEmployeeUseCase: ManageEmployeeUseCase,
  ) {}

  @Get('employees/:id/payment-details')
  @UseGuards(RbacGuard)
  @RequirePermission('employee:bank-details:read')
  @ApiOperation({ summary: 'Get current employee payment details' })
  async getPaymentDetails(@Param('id') id: string, @CurrentUser() user: EmployeeUser) {
    const tenantId = this.tenantId(user);
    const details = await this.manageEmployeeUseCase.findPaymentDetails(id, tenantId);
    return details;
  }

  @Put('employees/:id/payment-details')
  @UseGuards(RbacGuard)
  @RequirePermission('employee:bank-details:update')
  @ApiOperation({ summary: 'Create a version of employee payment details' })
  async savePaymentDetails(
    @Param('id') id: string,
    @Body() dto: EmployeePaymentDetailsDto,
    @CurrentUser() user: EmployeeUser,
  ) {
    const details = await this.manageEmployeeUseCase.savePaymentDetails(id, this.tenantId(user), user.id, dto);
    if (!details) throw new NotFoundException('Employee not found');
    return details;
  }

  @Delete('employees/:id/payment-details')
  @UseGuards(RbacGuard)
  @RequirePermission('employee:bank-details:update')
  @ApiOperation({ summary: 'End the current employee payment details record' })
  async clearPaymentDetails(@Param('id') id: string, @CurrentUser() user: EmployeeUser) {
    const cleared = await this.manageEmployeeUseCase.clearPaymentDetails(id, this.tenantId(user));
    if (!cleared) throw new NotFoundException('Employee not found');
  }

  // ---- Employees ----

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

  @Patch('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  async update(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    try {
      return await this.manageEmployeeUseCase.update(id, dto);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
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

  // ---- Departments ----

  @Get('tenants/:tenantId/departments')
  @ApiOperation({ summary: 'List departments' })
  listDepartments(@Param('tenantId') tenantId: string) {
    return this.manageEmployeeUseCase.findAllDepartments(tenantId);
  }

  @Post('tenants/:tenantId/departments')
  @ApiOperation({ summary: 'Create department' })
  async createDepartment(@Param('tenantId') tenantId: string, @Body() dto: CreateDepartmentDto) {
    return this.manageEmployeeUseCase.createDepartment({ tenantId, ...dto });
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department by ID' })
  async getDepartment(@Param('id') id: string) {
    const dept = await this.manageEmployeeUseCase.findDepartmentById(id);
    return dept;
  }

  @Patch('departments/:id')
  @ApiOperation({ summary: 'Update department' })
  async updateDepartment(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.manageEmployeeUseCase.updateDepartment(id, dto);
  }

  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete department' })
  async deleteDepartment(@Param('id') id: string) {
    await this.manageEmployeeUseCase.deleteDepartment(id);
  }

  // ---- Salary History ----

  @Get('employees/:id/salary-history')
  @ApiOperation({ summary: 'Get salary history for employee' })
  async getSalaryHistory(@Param('id') id: string) {
    return this.manageEmployeeUseCase.findSalaryHistory(id);
  }

  @Post('employees/:id/salary-history')
  @ApiOperation({ summary: 'Add salary history entry' })
  async createSalaryEntry(@Param('id') id: string, @Body() dto: CreateSalaryEntryDto) {
    return this.manageEmployeeUseCase.createSalaryEntry({ employeeId: id, ...dto });
  }

  private tenantId(user: EmployeeUser | null | undefined): string {
    if (!user?.tenantId) throw new UnauthorizedException('Authenticated tenant context is required');
    return user.tenantId;
  }
}
