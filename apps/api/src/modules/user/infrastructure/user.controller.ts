import {
  Controller, Get, Post, Patch, Body, Param, Delete, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { ManageUserUseCase } from '../application/manage-user.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@ApiTags('Users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly manageUserUseCase: ManageUserUseCase,
    private readonly prisma: PrismaService,
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

  @Patch('users/me/locale')
  @ApiOperation({ summary: 'Update current user locale preference' })
  async updateLocale(@Body() dto: UpdateLocaleDto, @CurrentUser() user: any) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { locale: dto.locale },
    });
    return { locale: dto.locale };
  }
}
