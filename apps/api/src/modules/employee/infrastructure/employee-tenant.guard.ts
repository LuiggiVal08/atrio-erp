import { CanActivate, ExecutionContext, Injectable, ForbiddenException, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

/** Applied after JWT authentication to every people/organization/employment route. */
@Injectable()
export class EmployeeTenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw new UnauthorizedException('Authenticated tenant context is required');
    const params = req.params ?? {};
    const body = req.body ?? {};
    if (params.tenantId && params.tenantId !== tenantId) throw new ForbiddenException('Tenant URL does not match authenticated context');
    const path: string = req.route?.path ?? '';
    const resource = (name: string) => new RegExp(`(?:^|/)${name}/:id(?:/|$)`).test(path);
    const query = req.query ?? {};
    if (query.employeeId && typeof query.employeeId !== 'string') throw new BadRequestException('Invalid employee filter');
    const check = async (model: string, id: string | undefined, where: object = {}) => {
      if (!id) return null;
      const record = await (this.prisma as any)[model].findFirst({ where: { id, ...where } });
      if (!record) throw new NotFoundException(`${model} not found`);
      return record;
    };
    const employeeId = params.employeeId ?? (resource('employees') ? params.id : undefined);
    await check('employee', employeeId, { tenantId, deletedAt: null });
    await check('employee', body.employeeId, { tenantId, deletedAt: null });
    await check('employee', query.employeeId, { tenantId, deletedAt: null });
    await check('employee', body.managerEmployeeId, { tenantId, deletedAt: null });
    const departmentId = params.departmentId ?? (resource('departments') ? params.id : undefined);
    await check('department', departmentId, { tenantId });
    await check('department', body.departmentId, { tenantId, isActive: true });
    const positionId = resource('positions') ? params.id : body.positionId;
    const position = await check('position', positionId, { tenantId });
    if (body.employeeId && position && !position.active) throw new BadRequestException('Position is inactive');
    if (resource('assignments')) await check('positionAssignment', params.id, { tenantId });
    const relationshipId = params.relationshipId ?? (resource('employment-relationships') ? params.id : undefined);
    await check('employmentRelationship', relationshipId, { tenantId });
    if (params.contractId || resource('contracts')) {
      await check('contract', params.contractId ?? params.id, { ...(relationshipId ? { relationshipId } : {}), relationship: { tenantId } });
    }
    if (params.agreementId || resource('compensation')) {
      await check('compensationAgreement', params.agreementId ?? params.id, { ...(relationshipId ? { relationshipId } : {}), relationship: { tenantId } });
    }
    return true;
  }
}
