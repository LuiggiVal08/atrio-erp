import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ManageContractUseCase } from '../application/manage-contract.use-case';
import { CreateContractDto, RenewContractDto, TerminateContractDto } from './dto/contract.dto';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Contracts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller()
export class ContractController {
  constructor(
    private readonly manageContractUseCase: ManageContractUseCase,
  ) {}

  @Post('employment-relationships/:relationshipId/contracts')
  @ApiOperation({ summary: 'Create a contract' })
  async create(
    @Param('relationshipId') relationshipId: string,
    @Body() dto: CreateContractDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageContractUseCase.create({
        ...dto, relationshipId, reason: dto.reason,
        changedBy: user?.id || 'system',
      } as any);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('employment-relationships/:relationshipId/contracts/:contractId/renew')
  @ApiOperation({ summary: 'Renew a contract' })
  async renew(
    @Param('relationshipId') relationshipId: string,
    @Param('contractId') contractId: string,
    @Body() dto: RenewContractDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageContractUseCase.renew({
        ...dto, relationshipId, previousContractId: contractId,
        reason: dto.reason, changedBy: user?.id || 'system',
      } as any);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('contracts/:id/terminate')
  @ApiOperation({ summary: 'Terminate a contract' })
  async terminate(
    @Param('id') id: string,
    @Body() dto: TerminateContractDto,
    @CurrentUser() user: any,
  ) {
    try {
      return await this.manageContractUseCase.terminate(id, dto.terminatedAt, dto.reason, user?.id);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Get('employment-relationships/:relationshipId/contracts/current')
  @ApiOperation({ summary: 'Get current active contract' })
  async findCurrent(
    @Param('relationshipId') relationshipId: string,
    @Query('effectiveDate') effectiveDate?: string,
  ) {
    const contract = await this.manageContractUseCase.findCurrent(relationshipId, effectiveDate);
    if (!contract) throw new NotFoundException('No active contract found');
    return contract;
  }

  @Get('employment-relationships/:relationshipId/contracts')
  @ApiOperation({ summary: 'Get contract history' })
  findHistory(@Param('relationshipId') relationshipId: string) {
    return this.manageContractUseCase.findHistory(relationshipId);
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Get contract by ID' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.manageContractUseCase.findById(id);
    } catch (error: any) {
      throw new NotFoundException(error.message);
    }
  }
}
