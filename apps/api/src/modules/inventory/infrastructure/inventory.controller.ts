import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { ProductCategoryService } from '../application/product-category.service';
import { ProductService } from '../application/product.service';
import { WarehouseService } from '../application/warehouse.service';
import { StorageLocationService } from '../application/storage-location.service';
import { StockService } from '../application/stock.service';
import { TransferService } from '../application/transfer.service';
import { ReorderPointService } from '../application/reorder-point.service';
import { BranchService } from '../application/branch.service';
import { InventorySummaryService } from '../application/inventory-summary.service';
import { ProductBrandService } from '../application/product-brand.service';
import { CreateProductCategoryDto, UpdateProductCategoryDto, CreateProductBrandDto, UpdateProductBrandDto, CreateProductDto, UpdateProductDto, CreateWarehouseDto, UpdateWarehouseDto, CreateBranchDto, UpdateBranchDto, StockMovementQueryDto, AdjustStockDto, CreateTransferDto, SetReorderPointDto, UpdateReorderPointDto, CreateStorageLocationDto, UpdateStorageLocationDto, GenerateStorageLocationsDto } from './dto/inventory.dto';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('inventory')
export class InventoryController {
  constructor(
    private readonly categoryService: ProductCategoryService,
    private readonly productService: ProductService,
    private readonly warehouseService: WarehouseService,
    private readonly storageLocationService: StorageLocationService,
    private readonly branchService: BranchService,
    private readonly stockService: StockService,
    private readonly transferService: TransferService,
    private readonly reorderPointService: ReorderPointService,
    private readonly summaryService: InventorySummaryService,
    private readonly brandService: ProductBrandService,
    private readonly prisma: PrismaService,
  ) {}

  private tenantId(user: any): string {
    if (!user?.effectiveTenantId) throw new BadRequestException('Tenant context is required');
    return user.effectiveTenantId;
  }

  // --- Brands ---
  @Post('brands')
  @RequirePermission('inventory:brand:create')
  @ApiOperation({ summary: 'Create product brand' })
  async createBrand(@Body() dto: CreateProductBrandDto, @CurrentUser() user: any) {
    return this.brandService.create({ tenantId: this.tenantId(user), ...dto });
  }

  @Get('brands')
  @RequirePermission('inventory:brand:read')
  @ApiOperation({ summary: 'List product brands' })
  async listBrands(@CurrentUser() user: any, @Query('isActive') isActive?: string) {
    return this.brandService.findAll(
      this.tenantId(user),
      isActive === undefined ? undefined : isActive === 'true',
    );
  }

  @Get('brands/:id')
  @RequirePermission('inventory:brand:read')
  @ApiOperation({ summary: 'Get product brand' })
  async getBrand(@Param('id') id: string, @CurrentUser() user: any) {
    return this.brandService.findById(this.tenantId(user), id);
  }

  @Patch('brands/:id')
  @RequirePermission('inventory:brand:update')
  @ApiOperation({ summary: 'Update product brand' })
  async updateBrand(@Param('id') id: string, @Body() dto: UpdateProductBrandDto, @CurrentUser() user: any) {
    return this.brandService.update(this.tenantId(user), id, dto);
  }

  @Delete('brands/:id')
  @RequirePermission('inventory:brand:delete')
  @ApiOperation({ summary: 'Deactivate product brand' })
  async deleteBrand(@Param('id') id: string, @CurrentUser() user: any) {
    return this.brandService.deactivate(this.tenantId(user), id);
  }

  // --- Categories ---
  @Post('categories')
  @RequirePermission('inventory:category:create')
  @ApiOperation({ summary: 'Create product category' })
  async createCategory(@Body() dto: CreateProductCategoryDto, @CurrentUser() user: any) {
    return this.categoryService.create({ tenantId: this.tenantId(user), ...dto });
  }

  @Get('categories')
  @RequirePermission('inventory:category:read')
  @ApiOperation({ summary: 'List product categories' })
  async listCategories(@CurrentUser() user: any) {
    return this.categoryService.findAll(this.tenantId(user));
  }

  @Patch('categories/:id')
  @RequirePermission('inventory:category:update')
  @ApiOperation({ summary: 'Update product category' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto, @CurrentUser() user: any) {
    return this.categoryService.update(this.tenantId(user), id, dto);
  }

  @Delete('categories/:id')
  @RequirePermission('inventory:category:delete')
  @ApiOperation({ summary: 'Delete product category' })
  async deleteCategory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.categoryService.delete(this.tenantId(user), id);
  }

  // --- Products ---
  @Post('products')
  @RequirePermission('inventory:product:create')
  @ApiOperation({ summary: 'Create product' })
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productService.create({ tenantId: this.tenantId(user), ...dto });
  }

  @Get('products')
  @RequirePermission('inventory:product:read')
  @ApiOperation({ summary: 'List products' })
  async listProducts(
    @CurrentUser() user: any,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortDir') sortDir?: string,
  ) {
    return this.productService.findAll(this.tenantId(user), {
      categoryId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      sortBy,
      sortDir: sortDir === 'desc' ? 'desc' : 'asc',
    });
  }

  @Get('products/summary')
  @RequirePermission('inventory:product:read')
  @ApiOperation({ summary: 'Stock health, valuation by category and days of cover' })
  async getProductsSummary(@CurrentUser() user: any) {
    return this.summaryService.getSummary(this.tenantId(user));
  }

  @Get('products/:id')
  @RequirePermission('inventory:product:read')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.findById(this.tenantId(user), id);
  }

  @Patch('products/:id')
  @RequirePermission('inventory:product:update')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: any) {
    return this.productService.update(this.tenantId(user), id, dto, user.id);
  }

  @Post('products/:id/barcode')
  @RequirePermission('inventory:product:update')
  @ApiOperation({ summary: 'Generate an internal EAN-13 barcode (restricted circulation prefix 200)' })
  async generateProductBarcode(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.generateBarcode(this.tenantId(user), id);
  }

  @Delete('products/:id')
  @RequirePermission('inventory:product:delete')
  @ApiOperation({ summary: 'Soft-delete product' })
  async deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productService.softDelete(this.tenantId(user), id);
  }

  // --- Warehouses ---
  @Post('warehouses')
  @RequirePermission('inventory:warehouse:create')
  @ApiOperation({ summary: 'Create warehouse' })
  async createWarehouse(@Body() dto: CreateWarehouseDto, @CurrentUser() user: any) {
    return this.warehouseService.create({ tenantId: this.tenantId(user), ...dto });
  }

  @Get('warehouses')
  @RequirePermission('inventory:warehouse:read')
  @ApiOperation({ summary: 'List warehouses' })
  async listWarehouses(@CurrentUser() user: any, @Query('includeInactive') includeInactive?: string) {
    return this.warehouseService.findAll(this.tenantId(user), includeInactive === 'true');
  }

  @Get('warehouses/default')
  @RequirePermission('inventory:warehouse:read')
  @ApiOperation({ summary: 'Get tenant default warehouse' })
  async getDefaultWarehouse(@CurrentUser() user: any) {
    return this.warehouseService.getDefault(this.tenantId(user));
  }

  @Get('warehouses/:id')
  @RequirePermission('inventory:warehouse:read')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async getWarehouse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.warehouseService.findById(this.tenantId(user), id);
  }

  @Get('warehouses/:id/summary')
  @RequirePermission('inventory:warehouse:read')
  @ApiOperation({ summary: 'Warehouse stock summary' })
  async getWarehouseSummary(@Param('id') id: string, @CurrentUser() user: any) {
    return this.warehouseService.getSummary(this.tenantId(user), id);
  }

  @Patch('warehouses/:id/default')
  @RequirePermission('inventory:warehouse:update')
  @ApiOperation({ summary: 'Set warehouse as tenant default' })
  async setDefaultWarehouse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.warehouseService.setDefault(this.tenantId(user), id);
  }

  @Patch('warehouses/:id')
  @RequirePermission('inventory:warehouse:update')
  async updateWarehouse(@Param('id') id: string, @Body() dto: UpdateWarehouseDto, @CurrentUser() user: any) {
    return this.warehouseService.update(this.tenantId(user), id, dto);
  }

  @Delete('warehouses/:id')
  @RequirePermission('inventory:warehouse:delete')
  @ApiOperation({ summary: 'Soft-delete warehouse' })
  async deleteWarehouse(@Param('id') id: string, @CurrentUser() user: any) {
    return this.warehouseService.softDelete(this.tenantId(user), id);
  }

  // --- Storage Locations ---
  @Get('warehouses/:id/locations')
  @RequirePermission('inventory:location:read')
  @ApiOperation({ summary: 'List storage locations of a warehouse' })
  async listStorageLocations(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storageLocationService.list(this.tenantId(user), id);
  }

  @Post('warehouses/:id/locations')
  @RequirePermission('inventory:location:create')
  @ApiOperation({ summary: 'Create a storage location' })
  async createStorageLocation(@Param('id') id: string, @Body() dto: CreateStorageLocationDto, @CurrentUser() user: any) {
    return this.storageLocationService.create(this.tenantId(user), id, dto);
  }

  @Post('warehouses/:id/locations/generate')
  @RequirePermission('inventory:location:create')
  @ApiOperation({ summary: 'Bulk generate a storage location tree' })
  async generateStorageLocations(@Param('id') id: string, @Body() dto: GenerateStorageLocationsDto, @CurrentUser() user: any) {
    return this.storageLocationService.generate(this.tenantId(user), id, dto);
  }

  @Patch('locations/:id')
  @RequirePermission('inventory:location:update')
  @ApiOperation({ summary: 'Update a storage location' })
  async updateStorageLocation(@Param('id') id: string, @Body() dto: UpdateStorageLocationDto, @CurrentUser() user: any) {
    return this.storageLocationService.update(this.tenantId(user), id, dto);
  }

  @Delete('locations/:id')
  @RequirePermission('inventory:location:delete')
  @ApiOperation({ summary: 'Deactivate a storage location' })
  async deleteStorageLocation(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storageLocationService.softDelete(this.tenantId(user), id);
  }

  // --- Branches ---
  @Post('branches')
  @RequirePermission('inventory:branch:create')
  async createBranch(@Body() dto: CreateBranchDto, @CurrentUser() user: any) {
    return this.branchService.create({ tenantId: this.tenantId(user), ...dto });
  }

  @Get('branches')
  @RequirePermission('inventory:branch:read')
  async listBranches(@Query('includeInactive') includeInactive: string | undefined, @CurrentUser() user: any) {
    return this.branchService.findAll(this.tenantId(user), includeInactive === 'true');
  }

  @Get('branches/:id')
  @RequirePermission('inventory:branch:read')
  async getBranch(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchService.findById(this.tenantId(user), id);
  }

  @Patch('branches/:id')
  @RequirePermission('inventory:branch:update')
  async updateBranch(@Param('id') id: string, @Body() dto: UpdateBranchDto, @CurrentUser() user: any) {
    return this.branchService.update(this.tenantId(user), id, dto);
  }

  @Delete('branches/:id')
  @RequirePermission('inventory:branch:delete')
  async deleteBranch(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchService.softDelete(this.tenantId(user), id);
  }

  // --- Stock ---
  @Get('stock')
  @RequirePermission('inventory:stock:read')
  @ApiOperation({ summary: 'List stock balances by warehouse' })
  async listStockBalances(@CurrentUser() user: any) {
    return this.stockService.getBalances(this.tenantId(user));
  }

  @Get('stock/movements')
  @RequirePermission('inventory:stock:read')
  @ApiOperation({ summary: 'List stock movements' })
  async listStockMovements(@CurrentUser() user: any, @Query() query: StockMovementQueryDto) {
    return this.stockService.getAllMovements(this.tenantId(user), query);
  }

  @Get('stock/:productId/:warehouseId')
  @RequirePermission('inventory:stock:read')
  @ApiOperation({ summary: 'Get stock balance' })
  async getStock(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string, @CurrentUser() user: any) {
    return this.stockService.getBalance(this.tenantId(user), productId, warehouseId);
  }

  @Post('stock/:productId/:warehouseId/adjust')
  @RequirePermission('inventory:stock:adjust')
  @ApiOperation({ summary: 'Adjust stock (in/out)' })
  async adjustStock(
    @Param('productId') productId: string,
    @Param('warehouseId') warehouseId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: any,
  ) {
    return this.stockService.adjust({
      tenantId: this.tenantId(user),
      productId,
      warehouseId,
      type: dto.type,
      quantity: dto.quantity,
      reason: dto.reason,
      userId: user.id,
      lotNumber: dto.lotNumber,
      serialNumber: dto.serialNumber,
      expirationDate: dto.expirationDate,
      operationId: dto.operationId,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      expectedQuantity: dto.expectedQuantity,
    });
  }

  @Get('stock/:productId/:warehouseId/movements')
  @RequirePermission('inventory:stock:read')
  @ApiOperation({ summary: 'Get stock movements' })
  async getMovements(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string, @CurrentUser() user: any) {
    return this.stockService.getMovements(this.tenantId(user), productId, warehouseId);
  }

  // --- Transfers ---

  @Post('transfers')
  @RequirePermission('inventory:transfer:create')
  @ApiOperation({ summary: 'Create stock transfer between warehouses' })
  async createTransfer(@Body() dto: CreateTransferDto, @CurrentUser() user: any) {
    return this.transferService.create({ tenantId: this.tenantId(user), ...dto });
  }

  @Get('transfers')
  @RequirePermission('inventory:transfer:read')
  @ApiOperation({ summary: 'List stock transfers' })
  async listTransfers(@CurrentUser() user: any) {
    return this.transferService.findAll(this.tenantId(user));
  }

  @Get('transfers/:id')
  @RequirePermission('inventory:transfer:read')
  @ApiOperation({ summary: 'Get transfer by ID' })
  async getTransfer(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transferService.findById(this.tenantId(user), id);
  }

  @Patch('transfers/:id/complete')
  @RequirePermission('inventory:transfer:complete')
  @ApiOperation({ summary: 'Complete transfer (moves stock)' })
  async completeTransfer(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transferService.complete(this.tenantId(user), id, user.id);
  }

  @Patch('transfers/:id/cancel')
  @RequirePermission('inventory:transfer:cancel')
  @ApiOperation({ summary: 'Cancel pending transfer' })
  async cancelTransfer(@Param('id') id: string, @CurrentUser() user: any) {
    return this.transferService.cancel(this.tenantId(user), id);
  }

  // --- Reorder Points ---

  @Post('reorder-points')
  @RequirePermission('inventory:reorder-point:manage')
  @ApiOperation({ summary: 'Set reorder point for product in warehouse' })
  async setReorderPoint(@Body() dto: SetReorderPointDto, @CurrentUser() user: any) {
    return this.reorderPointService.set({ tenantId: this.tenantId(user), ...dto });
  }

  @Get('reorder-points')
  @RequirePermission('inventory:reorder-point:read')
  @ApiOperation({ summary: 'List reorder points' })
  async listReorderPoints(@CurrentUser() user: any) {
    return this.reorderPointService.findAll(this.tenantId(user));
  }

  @Get('reorder-points/low-stock')
  @RequirePermission('inventory:reorder-point:read')
  @ApiOperation({ summary: 'List products below reorder point' })
  async listLowStock(@CurrentUser() user: any) {
    return this.reorderPointService.findLowStock(this.tenantId(user));
  }

  @Get('reorder-points/:productId/:warehouseId')
  @RequirePermission('inventory:reorder-point:read')
  @ApiOperation({ summary: 'Get reorder point for product/warehouse' })
  async getReorderPoint(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string, @CurrentUser() user: any) {
    return this.reorderPointService.findOne(this.tenantId(user), productId, warehouseId);
  }

  @Patch('reorder-points/:id')
  @RequirePermission('inventory:reorder-point:manage')
  @ApiOperation({ summary: 'Update reorder point' })
  async updateReorderPoint(@Param('id') id: string, @Body() dto: UpdateReorderPointDto, @CurrentUser() user: any) {
    return this.reorderPointService.update(this.tenantId(user), id, dto);
  }

  @Delete('reorder-points/:id')
  @RequirePermission('inventory:reorder-point:manage')
  @ApiOperation({ summary: 'Delete reorder point' })
  async deleteReorderPoint(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reorderPointService.delete(this.tenantId(user), id);
  }

  // --- Third Parties (Client/Vendor detail) ---

  @Get('third-parties/:id')
  @RequirePermission('client-vendor:client:read')
  @ApiOperation({ summary: 'Get third-party detail (client or vendor)' })
  async getThirdParty(@Param('id') id: string, @CurrentUser() user: any) {
    const tenantId = this.tenantId(user);
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) throw new NotFoundException('Third party not found');

    const [client, vendor] = await Promise.all([
      this.prisma.client.findFirst({ where: { id, tenantId, deletedAt: null } }),
      this.prisma.vendor.findFirst({ where: { id, tenantId, deletedAt: null } }),
    ]);
    const entity = client ?? vendor;
    if (!entity) throw new NotFoundException('Third party not found');

    const type = client ? 'customer' : 'vendor';
    return {
      id: entity.id,
      type,
      legalName: entity.legalName,
      taxId: entity.taxId,
      phone: entity.phone ?? '',
      email: entity.email ?? '',
      creditLimit: 0,
      currentBalance: 0,
      currencyCode: 'USD',
      creditExceeded: false,
      transactions: [],
      recentDocuments: [],
    };
  }
}
