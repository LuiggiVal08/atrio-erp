import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManageCompensationUseCase } from '../application/manage-compensation.use-case';
import { CreateCompensationDto, AdjustCompensationDto } from './dto/compensation.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Compensation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class CompensationController {
  constructor(
    private readonly manageCompensationUseCase: ManageCompensationUseCase,
  ) {}

  @Post('employment-relationships/:relationshipId/compensation')
  @ApiOperation({ summary: 'Create a compensation agreement' })
  async create(
    @Param('relationshipId') relationshipId: string,
    @Body() dto: CreateCompensationDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageCompensationUseCase.create({
        ...dto, relationshipId, changedBy: user?.id || 'system',
      } as any);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('employment-relationships/:relationshipId/compensation/:agreementId/adjust')
  @ApiOperation({ summary: 'Adjust compensation (creates new agreement)' })
  async adjust(
    @Param('relationshipId') relationshipId: string,
    @Param('agreementId') agreementId: string,
    @Body() dto: AdjustCompensationDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageCompensationUseCase.adjust({
        ...dto, relationshipId, previousAgreementId: agreementId,
        changedBy: user?.id || 'system',
      } as any);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('employment-relationships/:relationshipId/compensation/current')
  @ApiOperation({ summary: 'Get current compensation' })
  async findCurrent(
    @Param('relationshipId') relationshipId: string,
    @Query('effectiveDate') effectiveDate?: string,
  ) {
    const result = effectiveDate
      ? await this.manageCompensationUseCase.findCurrentAt(relationshipId, effectiveDate)
      : await this.manageCompensationUseCase.findCurrent(relationshipId);
    if (!result) throw new NotFoundException('No active compensation agreement found');
    return result;
  }

  @Get('employment-relationships/:relationshipId/compensation')
  @ApiOperation({ summary: 'Get compensation history' })
  findHistory(@Param('relationshipId') relationshipId: string) {
    return this.manageCompensationUseCase.findHistory(relationshipId);
  }

  @Get('compensation/:id')
  @ApiOperation({ summary: 'Get compensation by ID' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.manageCompensationUseCase.findById(id);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }
}
