import {
  Controller, Get, Post, Body, Param, Patch, Delete, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateRoleUseCase } from '../application/create-role.use-case';
import { ManageRoleUseCase } from '../application/manage-role.use-case';
import { ListPermissionsUseCase } from '../application/list-permissions.use-case';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

@ApiTags('RBAC')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly manageRoleUseCase: ManageRoleUseCase,
    private readonly listPermissionsUseCase: ListPermissionsUseCase,
  ) {}

  @Get('tenants/:tenantId/rbac/permissions')
  @ApiOperation({ summary: 'List all system permissions' })
  listPermissions() {
    return this.listPermissionsUseCase.execute();
  }

  @Get('tenants/:tenantId/rbac/roles')
  @ApiOperation({ summary: 'List roles for a tenant' })
  listRoles(@Param('tenantId') tenantId: string) {
    return this.manageRoleUseCase.findByTenant(tenantId);
  }

  @Post('tenants/:tenantId/rbac/roles')
  @ApiOperation({ summary: 'Create a role with permissions' })
  async createRole(@Param('tenantId') tenantId: string, @Body() dto: CreateRoleDto) {
    try {
      return await this.createRoleUseCase.execute({ ...dto, tenantId });
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Patch('tenants/:tenantId/rbac/roles/:id')
  @ApiOperation({ summary: 'Update a role' })
  async updateRole(@Param('id') id: string, @Body() dto: Partial<CreateRoleDto>) {
    try {
      return await this.manageRoleUseCase.update(id, dto);
    } catch (error: any) {
      if (error.message?.includes('not found')) throw new NotFoundException(error.message);
      if (error.message?.includes('Cannot edit')) throw new BadRequestException(error.message);
      throw error;
    }
  }

  @Delete('tenants/:tenantId/rbac/roles/:id')
  @ApiOperation({ summary: 'Delete a role (soft)' })
  async removeRole(@Param('id') id: string) {
    try {
      return await this.manageRoleUseCase.remove(id);
    } catch (error: any) {
      if (error.message?.includes('not found')) throw new NotFoundException(error.message);
      if (error.message?.includes('Cannot delete')) throw new BadRequestException(error.message);
      throw error;
    }
  }

  @Post('tenants/:tenantId/rbac/users/:userId/roles')
  @ApiOperation({ summary: 'Assign roles to a user' })
  assignRoles(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return Promise.all(
      dto.roleIds.map((roleId) => this.manageRoleUseCase.assignToUser(roleId, userId)),
    );
  }
}
