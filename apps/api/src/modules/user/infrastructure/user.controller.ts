import {
  Controller, Get, Post, Patch, Put, Delete, Body, Param, UseGuards,
  NotFoundException, BadRequestException, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import { CreateUserUseCase } from '../application/create-user.use-case';
import { ManageUserUseCase } from '../application/manage-user.use-case';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateLocaleDto } from './dto/update-locale.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSecurityQuestionsDto } from './dto/security-questions.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import * as bcrypt from 'bcryptjs';

const PROFILE_UPLOAD_DIR = join(__dirname, '..', '..', '..', '..', 'uploads', 'profiles');

const imageFileFilter = (_req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp|gif)$/i;
  if (!allowedExtensions.test(extname(file.originalname))) {
    return callback(new Error('Only image files (jpg, png, webp, gif) are allowed'), false);
  }
  callback(null, true);
};

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

  @Get('users/me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        locale: true,
        imageUrl: true,
        tenantId: true,
        employeeId: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            secondLastName: true,
            identityDoc: true,
            position: true,
            department: true,
            status: true,
          },
        },
      },
    });
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

  @Patch('users/me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: any) {
    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.locale !== undefined) data.locale = dto.locale;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.employeeId !== undefined) {
      if (dto.employeeId) {
        const employee = await this.prisma.employee.findFirst({
          where: { id: dto.employeeId, tenantId: user.tenantId, deletedAt: null },
          select: { id: true },
        });
        if (!employee) throw new BadRequestException('Employee not found in this tenant');

        const linkedUser = await this.prisma.user.findFirst({
          where: {
            employeeId: dto.employeeId,
            tenantId: user.tenantId,
            id: { not: user.id },
            deletedAt: null,
          },
          select: { id: true },
        });
        if (linkedUser) throw new BadRequestException('This employee is already linked to another user');
      }
      data.employeeId = dto.employeeId;
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, email: true, name: true, phone: true, locale: true, imageUrl: true, tenantId: true },
    });
    return updated;
  }

  @Patch('users/me/password')
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: any) {
    const current = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!current || !(await bcrypt.compare(dto.currentPassword, current.passwordHash))) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }
    if (await bcrypt.compare(dto.newPassword, current.passwordHash)) {
      throw new BadRequestException('La contraseña nueva debe ser diferente de la actual');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    return { changed: true };
  }

  @Get('users/me/security-questions')
  @ApiOperation({ summary: 'Get configured security questions for the current user' })
  async getSecurityQuestions(@CurrentUser() user: any) {
    const questions = await this.prisma.userSecurityQuestion.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
      select: { position: true, question: true },
    });
    return { questions };
  }

  @Put('users/me/security-questions')
  @ApiOperation({ summary: 'Replace the current user security questions' })
  async updateSecurityQuestions(@Body() dto: UpdateSecurityQuestionsDto, @CurrentUser() user: any) {
    const allowedQuestions = [
      '¿Cuál fue el nombre de tu primera mascota?',
      '¿Cuál fue tu primera escuela?',
      '¿Cuál es el nombre de tu ciudad de nacimiento?',
      '¿Cuál es el segundo nombre de tu madre?',
      '¿Cuál fue el modelo de tu primer vehículo?',
      '¿Cuál fue el nombre de tu mejor amigo de infancia?',
    ];
    const positions = dto.answers.map((item) => item.position);
    if (new Set(positions).size !== 3 || positions.some((position) => position < 1 || position > 3)) {
      throw new BadRequestException('Debes configurar exactamente una pregunta en cada posición');
    }
    if (dto.answers.some((item) => !allowedQuestions.includes(item.question))) {
      throw new BadRequestException('Selecciona una pregunta de seguridad válida');
    }
    if (new Set(dto.answers.map((item) => item.question)).size !== 3) {
      throw new BadRequestException('Las tres preguntas de seguridad deben ser diferentes');
    }

    const records = await Promise.all(dto.answers.map(async (item) => ({
      userId: user.id,
      position: item.position,
      question: item.question,
      answerHash: await bcrypt.hash(item.answer.trim().toLocaleLowerCase('es'), 10),
    })));

    await this.prisma.$transaction([
      this.prisma.userSecurityQuestion.deleteMany({ where: { userId: user.id } }),
      this.prisma.userSecurityQuestion.createMany({ data: records }),
    ]);
    return { configured: true };
  }

  @Post('users/me/photo')
  @ApiOperation({ summary: 'Upload profile photo' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          fs.mkdirSync(PROFILE_UPLOAD_DIR, { recursive: true });
          callback(null, PROFILE_UPLOAD_DIR);
        },
        filename: (_req, file, callback) => {
          const uniqueName = `${uuid()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) throw new BadRequestException('Image file is required');

    const imageUrl = `/uploads/profiles/${file.filename}`;
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { imageUrl },
      select: { id: true, email: true, name: true, phone: true, locale: true, imageUrl: true, tenantId: true },
    });
    return updated;
  }

  @Delete('users/me/photo')
  @ApiOperation({ summary: 'Delete profile photo' })
  async deletePhoto(@CurrentUser() user: any) {
    const current = await this.prisma.user.findUnique({ where: { id: user.id }, select: { imageUrl: true } });
    if (current?.imageUrl) {
      const filePath = join(PROFILE_UPLOAD_DIR, current.imageUrl.replace('/uploads/profiles/', ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { imageUrl: null },
      select: { id: true, email: true, name: true, locale: true, imageUrl: true, tenantId: true },
    });
    return updated;
  }
}
