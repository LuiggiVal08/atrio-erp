import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
