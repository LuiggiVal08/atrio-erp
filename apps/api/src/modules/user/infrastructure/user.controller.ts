import {
  Controller, Get, Post, Body, Param, Delete, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { ManageUserUseCase } from '../application/manage-user.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';

@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly manageUserUseCase: ManageUserUseCase,
  ) {}

  @Get('tenants/:tenantId/users')
  @ApiOperation({ summary: 'List users for a tenant' })
  findAll(@Param('tenantId') tenantId: string) {
    return this.manageUserUseCase.findByTenant(tenantId);
  }

  @Post('tenants/:tenantId/users')
  @ApiOperation({ summary: 'Create a user' })
  async create(@Param('tenantId') tenantId: string, @Body() dto: CreateUserDto) {
    try {
      return await this.createUserUseCase.execute({ ...dto, tenantId });
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.manageUserUseCase.findById(id);
    if (!user || user.deletedAt) throw new NotFoundException('User not found');
    return user;
  }

  @Delete('tenants/:tenantId/users/:id')
  @ApiOperation({ summary: 'Soft delete a user' })
  async remove(@Param('id') id: string) {
    try {
      return await this.manageUserUseCase.softDelete(id);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }
}
