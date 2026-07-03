import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const DEMO_TENANT_ID = '188a33c7-a5f4-438d-8db5-468c2175c044';

const PERMISSIONS = [
  { code: 'tenant.read', name: 'View tenant', module: 'tenant', action: 'read' },
  { code: 'tenant.update', name: 'Edit tenant', module: 'tenant', action: 'update' },
  { code: 'user.create', name: 'Create user', module: 'user', action: 'create' },
  { code: 'user.read', name: 'View user', module: 'user', action: 'read' },
  { code: 'user.update', name: 'Edit user', module: 'user', action: 'update' },
  { code: 'user.delete', name: 'Delete user', module: 'user', action: 'delete' },
  { code: 'employee.create', name: 'Create employee', module: 'employee', action: 'create' },
  { code: 'employee.read', name: 'View employee', module: 'employee', action: 'read' },
  { code: 'employee.update', name: 'Edit employee', module: 'employee', action: 'update' },
  { code: 'employee.delete', name: 'Delete employee', module: 'employee', action: 'delete' },
  { code: 'role.create', name: 'Create role', module: 'role', action: 'create' },
  { code: 'role.read', name: 'View role', module: 'role', action: 'read' },
  { code: 'role.update', name: 'Edit role', module: 'role', action: 'update' },
  { code: 'role.delete', name: 'Delete role', module: 'role', action: 'delete' },
  { code: 'role.assign', name: 'Assign role', module: 'role', action: 'assign' },
  { code: 'audit.read', name: 'View audit logs', module: 'audit', action: 'read' },
  { code: 'reports:dashboard:view', name: 'View dashboard', module: 'reports', action: 'read' },
  { code: 'reports:dashboard:manage', name: 'Manage dashboard widgets', module: 'reports', action: 'update' },
  { code: 'reports:export:request', name: 'Request report export', module: 'reports', action: 'create' },
  { code: 'reports:export:view', name: 'View export status', module: 'reports', action: 'read' },
  { code: 'reports:history:view', name: 'View report history', module: 'reports', action: 'read' },
  { code: 'reports:history:delete', name: 'Delete report history', module: 'reports', action: 'delete' },
  { code: 'reports:definitions:view', name: 'View report definitions', module: 'reports', action: 'read' },
  { code: 'reports:definitions:manage', name: 'Manage report definitions', module: 'reports', action: 'update' },
  { code: 'reports:definitions:execute', name: 'Execute report definition', module: 'reports', action: 'create' },
  { code: 'sales:order:create', name: 'Create sales order', module: 'sales', action: 'create' },
  { code: 'sales:order:read', name: 'View sales orders', module: 'sales', action: 'read' },
  { code: 'sales:order:update', name: 'Edit sales order', module: 'sales', action: 'update' },
  { code: 'sales:order:delete', name: 'Delete sales order', module: 'sales', action: 'delete' },
  { code: 'sales:invoice:create', name: 'Create sales invoice', module: 'sales', action: 'create' },
  { code: 'sales:invoice:read', name: 'View sales invoices', module: 'sales', action: 'read' },
  { code: 'sales:invoice:update', name: 'Edit sales invoice', module: 'sales', action: 'update' },
  { code: 'sales:invoice:delete', name: 'Delete sales invoice', module: 'sales', action: 'delete' },
  { code: 'sales:invoice:approve', name: 'Approve sales invoice', module: 'sales', action: 'update' },
  { code: 'sales:invoice:pay', name: 'Pay sales invoice', module: 'sales', action: 'update' },
  { code: 'sales:commission:read', name: 'View commissions', module: 'sales', action: 'read' },
  { code: 'sales:commission:pay', name: 'Pay commissions', module: 'sales', action: 'update' },
  { code: 'sales:return:create', name: 'Create sales return', module: 'sales', action: 'create' },
  { code: 'sales:return:read', name: 'View sales returns', module: 'sales', action: 'read' },
  { code: 'sales:return:update', name: 'Edit sales return status', module: 'sales', action: 'update' },
  { code: 'sales:return:delete', name: 'Delete sales return', module: 'sales', action: 'delete' },
  { code: 'purchasing:order:create', name: 'Create purchase order', module: 'purchasing', action: 'create' },
  { code: 'purchasing:order:read', name: 'View purchase orders', module: 'purchasing', action: 'read' },
  { code: 'purchasing:order:update', name: 'Edit purchase order', module: 'purchasing', action: 'update' },
  { code: 'purchasing:order:delete', name: 'Delete purchase order', module: 'purchasing', action: 'delete' },
  { code: 'purchasing:order:approve', name: 'Approve purchase order', module: 'purchasing', action: 'update' },
  { code: 'purchasing:order:receive', name: 'Receive purchase order', module: 'purchasing', action: 'update' },
  { code: 'purchasing:order:return', name: 'Return purchase order items', module: 'purchasing', action: 'create' },
  { code: 'purchasing:return:read', name: 'View purchase returns', module: 'purchasing', action: 'read' },
  { code: 'purchasing:return:update', name: 'Edit purchase return', module: 'purchasing', action: 'update' },
  { code: 'purchasing:return:delete', name: 'Delete purchase return', module: 'purchasing', action: 'delete' },
  { code: 'purchasing:price-list:create', name: 'Create price list', module: 'purchasing', action: 'create' },
  { code: 'purchasing:price-list:read', name: 'View price lists', module: 'purchasing', action: 'read' },
  { code: 'purchasing:price-list:update', name: 'Edit price list', module: 'purchasing', action: 'update' },
  { code: 'purchasing:price-list:delete', name: 'Delete price list', module: 'purchasing', action: 'delete' },
  { code: 'inventory:transfer:create', name: 'Create stock transfer', module: 'inventory', action: 'create' },
  { code: 'inventory:transfer:read', name: 'View stock transfers', module: 'inventory', action: 'read' },
  { code: 'inventory:transfer:update', name: 'Complete/cancel transfer', module: 'inventory', action: 'update' },
  { code: 'inventory:reorder-point:create', name: 'Set reorder point', module: 'inventory', action: 'create' },
  { code: 'inventory:reorder-point:read', name: 'View reorder points', module: 'inventory', action: 'read' },
  { code: 'inventory:reorder-point:update', name: 'Edit reorder point', module: 'inventory', action: 'update' },
  { code: 'inventory:reorder-point:delete', name: 'Delete reorder point', module: 'inventory', action: 'delete' },
  { code: 'cash-payments:register:create', name: 'Create cash register', module: 'cash-payments', action: 'create' },
  { code: 'cash-payments:register:read', name: 'View cash registers', module: 'cash-payments', action: 'read' },
  { code: 'cash-payments:register:delete', name: 'Delete cash register', module: 'cash-payments', action: 'delete' },
  { code: 'cash-payments:payment-method:create', name: 'Create payment method', module: 'cash-payments', action: 'create' },
  { code: 'cash-payments:payment-method:read', name: 'View payment methods', module: 'cash-payments', action: 'read' },
  { code: 'cash-payments:payment-method:delete', name: 'Delete payment method', module: 'cash-payments', action: 'delete' },
  { code: 'cash-payments:movement:create', name: 'Create cash movement', module: 'cash-payments', action: 'create' },
  { code: 'cash-payments:movement:read', name: 'View cash movements', module: 'cash-payments', action: 'read' },
  { code: 'cash-payments:bank-account:create', name: 'Create bank account', module: 'cash-payments', action: 'create' },
  { code: 'cash-payments:bank-account:read', name: 'View bank accounts', module: 'cash-payments', action: 'read' },
  { code: 'cash-payments:bank-account:update', name: 'Edit bank account', module: 'cash-payments', action: 'update' },
  { code: 'cash-payments:bank-account:delete', name: 'Delete bank account', module: 'cash-payments', action: 'delete' },
  { code: 'employee:department:create', name: 'Create department', module: 'employee', action: 'create' },
  { code: 'employee:department:read', name: 'View departments', module: 'employee', action: 'read' },
  { code: 'employee:department:update', name: 'Edit department', module: 'employee', action: 'update' },
  { code: 'employee:department:delete', name: 'Delete department', module: 'employee', action: 'delete' },
  { code: 'employee:salary:create', name: 'Create salary entry', module: 'employee', action: 'create' },
  { code: 'employee:salary:read', name: 'View salary history', module: 'employee', action: 'read' },
];

async function main() {
  console.log('Seeding...');

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }

  console.log(`Seeded ${PERMISSIONS.length} permissions`);

  const tenant = await prisma.tenant.upsert({
    where: { id: DEMO_TENANT_ID },
    update: { enabledModules: ['reports', 'sales', 'inventory', 'purchasing', 'cash-payments', 'cash', 'clients', 'vendors', 'localization', 'employees'] },
    create: {
      id: DEMO_TENANT_ID,
      legalName: 'Demo Company',
      taxId: 'J-123456789',
      enabledModules: ['reports', 'sales', 'inventory', 'purchasing', 'cash-payments', 'cash', 'clients', 'vendors', 'localization', 'employees'],
    },
  });
  console.log(`Seeded tenant: ${tenant.id}`);

  const passwordHash = await bcrypt.hash('TempPass123!', 10);
  const user = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: DEMO_TENANT_ID, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: DEMO_TENANT_ID,
      email: 'admin@demo.com',
      passwordHash,
      name: 'Admin Demo',
      locale: 'es',
    },
  });
  console.log(`Seeded user: ${user.email}`);

  const adminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: DEMO_TENANT_ID, name: 'Admin' } },
    update: {},
    create: {
      tenantId: DEMO_TENANT_ID,
      name: 'Admin',
      isSystem: true,
    },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }
  console.log(`Assigned ${allPermissions.length} permissions to Admin role`);

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
    update: {},
    create: { userId: user.id, roleId: adminRole.id },
  });
  console.log(`Assigned Admin role to user ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
