import {
  PrismaClient,
  PartnerType,
  PartnerStatus,
  PartnerRoleType,
  AddressType,
  IdentificationType,
  PurchasingOrderStatus,
  GoodsReceiptStatus,
  EmployeeStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
  { code: 'employee:bank-details:read', name: 'View employee payment details', module: 'employee', action: 'read' },
  { code: 'employee:bank-details:update', name: 'Manage employee payment details', module: 'employee', action: 'update' },
  { code: 'role.create', name: 'Create role', module: 'role', action: 'create' },
  { code: 'role.read', name: 'View role', module: 'role', action: 'read' },
  { code: 'role.update', name: 'Edit role', module: 'role', action: 'update' },
  { code: 'role.delete', name: 'Delete role', module: 'role', action: 'delete' },
  { code: 'role.assign', name: 'Assign role', module: 'role', action: 'assign' },
  { code: 'audit.read', name: 'View audit logs', module: 'audit', action: 'read' },
  { code: 'audit:read', name: 'View audit logs (alias)', module: 'audit', action: 'read' },
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
  { code: 'inventory:category:create', name: 'Create category', module: 'inventory', action: 'create' },
  { code: 'inventory:category:read', name: 'View categories', module: 'inventory', action: 'read' },
  { code: 'inventory:category:update', name: 'Edit category', module: 'inventory', action: 'update' },
  { code: 'inventory:category:delete', name: 'Delete category', module: 'inventory', action: 'delete' },
  { code: 'inventory:brand:create', name: 'Create product brand', module: 'inventory', action: 'create' },
  { code: 'inventory:brand:read', name: 'View product brands', module: 'inventory', action: 'read' },
  { code: 'inventory:brand:update', name: 'Edit product brand', module: 'inventory', action: 'update' },
  { code: 'inventory:brand:delete', name: 'Deactivate product brand', module: 'inventory', action: 'delete' },
  { code: 'inventory:product:create', name: 'Create product', module: 'inventory', action: 'create' },
  { code: 'inventory:product:read', name: 'View products', module: 'inventory', action: 'read' },
  { code: 'inventory:product:update', name: 'Edit product', module: 'inventory', action: 'update' },
  { code: 'inventory:product:delete', name: 'Delete product', module: 'inventory', action: 'delete' },
  { code: 'inventory:warehouse:create', name: 'Create warehouse', module: 'inventory', action: 'create' },
  { code: 'inventory:warehouse:read', name: 'View warehouses', module: 'inventory', action: 'read' },
  { code: 'inventory:warehouse:delete', name: 'Delete warehouse', module: 'inventory', action: 'delete' },
  { code: 'inventory:stock:read', name: 'View stock', module: 'inventory', action: 'read' },
  { code: 'inventory:stock:adjust', name: 'Adjust stock', module: 'inventory', action: 'update' },
  { code: 'inventory:transfer:cancel', name: 'Cancel transfer', module: 'inventory', action: 'update' },
  { code: 'inventory:transfer:complete', name: 'Complete transfer', module: 'inventory', action: 'update' },
  { code: 'inventory:reorder-point:manage', name: 'Manage reorder points', module: 'inventory', action: 'update' },
  { code: 'client-vendor:client:create', name: 'Create client', module: 'client-vendor', action: 'create' },
  { code: 'client-vendor:client:read', name: 'View clients', module: 'client-vendor', action: 'read' },
  { code: 'client-vendor:client:update', name: 'Edit client', module: 'client-vendor', action: 'update' },
  { code: 'client-vendor:client:delete', name: 'Delete client', module: 'client-vendor', action: 'delete' },
  { code: 'client-vendor:vendor:create', name: 'Create vendor', module: 'client-vendor', action: 'create' },
  { code: 'client-vendor:vendor:read', name: 'View vendors', module: 'client-vendor', action: 'read' },
  { code: 'client-vendor:vendor:update', name: 'Edit vendor', module: 'client-vendor', action: 'update' },
  { code: 'client-vendor:vendor:delete', name: 'Delete vendor', module: 'client-vendor', action: 'delete' },
  { code: 'localization:tax:create', name: 'Create tax', module: 'localization', action: 'create' },
  { code: 'localization:tax:read', name: 'View taxes', module: 'localization', action: 'read' },
  { code: 'localization:tax:update', name: 'Edit tax', module: 'localization', action: 'update' },
  { code: 'localization:tax:delete', name: 'Delete tax', module: 'localization', action: 'delete' },
  { code: 'localization:currency-rate:create', name: 'Create currency rate', module: 'localization', action: 'create' },
  { code: 'localization:currency-rate:read', name: 'View currency rates', module: 'localization', action: 'read' },
  { code: 'purchasing:order:list', name: 'List purchase orders (v2)', module: 'purchasing', action: 'read' },
  { code: 'sales:invoice:fiscal', name: 'Manage fiscal data on invoices', module: 'sales', action: 'update' },
  { code: 'documents:create', name: 'Create document', module: 'documents', action: 'create' },
  { code: 'documents:read', name: 'View documents', module: 'documents', action: 'read' },
  { code: 'documents:submit', name: 'Submit document', module: 'documents', action: 'update' },
  { code: 'documents:approve', name: 'Approve document', module: 'documents', action: 'update' },
  { code: 'documents:reject', name: 'Reject document', module: 'documents', action: 'update' },
  { code: 'documents:counter', name: 'Counter-sign document', module: 'documents', action: 'update' },
  { code: 'documents:transition', name: 'Transition document state', module: 'documents', action: 'update' },
  { code: 'documents:delete', name: 'Delete document', module: 'documents', action: 'delete' },
];

async function main() {
  console.log('--- Iniciando Seed de Atrio ERP ---');

  // 1. Permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log(`✓ Seeded ${PERMISSIONS.length} permissions`);

  // 2. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: DEMO_TENANT_ID },
    update: {
      enabledModules: [
        'reports',
        'sales',
        'inventory',
        'purchasing',
        'cash-payments',
        'localization',
        'employees',
        'client-vendor',
        'payroll',
      ],
    },
    create: {
      id: DEMO_TENANT_ID,
      slug: 'demo',
      legalName: 'Demo Company C.A.',
      taxId: 'J-12345678-9',
      enabledModules: [
        'reports',
        'sales',
        'inventory',
        'purchasing',
        'cash-payments',
        'localization',
        'employees',
        'client-vendor',
        'payroll',
      ],
    },
  });
  console.log(`✓ Seeded tenant: ${tenant.slug} (${tenant.id})`);

  // 3. Admin User & Roles
  const passwordHash = await bcrypt.hash('TempPass123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: DEMO_TENANT_ID, email: 'admin@demo.com' } },
    update: { passwordHash },
    create: {
      tenantId: DEMO_TENANT_ID,
      email: 'admin@demo.com',
      passwordHash,
      name: 'Admin Demo',
      locale: 'es',
    },
  });
  console.log(`✓ Seeded admin user: ${adminUser.email}`);

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

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });
  console.log(`✓ Assigned permissions to Admin role and user ${adminUser.email}`);

  // Cashier / Sales user for testing roles
  const cashierUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: DEMO_TENANT_ID, email: 'cajero@demo.com' } },
    update: { passwordHash },
    create: {
      tenantId: DEMO_TENANT_ID,
      email: 'cajero@demo.com',
      passwordHash,
      name: 'Cajero Mostrador',
      locale: 'es',
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId: DEMO_TENANT_ID, name: 'Cajero / Vendedor' } },
    update: {},
    create: {
      tenantId: DEMO_TENANT_ID,
      name: 'Cajero / Vendedor',
      isSystem: false,
    },
  });

  const cashierPermCodes = [
    'sales:order:create',
    'sales:order:read',
    'sales:invoice:create',
    'sales:invoice:read',
    'inventory:product:read',
    'inventory:stock:read',
    'client-vendor:client:read',
    'client-vendor:client:create',
    'localization:currency-rate:read',
    'reports:dashboard:view',
  ];
  for (const perm of allPermissions.filter((p) => cashierPermCodes.includes(p.code))) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: cashierRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: cashierRole.id, permissionId: perm.id },
    });
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: cashierUser.id, roleId: cashierRole.id } },
    update: {},
    create: { userId: cashierUser.id, roleId: cashierRole.id },
  });
  console.log(`✓ Seeded cashier user: ${cashierUser.email}`);

  // 4. Localization (Taxes & Currency Rates)
  const taxesData = [
    { name: 'IVA General 16%', rate: 16.0, type: 'VAT', country: 'VE' },
    { name: 'IVA Reducido 8%', rate: 8.0, type: 'VAT', country: 'VE' },
    { name: 'Exento 0%', rate: 0.0, type: 'VAT', country: 'VE' },
  ];

  const taxes: Record<string, any> = {};
  for (const t of taxesData) {
    let tax = await prisma.localizationTax.findFirst({
      where: { tenantId: DEMO_TENANT_ID, name: t.name },
    });
    if (!tax) {
      tax = await prisma.localizationTax.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          name: t.name,
          rate: t.rate,
          type: t.type,
          country: t.country,
          isActive: true,
        },
      });
    }
    taxes[t.name] = tax;
  }
  console.log(`✓ Seeded ${Object.keys(taxes).length} localization taxes`);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.currencyRate.upsert({
    where: {
      tenantId_fromCurrency_toCurrency_date: {
        tenantId: DEMO_TENANT_ID,
        fromCurrency: 'USD',
        toCurrency: 'VED',
        date: today,
      },
    },
    update: { rate: 54.5 },
    create: {
      tenantId: DEMO_TENANT_ID,
      fromCurrency: 'USD',
      toCurrency: 'VED',
      rate: 54.5,
      date: today,
    },
  });

  await prisma.currencyRate.upsert({
    where: {
      tenantId_fromCurrency_toCurrency_date: {
        tenantId: DEMO_TENANT_ID,
        fromCurrency: 'EUR',
        toCurrency: 'VED',
        date: today,
      },
    },
    update: { rate: 58.2 },
    create: {
      tenantId: DEMO_TENANT_ID,
      fromCurrency: 'EUR',
      toCurrency: 'VED',
      rate: 58.2,
      date: today,
    },
  });
  console.log('✓ Seeded currency rates (USD/VED, EUR/VED)');

  // 5. Inventory: Branches & Warehouses
  const branchesData = [
    {
      code: 'SEDE-CCS',
      name: 'Sede Principal Caracas',
      address: 'Av. Francisco de Miranda, Edif. Parque Cristal, Caracas',
      phone: '+58 212 285-1122',
    },
    {
      code: 'SUC-VAL',
      name: 'Sucursal Valencia',
      address: 'Av. Bolívar Norte, C.C. Camoruco, Valencia, Edo. Carabobo',
      phone: '+58 241 824-3344',
    },
  ];

  const branches: Record<string, any> = {};
  for (const b of branchesData) {
    const branch = await prisma.branch.upsert({
      where: { tenantId_code: { tenantId: DEMO_TENANT_ID, code: b.code } },
      update: { name: b.name, address: b.address, phone: b.phone },
      create: {
        tenantId: DEMO_TENANT_ID,
        code: b.code,
        name: b.name,
        address: b.address,
        phone: b.phone,
        isActive: true,
      },
    });
    branches[b.code] = branch;
  }
  console.log(`✓ Seeded ${Object.keys(branches).length} branches`);

  const warehousesData = [
    {
      code: 'ALM-PRI',
      name: 'Almacén Principal (Caracas)',
      branchId: branches['SEDE-CCS'].id,
      aisle: 'A',
      shelf: '1',
      level: '1',
      bin: '01',
    },
    {
      code: 'ALM-DESP',
      name: 'Almacén Despacho y Mostrador',
      branchId: branches['SEDE-CCS'].id,
      aisle: 'B',
      shelf: '1',
      level: '1',
      bin: '01',
    },
    {
      code: 'ALM-VAL',
      name: 'Almacén Sucursal Valencia',
      branchId: branches['SUC-VAL'].id,
      aisle: 'A',
      shelf: '1',
      level: '1',
      bin: '01',
    },
  ];

  const warehouses: Record<string, any> = {};
  for (const w of warehousesData) {
    let wh = await prisma.warehouse.findFirst({
      where: { tenantId: DEMO_TENANT_ID, code: w.code },
    });
    if (!wh) {
      wh = await prisma.warehouse.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          code: w.code,
          name: w.name,
          branchId: w.branchId,
          aisle: w.aisle,
          shelf: w.shelf,
          level: w.level,
          bin: w.bin,
          isActive: true,
        },
      });
    }
    warehouses[w.code] = wh;
  }
  console.log(`✓ Seeded ${Object.keys(warehouses).length} warehouses`);

  // 6. Inventory: Categories & Brands
  const categoriesList = [
    'Herramientas Manuales',
    'Herramientas Eléctricas',
    'Pinturas y Acabados',
    'Plomería y Tuberías',
    'Electricidad e Iluminación',
    'Seguridad Industrial',
    'Construcción y Fijación',
    'Servicios',
  ];

  const categories: Record<string, any> = {};
  for (const catName of categoriesList) {
    const cat = await prisma.productCategory.upsert({
      where: { tenantId_name: { tenantId: DEMO_TENANT_ID, name: catName } },
      update: {},
      create: {
        tenantId: DEMO_TENANT_ID,
        name: catName,
      },
    });
    categories[catName] = cat;
  }
  console.log(`✓ Seeded ${Object.keys(categories).length} product categories`);

  const brandsList = ['Truper', 'Stanley', 'Bosch', 'DeWalt', 'Montana', 'Tubrica', 'Bticino', '3M', 'Sika'];
  const brands: Record<string, any> = {};
  for (const bName of brandsList) {
    const brand = await prisma.productBrand.upsert({
      where: { tenantId_name: { tenantId: DEMO_TENANT_ID, name: bName } },
      update: {},
      create: {
        tenantId: DEMO_TENANT_ID,
        name: bName,
        isActive: true,
      },
    });
    brands[bName] = brand;
  }
  console.log(`✓ Seeded ${Object.keys(brands).length} product brands`);

  // 7. Business Partners: Suppliers (Proveedores) & Customers (Clientes)
  const suppliersData = [
    {
      legalName: 'Distribuidora Ferretera Nacional C.A.',
      commercialName: 'Ferretera Nacional',
      taxId: 'J-30456789-0',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      email: 'ventas@ferreteranacional.com.ve',
      phone: '+58 212 234-5678',
      website: 'https://ferreteranacional.com.ve',
      paymentTerms: 'Crédito 15 días',
      deliveryDays: 3,
      categories: ['Herramientas Manuales', 'Herramientas Eléctricas'],
      tags: ['mayorista', 'herramientas', 'prioridad-alta'],
      contact: {
        fullName: 'Carlos Mendoza',
        position: 'Gerente de Cuentas',
        email: 'carlos.mendoza@ferreteranacional.com',
        phone: '+58 414 123-4567',
      },
      address: {
        line1: 'Calle Los Laboratorios, Edif. Beta, Piso 2, Boleíta Norte',
        line2: 'Frente al Centro Empresarial',
        city: 'Caracas',
        state: 'Miranda',
        country: 'VE',
      },
    },
    {
      legalName: 'Corporación Pinturas Montana S.A.',
      commercialName: 'Pinturas Montana',
      taxId: 'J-00024681-3',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      email: 'corporativo@montana.com.ve',
      phone: '+58 241 876-5432',
      website: 'https://montana.com.ve',
      paymentTerms: 'Contado contra entrega',
      deliveryDays: 2,
      categories: ['Pinturas y Acabados'],
      tags: ['fabricante', 'pinturas', 'químicos'],
      contact: {
        fullName: 'Elena Villalobos',
        position: 'Ventas Corporativas',
        email: 'evillalobos@montana.com.ve',
        phone: '+58 412 987-6543',
      },
      address: {
        line1: 'Zona Industrial Sur, Av. Principal con Calle 4',
        line2: 'Galpón Montana 12',
        city: 'Valencia',
        state: 'Carabobo',
        country: 'VE',
      },
    },
    {
      legalName: 'Tubos y Conexiones Tubrica C.A.',
      commercialName: 'Tubrica',
      taxId: 'J-07512345-6',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      email: 'despachos@tubrica.com',
      phone: '+58 251 987-6543',
      website: 'https://tubrica.com',
      paymentTerms: 'Crédito 30 días',
      deliveryDays: 4,
      categories: ['Plomería y Tuberías'],
      tags: ['fabricante', 'tuberias', 'pvc'],
      contact: {
        fullName: 'Roberto Silva',
        position: 'Logística y Despacho',
        email: 'rsilva@tubrica.com',
        phone: '+58 416 345-6789',
      },
      address: {
        line1: 'Carretera Vieja a Carora, Km 3, Zona Industrial III',
        line2: 'Planta Principal',
        city: 'Barquisimeto',
        state: 'Lara',
        country: 'VE',
      },
    },
    {
      legalName: 'Electricidad & Automatización Bticino C.A.',
      commercialName: 'Bticino Venezuela',
      taxId: 'J-31298765-4',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      email: 'contacto@bticino-dist.ve',
      phone: '+58 212 505-1234',
      website: 'https://bticino.com.ve',
      paymentTerms: 'Crédito 21 días',
      deliveryDays: 2,
      categories: ['Electricidad e Iluminación'],
      tags: ['distribuidor-autorizado', 'electricidad'],
      contact: {
        fullName: 'Patricia Morales',
        position: 'Asesora Comercial',
        email: 'pmorales@bticino-dist.ve',
        phone: '+58 424 555-1234',
      },
      address: {
        line1: 'Av. Universidad, Esquina El Chorro, Torre La Previsora, Piso 8',
        line2: 'Oficina 8-B',
        city: 'Caracas',
        state: 'Distrito Capital',
        country: 'VE',
      },
    },
    {
      legalName: 'Suministros Industriales 3M Andina S.A.',
      commercialName: '3M Andina',
      taxId: 'J-00123987-1',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      email: 'ventas@3m-andina.com',
      phone: '+58 212 957-8800',
      website: 'https://3m.com.ve',
      paymentTerms: 'Crédito 30 días',
      deliveryDays: 5,
      categories: ['Seguridad Industrial'],
      tags: ['seguridad', 'epp', 'internacional'],
      contact: {
        fullName: 'Andrés Bello',
        position: 'Gerente de Producto EPP',
        email: 'abello@3m-andina.com',
        phone: '+58 414 777-8899',
      },
      address: {
        line1: 'Centro Empresarial El Rosal, Av. Tamanaco, Torre Credicard, Piso 14',
        line2: 'Oficina 1402',
        city: 'Caracas',
        state: 'Miranda',
        country: 'VE',
      },
    },
  ];

  const suppliers: Record<string, any> = {};

  for (const s of suppliersData) {
    let partner = await prisma.partner.findFirst({
      where: {
        tenantId: DEMO_TENANT_ID,
        taxIdValue: s.taxId,
        taxIdCountry: 'VE',
      },
    });

    if (!partner) {
      partner = await prisma.partner.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          type: s.type,
          legalName: s.legalName,
          commercialName: s.commercialName,
          taxIdValue: s.taxId,
          taxIdCountry: 'VE',
          taxIdType: s.identificationType,
          website: s.website,
          paymentTerms: s.paymentTerms,
          deliveryDays: s.deliveryDays,
          status: PartnerStatus.ACTIVE,
          metadataSource: 'seed',
          externalId: s.taxId,
          createdById: adminUser.id,
          updatedById: adminUser.id,
        },
      });
    }

    await prisma.partnerRole.upsert({
      where: { partnerId_role: { partnerId: partner.id, role: PartnerRoleType.SUPPLIER } },
      update: {},
      create: { partnerId: partner.id, role: PartnerRoleType.SUPPLIER },
    });

    for (const tag of s.tags) {
      await prisma.partnerTag.upsert({
        where: { partnerId_value: { partnerId: partner.id, value: tag } },
        update: {},
        create: { partnerId: partner.id, value: tag },
      });
    }

    for (const catName of s.categories) {
      const c = categories[catName];
      if (c) {
        await prisma.partnerCategory.upsert({
          where: { partnerId_categoryId: { partnerId: partner.id, categoryId: c.id } },
          update: {},
          create: { partnerId: partner.id, categoryId: c.id },
        });
      }
    }

    const existingContact = await prisma.contact.findFirst({
      where: { partnerId: partner.id, fullName: s.contact.fullName },
    });
    if (!existingContact) {
      await prisma.contact.create({
        data: {
          partnerId: partner.id,
          fullName: s.contact.fullName,
          position: s.contact.position,
          email: s.contact.email,
          phone: s.contact.phone,
          isPrimary: true,
          createdById: adminUser.id,
          updatedById: adminUser.id,
        },
      });
    }

    const existingAddress = await prisma.partnerAddress.findFirst({
      where: { partnerId: partner.id, line1: s.address.line1 },
    });
    if (!existingAddress) {
      await prisma.partnerAddress.create({
        data: {
          partnerId: partner.id,
          type: AddressType.FISCAL,
          line1: s.address.line1,
          line2: s.address.line2,
          city: s.address.city,
          state: s.address.state,
          country: s.address.country,
          isPrimary: true,
          createdById: adminUser.id,
          updatedById: adminUser.id,
        },
      });
    }

    let legacyAddress = await prisma.address.findFirst({
      where: { tenantId: DEMO_TENANT_ID, addressLine: s.address.line1 },
    });
    if (!legacyAddress) {
      legacyAddress = await prisma.address.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          addressLine: s.address.line1,
          reference: s.address.line2,
          city: s.address.city,
          state: s.address.state,
          country: s.address.country,
        },
      });
    }

    await prisma.vendor.upsert({
      where: { tenantId_documentId: { tenantId: DEMO_TENANT_ID, documentId: s.taxId } },
      update: {
        legalName: s.legalName,
        email: s.email,
        phone: s.phone,
        addressId: legacyAddress.id,
        isActive: true,
      },
      create: {
        id: partner.id,
        tenantId: DEMO_TENANT_ID,
        documentId: s.taxId,
        taxId: s.taxId,
        identificationType: s.identificationType,
        legalName: s.legalName,
        email: s.email,
        phone: s.phone,
        addressId: legacyAddress.id,
        contactFirstName: s.contact.fullName.split(' ')[0],
        contactLastName: s.contact.fullName.split(' ').slice(1).join(' ') || 'Contacto',
        contactEmail: s.contact.email,
        contactPhone: s.contact.phone,
        isActive: true,
      },
    });

    await prisma.partnerMigrationMap.upsert({
      where: { legacyType_legacyId: { legacyType: 'vendor', legacyId: partner.id } },
      update: {},
      create: {
        legacyType: 'vendor',
        legacyId: partner.id,
        partnerId: partner.id,
        migrationBatch: 'seed-batch-01',
        matchedBy: 'tax_id',
        confidence: 'auto',
      },
    });

    suppliers[s.legalName] = partner;
  }
  console.log(`✓ Seeded ${Object.keys(suppliers).length} suppliers (both Partner & legacy Vendor)`);

  // Customers (Clientes)
  const clientsData = [
    {
      legalName: 'Constructora El Roble C.A.',
      taxId: 'J-40123456-7',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      contributorType: 'special',
      email: 'compras@constructoraroble.com',
      phone: '+58 212 991-2233',
      paymentTerms: 'Crédito 30 días',
      tags: ['empresa', 'construccion', 'cliente-frecuente'],
      contact: {
        fullName: 'Ricardo Peña',
        position: 'Director de Compras',
        email: 'rpena@constructoraroble.com',
        phone: '+58 414 234-5678',
      },
      address: {
        line1: 'Av. Principal de Las Mercedes, Edif. Roble, Piso 4',
        city: 'Caracas',
        state: 'Miranda',
        country: 'VE',
      },
    },
    {
      legalName: 'Inversiones y Multiservicios San Miguel C.A.',
      taxId: 'J-40987654-1',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      contributorType: 'ordinary',
      email: 'sanmiguel_servicios@gmail.com',
      phone: '+58 212 361-9000',
      paymentTerms: 'Crédito 15 días',
      tags: ['empresa', 'mantenimiento'],
      contact: {
        fullName: 'Miguel Ángel Torres',
        position: 'Administrador',
        email: 'miguel.torres@sanmiguel.com',
        phone: '+58 412 345-6789',
      },
      address: {
        line1: 'Zona Industrial Guatire, Galpón 4',
        city: 'Guatire',
        state: 'Miranda',
        country: 'VE',
      },
    },
    {
      legalName: 'Taller Mecánico Hermanos Díaz C.A.',
      taxId: 'J-50123789-2',
      identificationType: IdentificationType.RIF_VE,
      type: PartnerType.COMPANY,
      contributorType: 'formal',
      email: 'diaz.taller@hotmail.com',
      phone: '+58 212 862-4512',
      paymentTerms: 'Contado',
      tags: ['taller', 'mecanica'],
      contact: {
        fullName: 'David Díaz',
        position: 'Dueño',
        email: 'daviddiaz@gmail.com',
        phone: '+58 424 678-9012',
      },
      address: {
        line1: 'Final Av. Sucre, Sector Catia',
        city: 'Caracas',
        state: 'Distrito Capital',
        country: 'VE',
      },
    },
    {
      legalName: 'Pedro Alejandro Gómez Pérez',
      taxId: 'V-18456123',
      identificationType: IdentificationType.CI_VE,
      type: PartnerType.PERSON,
      contributorType: 'formal',
      email: 'pedro.gomez18@gmail.com',
      phone: '+58 416 890-1234',
      paymentTerms: 'Contado',
      tags: ['persona-natural', 'minorista'],
      contact: {
        fullName: 'Pedro Gómez',
        position: 'Cliente Particular',
        email: 'pedro.gomez18@gmail.com',
        phone: '+58 416 890-1234',
      },
      address: {
        line1: 'Residencias San Antonio, Apto 4-B, El Paraíso',
        city: 'Caracas',
        state: 'Distrito Capital',
        country: 'VE',
      },
    },
    {
      legalName: 'María Gabriela Corredor',
      taxId: 'V-20789456',
      identificationType: IdentificationType.CI_VE,
      type: PartnerType.PERSON,
      contributorType: 'formal',
      email: 'mariag.corredor@yahoo.com',
      phone: '+58 412 112-2334',
      paymentTerms: 'Contado',
      tags: ['persona-natural', 'mostrador'],
      contact: {
        fullName: 'María Corredor',
        position: 'Cliente Particular',
        email: 'mariag.corredor@yahoo.com',
        phone: '+58 412 112-2334',
      },
      address: {
        line1: 'Av. Panteón, Edif. Ávila, San José',
        city: 'Caracas',
        state: 'Distrito Capital',
        country: 'VE',
      },
    },
  ];

  for (const c of clientsData) {
    let partner = await prisma.partner.findFirst({
      where: {
        tenantId: DEMO_TENANT_ID,
        taxIdValue: c.taxId,
        taxIdCountry: 'VE',
      },
    });

    if (!partner) {
      partner = await prisma.partner.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          type: c.type,
          legalName: c.legalName,
          taxIdValue: c.taxId,
          taxIdCountry: 'VE',
          taxIdType: c.identificationType,
          paymentTerms: c.paymentTerms,
          status: PartnerStatus.ACTIVE,
          metadataSource: 'seed',
          metadataNotes: `Contributor: ${c.contributorType}`,
          externalId: c.taxId,
          createdById: adminUser.id,
          updatedById: adminUser.id,
        },
      });
    }

    await prisma.partnerRole.upsert({
      where: { partnerId_role: { partnerId: partner.id, role: PartnerRoleType.CUSTOMER } },
      update: {},
      create: { partnerId: partner.id, role: PartnerRoleType.CUSTOMER },
    });

    for (const tag of c.tags) {
      await prisma.partnerTag.upsert({
        where: { partnerId_value: { partnerId: partner.id, value: tag } },
        update: {},
        create: { partnerId: partner.id, value: tag },
      });
    }

    const existingContact = await prisma.contact.findFirst({
      where: { partnerId: partner.id, fullName: c.contact.fullName },
    });
    if (!existingContact) {
      await prisma.contact.create({
        data: {
          partnerId: partner.id,
          fullName: c.contact.fullName,
          position: c.contact.position,
          email: c.contact.email,
          phone: c.contact.phone,
          isPrimary: true,
          createdById: adminUser.id,
          updatedById: adminUser.id,
        },
      });
    }

    const existingAddress = await prisma.partnerAddress.findFirst({
      where: { partnerId: partner.id, line1: c.address.line1 },
    });
    if (!existingAddress) {
      await prisma.partnerAddress.create({
        data: {
          partnerId: partner.id,
          type: AddressType.FISCAL,
          line1: c.address.line1,
          city: c.address.city,
          state: c.address.state,
          country: c.address.country,
          isPrimary: true,
          createdById: adminUser.id,
          updatedById: adminUser.id,
        },
      });
    }

    let legacyAddress = await prisma.address.findFirst({
      where: { tenantId: DEMO_TENANT_ID, addressLine: c.address.line1 },
    });
    if (!legacyAddress) {
      legacyAddress = await prisma.address.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          addressLine: c.address.line1,
          city: c.address.city,
          state: c.address.state,
          country: c.address.country,
        },
      });
    }

    await prisma.client.upsert({
      where: { tenantId_documentId: { tenantId: DEMO_TENANT_ID, documentId: c.taxId } },
      update: {
        legalName: c.legalName,
        email: c.email,
        phone: c.phone,
        addressId: legacyAddress.id,
        contributorType: c.contributorType,
        isActive: true,
      },
      create: {
        id: partner.id,
        tenantId: DEMO_TENANT_ID,
        documentId: c.taxId,
        taxId: c.taxId,
        identificationType: c.identificationType,
        legalName: c.legalName,
        email: c.email,
        phone: c.phone,
        addressId: legacyAddress.id,
        contributorType: c.contributorType,
        isActive: true,
      },
    });

    await prisma.partnerMigrationMap.upsert({
      where: { legacyType_legacyId: { legacyType: 'client', legacyId: partner.id } },
      update: {},
      create: {
        legacyType: 'client',
        legacyId: partner.id,
        partnerId: partner.id,
        migrationBatch: 'seed-batch-01',
        matchedBy: 'tax_id',
        confidence: 'auto',
      },
    });
  }
  console.log(`✓ Seeded ${clientsData.length} clients (both Partner & legacy Client)`);

  // 8. Products & Stock & Lots & Suppliers
  const defaultTax = taxes['IVA General 16%'];

  const productsData = [
    {
      sku: 'BOS-GSB-550',
      barcode: '7891112456780',
      name: 'Taladro Percutor Bosch GSB 550 RE 550W 1/2 pulgada',
      description: 'Taladro percutor ergonómico para concreto, madera y metal con mandril de 1/2".',
      category: 'Herramientas Eléctricas',
      brand: 'Bosch',
      unitPrice: 65.0,
      costPrice: 42.0,
      baseUnit: 'unidad',
      minStock: 5,
      maxStock: 30,
      reorderPoint: 8,
      supplierName: 'Distribuidora Ferretera Nacional C.A.',
      supplierSku: 'BOSCH-GSB-550-VE',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 18 },
        { warehouseCode: 'ALM-DESP', quantity: 4 },
      ],
    },
    {
      sku: 'TRU-MART-16',
      barcode: '7501206600123',
      name: 'Martillo de Uña 16 oz Mango de Fibra Truper',
      description: 'Martillo forjado en acero alto carbono con mango antivibración de fibra de vidrio.',
      category: 'Herramientas Manuales',
      brand: 'Truper',
      unitPrice: 12.5,
      costPrice: 7.2,
      baseUnit: 'unidad',
      minStock: 10,
      maxStock: 60,
      reorderPoint: 15,
      supplierName: 'Distribuidora Ferretera Nacional C.A.',
      supplierSku: 'TRU-19982',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 35 },
        { warehouseCode: 'ALM-DESP', quantity: 10 },
      ],
    },
    {
      sku: 'STA-DEST-6P',
      barcode: '7477526004567',
      name: 'Juego de Destornilladores Stanley Pro 6 Piezas',
      description: 'Juego con 3 planos y 3 estrías imantadas con mango ergonómico bimaterial.',
      category: 'Herramientas Manuales',
      brand: 'Stanley',
      unitPrice: 18.0,
      costPrice: 11.0,
      baseUnit: 'juego',
      minStock: 8,
      maxStock: 40,
      reorderPoint: 12,
      supplierName: 'Distribuidora Ferretera Nacional C.A.',
      supplierSku: 'ST-60-060',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 22 },
        { warehouseCode: 'ALM-DESP', quantity: 6 },
      ],
    },
    {
      sku: 'DEW-DWE-4010',
      barcode: '8859114567890',
      name: 'Esmeril Angular DeWalt 4-1/2 pulgada 700W',
      description: 'Amoladora angular compacta de 700W 11.000 RPM para corte y desbaste.',
      category: 'Herramientas Eléctricas',
      brand: 'DeWalt',
      unitPrice: 78.0,
      costPrice: 52.0,
      baseUnit: 'unidad',
      minStock: 4,
      maxStock: 25,
      reorderPoint: 6,
      supplierName: 'Distribuidora Ferretera Nacional C.A.',
      supplierSku: 'DW-4010-AR',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 12 },
        { warehouseCode: 'ALM-DESP', quantity: 3 },
      ],
    },
    {
      sku: 'MON-CAU-BLA-1G',
      barcode: '7591001234567',
      name: 'Pintura Caucho Profesional Blanco Puro Galón',
      description: 'Pintura de emulsión para interiores de alto cubrimiento y acabado mate.',
      category: 'Pinturas y Acabados',
      brand: 'Montana',
      unitPrice: 24.0,
      costPrice: 15.5,
      baseUnit: 'galon',
      minStock: 15,
      maxStock: 80,
      reorderPoint: 20,
      supplierName: 'Corporación Pinturas Montana S.A.',
      supplierSku: 'MON-BL-PROF-1G',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 40 },
        { warehouseCode: 'ALM-DESP', quantity: 12 },
      ],
      lot: {
        number: 'LOT-MON-2026-A1',
        expirationDate: new Date('2027-12-31'),
        warehouseCode: 'ALM-PRI',
        quantity: 40,
      },
    },
    {
      sku: 'MON-ESM-NEG-1G',
      barcode: '7591001234574',
      name: 'Esmalte Sintético Negro Brillante Galón',
      description: 'Esmalte alquídico anticorrosivo para metales y maderas exteriores.',
      category: 'Pinturas y Acabados',
      brand: 'Montana',
      unitPrice: 28.5,
      costPrice: 18.0,
      baseUnit: 'galon',
      minStock: 8,
      maxStock: 50,
      reorderPoint: 12,
      supplierName: 'Corporación Pinturas Montana S.A.',
      supplierSku: 'MON-ESM-NEG-1G',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 15 },
        { warehouseCode: 'ALM-DESP', quantity: 5 },
      ],
      lot: {
        number: 'LOT-MON-2026-B2',
        expirationDate: new Date('2027-10-31'),
        warehouseCode: 'ALM-PRI',
        quantity: 15,
      },
    },
    {
      sku: 'TUB-PVC-12-3M',
      barcode: '7591234560012',
      name: 'Tubo PVC Presión 1/2 pulgada x 3 Metros',
      description: 'Tubería rígida de PVC para agua potable a presión Schedule 40.',
      category: 'Plomería y Tuberías',
      brand: 'Tubrica',
      unitPrice: 4.5,
      costPrice: 2.6,
      baseUnit: 'tubo',
      minStock: 20,
      maxStock: 150,
      reorderPoint: 30,
      supplierName: 'Tubos y Conexiones Tubrica C.A.',
      supplierSku: 'TUB-050-3M',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 80 },
        { warehouseCode: 'ALM-DESP', quantity: 25 },
      ],
    },
    {
      sku: 'TUB-COD-PVC-12',
      barcode: '7591234560029',
      name: 'Codo PVC 90 Grados Soldable 1/2 pulgada',
      description: 'Conexión codo de 90° soldable en PVC para conducción hidráulica.',
      category: 'Plomería y Tuberías',
      brand: 'Tubrica',
      unitPrice: 0.65,
      costPrice: 0.32,
      baseUnit: 'unidad',
      minStock: 50,
      maxStock: 300,
      reorderPoint: 80,
      supplierName: 'Tubos y Conexiones Tubrica C.A.',
      supplierSku: 'TUB-COD-050',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 140 },
        { warehouseCode: 'ALM-DESP', quantity: 50 },
      ],
    },
    {
      sku: 'BTI-BRK-1P-20A',
      barcode: '8012199789012',
      name: 'Breaker Termomagnético Bticino 1 Polo 20A',
      description: 'Interruptor termomagnético enchufable para protección de circuitos.',
      category: 'Electricidad e Iluminación',
      brand: 'Bticino',
      unitPrice: 8.5,
      costPrice: 5.1,
      baseUnit: 'unidad',
      minStock: 15,
      maxStock: 100,
      reorderPoint: 25,
      supplierName: 'Electricidad & Automatización Bticino C.A.',
      supplierSku: 'BTI-BT1P20',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 45 },
        { warehouseCode: 'ALM-DESP', quantity: 15 },
      ],
    },
    {
      // TRIGGER FOR LOW STOCK ALERTS: quantity 3 vs minStock 15 and reorderPoint 25
      sku: '3M-LEN-SEG-CLR',
      barcode: '0511312750011',
      name: 'Lentes de Seguridad 3M Virtua Claros Antiempañantes',
      description: 'Gafas de policarbonato con filtro UV 99.9% y protección contra impactos.',
      category: 'Seguridad Industrial',
      brand: '3M',
      unitPrice: 5.2,
      costPrice: 2.8,
      baseUnit: 'unidad',
      minStock: 15,
      maxStock: 120,
      reorderPoint: 25,
      supplierName: 'Suministros Industriales 3M Andina S.A.',
      supplierSku: '3M-VIR-11329',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 3 },
        { warehouseCode: 'ALM-DESP', quantity: 1 },
      ],
    },
    {
      sku: '3M-RES-N95-8210',
      barcode: '0511312750028',
      name: 'Respirador para Partículas 3M N95 Caja x 20 uds',
      description: 'Mascarilla libre de mantenimiento para partículas no oleosas.',
      category: 'Seguridad Industrial',
      brand: '3M',
      unitPrice: 26.0,
      costPrice: 16.5,
      baseUnit: 'caja',
      minStock: 5,
      maxStock: 40,
      reorderPoint: 10,
      supplierName: 'Suministros Industriales 3M Andina S.A.',
      supplierSku: '3M-8210-BOX',
      stocks: [
        { warehouseCode: 'ALM-PRI', quantity: 14 },
        { warehouseCode: 'ALM-DESP', quantity: 4 },
      ],
    },
    {
      sku: 'SRV-FLETE-ESP',
      barcode: '9990001112223',
      name: 'Servicio de Despacho y Flete Urbano',
      description: 'Transporte y entrega de materiales pesados directo a pie de obra.',
      category: 'Servicios',
      brand: null,
      unitPrice: 15.0,
      costPrice: 0.0,
      baseUnit: 'servicio',
      minStock: 0,
      maxStock: null,
      reorderPoint: 0,
      supplierName: null,
      supplierSku: null,
      isService: true,
      stocks: [],
    },
  ];

  const seededProducts: Record<string, any> = {};

  for (const p of productsData) {
    const catId = categories[p.category]?.id ?? null;
    const brandId = p.brand ? brands[p.brand]?.id ?? null : null;
    const supplierPartner = p.supplierName ? suppliers[p.supplierName] : null;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        description: p.description,
        categoryId: catId,
        brandId,
        unitPrice: p.unitPrice,
        costPrice: p.costPrice,
        baseUnit: p.baseUnit,
        minStock: p.minStock,
        maxStock: p.maxStock,
        reorderPoint: p.reorderPoint,
        primarySupplierId: supplierPartner?.id ?? null,
        supplierSku: p.supplierSku ?? null,
        taxId: defaultTax.id,
        isService: !!p.isService,
        isActive: true,
      },
      create: {
        tenantId: DEMO_TENANT_ID,
        sku: p.sku,
        barcode: p.barcode,
        name: p.name,
        description: p.description,
        categoryId: catId,
        brandId,
        unitPrice: p.unitPrice,
        costPrice: p.costPrice,
        baseUnit: p.baseUnit,
        minStock: p.minStock,
        maxStock: p.maxStock,
        reorderPoint: p.reorderPoint,
        primarySupplierId: supplierPartner?.id ?? null,
        supplierSku: p.supplierSku ?? null,
        taxId: defaultTax.id,
        isService: !!p.isService,
        isActive: true,
      },
    });

    seededProducts[p.sku] = product;

    // Supplier link
    if (supplierPartner) {
      await prisma.productSupplier.upsert({
        where: { productId_partnerId: { productId: product.id, partnerId: supplierPartner.id } },
        update: { supplierSku: p.supplierSku, isActive: true },
        create: {
          productId: product.id,
          partnerId: supplierPartner.id,
          supplierSku: p.supplierSku,
          priority: 1,
          isActive: true,
        },
      });
    }

    // Cost History
    const existingCostHistory = await prisma.productCostHistory.findFirst({
      where: { productId: product.id, unitCost: p.costPrice },
    });
    if (!existingCostHistory && p.costPrice > 0) {
      await prisma.productCostHistory.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          productId: product.id,
          unitCost: p.costPrice,
          supplierId: supplierPartner?.id ?? null,
          createdById: adminUser.id,
        },
      });
    }

    // Stocks, StockMovements & ReorderPoints
    for (const s of p.stocks) {
      const wh = warehouses[s.warehouseCode];
      if (!wh) continue;

      const currentStock = await prisma.stock.findUnique({
        where: { productId_warehouseId: { productId: product.id, warehouseId: wh.id } },
      });

      if (!currentStock) {
        await prisma.stock.create({
          data: {
            productId: product.id,
            warehouseId: wh.id,
            quantity: s.quantity,
          },
        });

        // Initial movement
        await prisma.stockMovement.create({
          data: {
            productId: product.id,
            warehouseId: wh.id,
            type: 'INITIAL',
            quantity: s.quantity,
            balanceBefore: 0,
            balanceAfter: s.quantity,
            referenceType: 'SEED',
            userId: adminUser.id,
          },
        });
      }

      // Reorder Point per warehouse
      await prisma.reorderPoint.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId: wh.id } },
        update: { minQuantity: p.minStock, maxQuantity: p.maxStock ?? 100 },
        create: {
          tenantId: DEMO_TENANT_ID,
          productId: product.id,
          warehouseId: wh.id,
          minQuantity: p.minStock,
          maxQuantity: p.maxStock ?? 100,
          isActive: true,
        },
      });
    }

    // Lots
    if (p.lot) {
      const lotWh = warehouses[p.lot.warehouseCode];
      if (lotWh) {
        await prisma.stockLot.upsert({
          where: {
            productId_warehouseId_lotNumber: {
              productId: product.id,
              warehouseId: lotWh.id,
              lotNumber: p.lot.number,
            },
          },
          update: { quantity: p.lot.quantity, expirationDate: p.lot.expirationDate },
          create: {
            tenantId: DEMO_TENANT_ID,
            productId: product.id,
            warehouseId: lotWh.id,
            lotNumber: p.lot.number,
            quantity: p.lot.quantity,
            expirationDate: p.lot.expirationDate,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${productsData.length} products with stock, lots, and supplier links`);

  // Stock Transfer between warehouses (1 completed, 1 pending)
  const whPri = warehouses['ALM-PRI'];
  const whDesp = warehouses['ALM-DESP'];
  const whVal = warehouses['ALM-VAL'];

  const boschProd = seededProducts['BOS-GSB-550'];
  if (whPri && whDesp && boschProd) {
    const existingTransfer = await prisma.stockTransfer.findFirst({
      where: {
        tenantId: DEMO_TENANT_ID,
        productId: boschProd.id,
        fromWarehouseId: whPri.id,
        toWarehouseId: whDesp.id,
      },
    });
    if (!existingTransfer) {
      await prisma.stockTransfer.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          productId: boschProd.id,
          fromWarehouseId: whPri.id,
          toWarehouseId: whDesp.id,
          quantity: 5,
          status: 'completed',
          notes: 'Transferencia para abastecimiento de mostrador',
          completedAt: new Date(),
        },
      });
    }
  }

  const tubricaProd = seededProducts['TUB-PVC-12-3M'];
  if (whPri && whVal && tubricaProd) {
    const existingTransfer2 = await prisma.stockTransfer.findFirst({
      where: {
        tenantId: DEMO_TENANT_ID,
        productId: tubricaProd.id,
        fromWarehouseId: whPri.id,
        toWarehouseId: whVal.id,
      },
    });
    if (!existingTransfer2) {
      await prisma.stockTransfer.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          productId: tubricaProd.id,
          fromWarehouseId: whPri.id,
          toWarehouseId: whVal.id,
          quantity: 20,
          status: 'pending',
          notes: 'Envío inter-sucursal Caracas -> Valencia',
        },
      });
    }
  }
  console.log('✓ Seeded stock transfers');

  // 9. Cash & Payments: Cash Registers, Payment Methods, Bank Accounts
  const registersData = [
    { name: 'Caja Principal 01', location: 'Mostrador Principal', currency: 'USD', balance: 250.0 },
    { name: 'Caja Rápida 02', location: 'Pasillo 2', currency: 'USD', balance: 100.0 },
  ];

  const registers: Record<string, any> = {};
  for (const r of registersData) {
    let reg = await prisma.cashRegister.findFirst({
      where: { tenantId: DEMO_TENANT_ID, name: r.name },
    });
    if (!reg) {
      reg = await prisma.cashRegister.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          name: r.name,
          location: r.location,
          currency: r.currency,
          balance: r.balance,
          isActive: true,
        },
      });
    }
    registers[r.name] = reg;
  }
  console.log(`✓ Seeded ${Object.keys(registers).length} cash registers`);

  // Active POS Session for testing POS sales immediately
  const mainRegister = registers['Caja Principal 01'];
  if (mainRegister) {
    const activeSession = await prisma.posSession.findFirst({
      where: { tenantId: DEMO_TENANT_ID, cashRegisterId: mainRegister.id, status: 'open' },
    });
    if (!activeSession) {
      await prisma.posSession.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          cashRegisterId: mainRegister.id,
          userId: adminUser.id,
          openingBalance: 100.0,
          status: 'open',
          openedAt: new Date(),
        },
      });
      console.log('✓ Seeded open POS session on Caja Principal 01');
    }
  }

  const paymentMethodsData = [
    { name: 'Efectivo USD', type: 'cash', currency: 'USD', commissionRate: 0.0 },
    { name: 'Efectivo VED', type: 'cash', currency: 'VED', commissionRate: 0.0 },
    { name: 'Punto de Venta / Débito', type: 'card', currency: 'VED', commissionRate: 1.5 },
    { name: 'Pago Móvil Interbancario', type: 'mobile_payment', currency: 'VED', commissionRate: 0.3 },
    { name: 'Transferencia Bancaria USD', type: 'bank_transfer', currency: 'USD', commissionRate: 0.0 },
  ];

  for (const pm of paymentMethodsData) {
    await prisma.paymentMethod.upsert({
      where: { tenantId_name: { tenantId: DEMO_TENANT_ID, name: pm.name } },
      update: { type: pm.type, currency: pm.currency, commissionRate: pm.commissionRate, isActive: true },
      create: {
        tenantId: DEMO_TENANT_ID,
        name: pm.name,
        type: pm.type,
        currency: pm.currency,
        commissionRate: pm.commissionRate,
        isActive: true,
      },
    });
  }
  console.log(`✓ Seeded ${paymentMethodsData.length} payment methods`);

  const bankAccountsData = [
    {
      name: 'Banesco Banco Universal - Cuenta Corriente',
      bankName: 'Banesco',
      accountNumber: '0134-0123-45-0001234567',
      accountType: 'checking',
      currency: 'VED',
      balance: 45000.0,
    },
    {
      name: 'Banco Mercantil - Cuenta Corriente',
      bankName: 'Mercantil',
      accountNumber: '0105-0987-65-0007654321',
      accountType: 'checking',
      currency: 'VED',
      balance: 32000.0,
    },
  ];

  for (const ba of bankAccountsData) {
    const existingBa = await prisma.bankAccount.findFirst({
      where: { tenantId: DEMO_TENANT_ID, accountNumber: ba.accountNumber },
    });
    if (!existingBa) {
      await prisma.bankAccount.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          name: ba.name,
          bankName: ba.bankName,
          accountNumber: ba.accountNumber,
          accountType: ba.accountType,
          currency: ba.currency,
          balance: ba.balance,
          isActive: true,
        },
      });
    }
  }
  console.log(`✓ Seeded ${bankAccountsData.length} bank accounts`);

  // 10. Organization & HR: Departments, Positions, Employees
  const departmentsData = [
    { name: 'Administración y Finanzas', description: 'Gestión contable, tesorería y recursos humanos' },
    { name: 'Ventas y Mostrador', description: 'Atención al público, punto de venta y facturación' },
    { name: 'Almacén y Logística', description: 'Control de inventario, recepción y despacho de mercancía' },
    { name: 'Compras', description: 'Gestión con proveedores y adquisiciones' },
  ];

  const departments: Record<string, any> = {};
  for (const d of departmentsData) {
    const dep = await prisma.department.upsert({
      where: { tenantId_name: { tenantId: DEMO_TENANT_ID, name: d.name } },
      update: { description: d.description },
      create: {
        tenantId: DEMO_TENANT_ID,
        name: d.name,
        description: d.description,
        isActive: true,
      },
    });
    departments[d.name] = dep;
  }
  console.log(`✓ Seeded ${Object.keys(departments).length} departments`);

  const positionsData = [
    {
      code: 'GER-GEN',
      name: 'Gerente General',
      department: 'Administración y Finanzas',
      isLeadership: true,
      description: 'Dirección ejecutiva y estratégica',
    },
    {
      code: 'POS-CAJ',
      name: 'Cajero / Vendedor',
      department: 'Ventas y Mostrador',
      isLeadership: false,
      description: 'Atención en terminal POS y cuadre de caja',
    },
    {
      code: 'ALM-ENC',
      name: 'Encargado de Almacén',
      department: 'Almacén y Logística',
      isLeadership: false,
      description: 'Recepción y preparación de pedidos',
    },
    {
      code: 'COM-CRD',
      name: 'Coordinador de Compras',
      department: 'Compras',
      isLeadership: false,
      description: 'Negociación y reposición de stock',
    },
  ];

  const positions: Record<string, any> = {};
  for (const pos of positionsData) {
    const depId = departments[pos.department]?.id ?? null;
    const p = await prisma.position.upsert({
      where: { tenantId_code: { tenantId: DEMO_TENANT_ID, code: pos.code } },
      update: { name: pos.name, departmentId: depId, isLeadership: pos.isLeadership },
      create: {
        tenantId: DEMO_TENANT_ID,
        code: pos.code,
        name: pos.name,
        departmentId: depId,
        description: pos.description,
        isLeadership: pos.isLeadership,
        active: true,
      },
    });
    positions[pos.code] = p;
  }
  console.log(`✓ Seeded ${Object.keys(positions).length} positions`);

  const employeesData = [
    {
      identityDoc: 'V-15432100',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@demo.com',
      phone: '+58 414 123-0001',
      departmentName: 'Administración y Finanzas',
      positionName: 'Gerente General',
      positionCode: 'GER-GEN',
      baseSalary: 1200.0,
      hireDate: new Date('2022-01-15'),
    },
    {
      identityDoc: 'V-18987654',
      firstName: 'María',
      lastName: 'Rodríguez',
      email: 'maria.rodriguez@demo.com',
      phone: '+58 414 123-0002',
      departmentName: 'Compras',
      positionName: 'Coordinadora de Compras',
      positionCode: 'COM-CRD',
      baseSalary: 850.0,
      hireDate: new Date('2023-03-01'),
    },
    {
      identityDoc: 'V-21456789',
      firstName: 'Juan',
      lastName: 'Díaz',
      email: 'juan.diaz@demo.com',
      phone: '+58 414 123-0003',
      departmentName: 'Almacén y Logística',
      positionName: 'Encargado de Almacén',
      positionCode: 'ALM-ENC',
      baseSalary: 650.0,
      hireDate: new Date('2023-06-15'),
    },
    {
      identityDoc: 'V-23123456',
      firstName: 'Ana',
      lastName: 'Torres',
      email: 'ana.torres@demo.com',
      phone: '+58 414 123-0004',
      departmentName: 'Ventas y Mostrador',
      positionName: 'Cajero / Vendedor',
      positionCode: 'POS-CAJ',
      baseSalary: 500.0,
      hireDate: new Date('2024-02-01'),
    },
  ];

  for (const emp of employeesData) {
    const dep = departments[emp.departmentName];
    const pos = positions[emp.positionCode];

    const employee = await prisma.employee.upsert({
      where: { tenantId_identityDoc: { tenantId: DEMO_TENANT_ID, identityDoc: emp.identityDoc } },
      update: {
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        department: emp.departmentName,
        departmentId: dep?.id ?? null,
        position: emp.positionName,
        baseSalary: emp.baseSalary,
        status: EmployeeStatus.active,
      },
      create: {
        tenantId: DEMO_TENANT_ID,
        identityDoc: emp.identityDoc,
        identificationType: IdentificationType.CI_VE,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        phone: emp.phone,
        department: emp.departmentName,
        departmentId: dep?.id ?? null,
        position: emp.positionName,
        baseSalary: emp.baseSalary,
        hireDate: emp.hireDate,
        status: EmployeeStatus.active,
      },
    });

    if (pos) {
      const existingAssign = await prisma.positionAssignment.findFirst({
        where: { tenantId: DEMO_TENANT_ID, employeeId: employee.id, positionId: pos.id },
      });
      if (!existingAssign) {
        await prisma.positionAssignment.create({
          data: {
            tenantId: DEMO_TENANT_ID,
            employeeId: employee.id,
            positionId: pos.id,
            startDate: emp.hireDate,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${employeesData.length} employees`);

  // 11. Purchasing: Price Lists & Sample Purchase Orders
  const ferreteraSupplier = suppliers['Distribuidora Ferretera Nacional C.A.'];
  if (ferreteraSupplier) {
    let priceList = await prisma.priceList.findFirst({
      where: { tenantId: DEMO_TENANT_ID, vendorId: ferreteraSupplier.id },
    });

    if (!priceList) {
      priceList = await prisma.priceList.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          name: 'Lista de Precios Mayorista - Ferretera Nacional 2026',
          vendorId: ferreteraSupplier.id,
          validFrom: new Date('2026-01-01'),
          validTo: new Date('2026-12-31'),
          isActive: true,
        },
      });
    }

    const itemsToLink = [
      { sku: 'BOS-GSB-550', price: 42.0 },
      { sku: 'TRU-MART-16', price: 7.2 },
      { sku: 'STA-DEST-6P', price: 11.0 },
      { sku: 'DEW-DWE-4010', price: 52.0 },
    ];

    for (const it of itemsToLink) {
      const prod = seededProducts[it.sku];
      if (prod) {
        await prisma.priceListItem.upsert({
          where: { priceListId_productId: { priceListId: priceList.id, productId: prod.id } },
          update: { unitPrice: it.price },
          create: {
            priceListId: priceList.id,
            productId: prod.id,
            unitPrice: it.price,
          },
        });
      }
    }
    console.log('✓ Seeded purchasing price list');

    // 1 Completed Purchasing Order with GoodsReceipt
    const existingCompletedPO = await prisma.purchasingOrder.findFirst({
      where: { tenantId: DEMO_TENANT_ID, notes: 'Pedido inicial de reposición herramientas' },
    });

    if (!existingCompletedPO) {
      const hammer = seededProducts['TRU-MART-16'];
      const drill = seededProducts['BOS-GSB-550'];

      const po = await prisma.purchasingOrder.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          status: PurchasingOrderStatus.COMPLETED,
          supplierId: ferreteraSupplier.id,
          supplierName: ferreteraSupplier.legalName,
          supplierTaxId: ferreteraSupplier.taxIdValue,
          supplierEmail: ferreteraSupplier.commercialName,
          notes: 'Pedido inicial de reposición herramientas',
          completedAt: new Date(),
          lines: {
            create: [
              {
                productId: hammer.id,
                productSku: hammer.sku,
                productName: hammer.name,
                orderedQuantity: 20,
                receivedQuantity: 20,
                unitCost: hammer.costPrice,
                totalCost: 20 * hammer.costPrice,
              },
              {
                productId: drill.id,
                productSku: drill.sku,
                productName: drill.name,
                orderedQuantity: 10,
                receivedQuantity: 10,
                unitCost: drill.costPrice,
                totalCost: 10 * drill.costPrice,
              },
            ],
          },
        },
        include: { lines: true },
      });

      // Goods receipt
      await prisma.goodsReceipt.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          purchasingOrderId: po.id,
          status: GoodsReceiptStatus.RECEIVED,
          receivedAt: new Date(),
          notes: 'Mercancía recibida conforme en Almacén Principal',
          lines: {
            create: po.lines.map((l) => ({
              purchasingOrderLineId: l.id,
              receivedQuantity: l.orderedQuantity,
              damagedQuantity: 0,
            })),
          },
        },
      });
      console.log('✓ Seeded completed purchase order with goods receipt');
    }

    // 1 Approved Purchasing Order in transit (Montana)
    const montanaSupplier = suppliers['Corporación Pinturas Montana S.A.'];
    const whitePaint = seededProducts['MON-CAU-BLA-1G'];
    if (montanaSupplier && whitePaint) {
      const existingApprovedPO = await prisma.purchasingOrder.findFirst({
        where: { tenantId: DEMO_TENANT_ID, notes: 'Pedido en tránsito - Pinturas Montana' },
      });
      if (!existingApprovedPO) {
        await prisma.purchasingOrder.create({
          data: {
            tenantId: DEMO_TENANT_ID,
            status: PurchasingOrderStatus.APPROVED,
            supplierId: montanaSupplier.id,
            supplierName: montanaSupplier.legalName,
            supplierTaxId: montanaSupplier.taxIdValue,
            notes: 'Pedido en tránsito - Pinturas Montana',
            lines: {
              create: [
                {
                  productId: whitePaint.id,
                  productSku: whitePaint.sku,
                  productName: whitePaint.name,
                  orderedQuantity: 25,
                  receivedQuantity: 0,
                  unitCost: whitePaint.costPrice,
                  totalCost: 25 * whitePaint.costPrice,
                },
              ],
            },
          },
        });
        console.log('✓ Seeded approved purchase order in transit');
      }
    }
  }

  console.log('\n=================================================');
  console.log('🚀 Seed ejecutado con éxito para todos los módulos:');
  console.log('   - Seguridad y RBAC (Admin, Cajero)');
  console.log('   - Localización (Tasas de cambio e impuestos)');
  console.log('   - Inventario (Categorías, Marcas, Sucursales, Almacenes)');
  console.log('   - Proveedores y Clientes (Business Partners + Legacy)');
  console.log('   - Productos, Stock, Lotes, Reorder Points y Alertas');
  console.log('   - Caja y Medios de Pago (Cajas, POS Abierto, Bancos)');
  console.log('   - Recursos Humanos (Estructura, Cargos, Empleados)');
  console.log('   - Compras (Listas de precios y órdenes de compra)');
  console.log('=================================================\n');
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
