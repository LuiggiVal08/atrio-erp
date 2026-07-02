import {
  Controller, Post, Body, Get, Param, Patch, Delete, UseGuards, HttpCode, HttpStatus,
  NotFoundException, BadRequestException, Req, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateDocumentUseCase } from '../application/create-document.use-case';
import { SubmitDocumentUseCase } from '../application/submit-document.use-case';
import { ApproveDocumentUseCase } from '../application/approve-document.use-case';
import { CreateCounterDocumentUseCase } from '../application/create-counter-document.use-case';
import { TransitionDocumentUseCase } from '../application/transition-document.use-case';
import { QueryDocumentUseCase } from '../application/query-document.use-case';
import { DocumentStatus } from '../domain/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { TransitionDocumentDto, SubmitDocumentDto, ApproveDocumentDto, RejectDocumentDto, CreateCounterDocumentDto } from './dto/transition-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';

@ApiTags('Documents')
@Controller()
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('documents')
@ApiBearerAuth()
export class DocumentController {
  constructor(
    private readonly createDocumentUseCase: CreateDocumentUseCase,
    private readonly submitDocumentUseCase: SubmitDocumentUseCase,
    private readonly approveDocumentUseCase: ApproveDocumentUseCase,
    private readonly createCounterDocumentUseCase: CreateCounterDocumentUseCase,
    private readonly transitionDocumentUseCase: TransitionDocumentUseCase,
    private readonly queryDocumentUseCase: QueryDocumentUseCase,
  ) {}

  @Post('tenants/:tenantId/documents')
  @RequirePermission('documents:create')
  @ApiOperation({ summary: 'Create a new document in draft status' })
  async create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateDocumentDto,
    @Req() req: any,
  ) {
    try {
      return await this.createDocumentUseCase.execute(dto, {
        tenantId,
        userId: req.user.id,
      });
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('tenants/:tenantId/documents')
  @RequirePermission('documents:read')
  @ApiOperation({ summary: 'List documents with optional filters' })
  async findAll(
    @Param('tenantId') tenantId: string,
    @Query() query: QueryDocumentDto,
  ) {
    const filters = {
      ...query,
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
      dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
    };
    return this.queryDocumentUseCase.execute(tenantId, filters);
  }

  @Get('tenants/:tenantId/documents/:id')
  @RequirePermission('documents:read')
  @ApiOperation({ summary: 'Get a single document with lines' })
  async findOne(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.queryDocumentUseCase.findById(id, tenantId);
    if (!result) throw new NotFoundException('Document not found');
    return result;
  }

  @Post('tenants/:tenantId/documents/:id/submit')
  @RequirePermission('documents:submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a document for approval' })
  async submit(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    try {
      return await this.submitDocumentUseCase.execute(id, {
        tenantId,
        userId: req.user.id,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('tenants/:tenantId/documents/:id/approve')
  @RequirePermission('documents:approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending document (makes it immutable)' })
  async approve(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    try {
      return await this.approveDocumentUseCase.execute(id, {
        tenantId,
        userId: req.user.id,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('tenants/:tenantId/documents/:id/reject')
  @RequirePermission('documents:reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a pending document (returns to draft)' })
  async reject(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RejectDocumentDto,
    @Req() req: any,
  ) {
    try {
      return await this.transitionDocumentUseCase.execute(
        id,
        DocumentStatus.DRAFT,
        { tenantId, userId: req.user.id },
        { rejectionReason: dto.rejectionReason },
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('tenants/:tenantId/documents/:id/transition')
  @RequirePermission('documents:transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generic state transition' })
  async transition(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: TransitionDocumentDto,
    @Req() req: any,
  ) {
    try {
      return await this.transitionDocumentUseCase.execute(id, dto.targetStatus, {
        tenantId,
        userId: req.user.id,
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('tenants/:tenantId/documents/:id/counter')
  @RequirePermission('documents:counter')
  @ApiOperation({ summary: 'Create a counter-document referencing an approved document' })
  @HttpCode(HttpStatus.CREATED)
  async createCounter(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: CreateCounterDocumentDto,
    @Req() req: any,
  ) {
    try {
      return await this.createCounterDocumentUseCase.execute(
        id,
        {
          counterDocumentType: dto.counterDocumentType,
          reason: dto.reason,
          lines: dto.lines,
        },
        { tenantId, userId: req.user.id },
      );
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete('tenants/:tenantId/documents/:id')
  @RequirePermission('documents:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a document (draft/cancelled only)' })
  async delete(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.queryDocumentUseCase.findById(id, tenantId);
    if (!result) throw new NotFoundException('Document not found');
    if (result.document.status !== 'draft' && result.document.status !== 'cancelled') {
      throw new BadRequestException('Only draft or cancelled documents can be deleted');
    }
    await this.queryDocumentUseCase.softDelete(id, tenantId);
  }

  @Get('tenants/:tenantId/documents/:id/events')
  @RequirePermission('documents:read')
  @ApiOperation({ summary: 'Get events for a document' })
  async getEvents(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
  ) {
    return this.queryDocumentUseCase.getEvents(id, tenantId);
  }
}
