import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/auth/jwt-auth.guard';
import { RbacGuard } from '@/common/auth/rbac.guard';
import { ModuleEnabledGuard } from '@/common/guards/module-enabled.guard';
import { RequirePermission } from '@/common/auth/require-permission.decorator';
import { RequireModule } from '@/common/guards/require-module.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ProductCategoryService } from '../application/product-category.service';
import { ProductService } from '../application/product.service';
import { WarehouseService } from '../application/warehouse.service';
import { StockService } from '../application/stock.service';
import { TransferService } from '../application/transfer.service';
import { ReorderPointService } from '../application/reorder-point.service';
import { CreateProductCategoryDto, UpdateProductCategoryDto, CreateProductDto, UpdateProductDto, CreateWarehouseDto, AdjustStockDto, CreateTransferDto, SetReorderPointDto, UpdateReorderPointDto } from './dto/inventory.dto';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RbacGuard, ModuleEnabledGuard)
@RequireModule('inventory')
export class InventoryController {
  constructor(
    private readonly categoryService: ProductCategoryService,
    private readonly productService: ProductService,
    private readonly warehouseService: WarehouseService,
    private readonly stockService: StockService,
    private readonly transferService: TransferService,
    private readonly reorderPointService: ReorderPointService,
  ) {}

  // --- Categories ---
  @Post('categories')
  @RequirePermission('inventory:category:create')
  @ApiOperation({ summary: 'Create product category' })
  async createCategory(@Body() dto: CreateProductCategoryDto, @CurrentUser() user: any) {
    return this.categoryService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('categories')
  @RequirePermission('inventory:category:read')
  @ApiOperation({ summary: 'List product categories' })
  async listCategories(@CurrentUser() user: any) {
    return this.categoryService.findAll(user.tenantId);
  }

  @Patch('categories/:id')
  @RequirePermission('inventory:category:update')
  @ApiOperation({ summary: 'Update product category' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.categoryService.update(id, dto);
  }

  @Delete('categories/:id')
  @RequirePermission('inventory:category:delete')
  @ApiOperation({ summary: 'Delete product category' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }

  // --- Products ---
  @Post('products')
  @RequirePermission('inventory:product:create')
  @ApiOperation({ summary: 'Create product' })
  async createProduct(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('products')
  @RequirePermission('inventory:product:read')
  @ApiOperation({ summary: 'List products' })
  async listProducts(
    @CurrentUser() user: any,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.productService.findAll(user.tenantId, {
      categoryId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Get('products/:id')
  @RequirePermission('inventory:product:read')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProduct(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Patch('products/:id')
  @RequirePermission('inventory:product:update')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete('products/:id')
  @RequirePermission('inventory:product:delete')
  @ApiOperation({ summary: 'Soft-delete product' })
  async deleteProduct(@Param('id') id: string) {
    return this.productService.softDelete(id);
  }

  // --- Warehouses ---
  @Post('warehouses')
  @RequirePermission('inventory:warehouse:create')
  @ApiOperation({ summary: 'Create warehouse' })
  async createWarehouse(@Body() dto: CreateWarehouseDto, @CurrentUser() user: any) {
    return this.warehouseService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('warehouses')
  @RequirePermission('inventory:warehouse:read')
  @ApiOperation({ summary: 'List warehouses' })
  async listWarehouses(@CurrentUser() user: any) {
    return this.warehouseService.findAll(user.tenantId);
  }

  @Delete('warehouses/:id')
  @RequirePermission('inventory:warehouse:delete')
  @ApiOperation({ summary: 'Soft-delete warehouse' })
  async deleteWarehouse(@Param('id') id: string) {
    return this.warehouseService.softDelete(id);
  }

  // --- Stock ---
  @Get('stock/:productId/:warehouseId')
  @RequirePermission('inventory:stock:read')
  @ApiOperation({ summary: 'Get stock balance' })
  async getStock(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string) {
    return this.stockService.getBalance(productId, warehouseId);
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
      productId,
      warehouseId,
      type: dto.type,
      quantity: dto.quantity,
      reason: dto.reason,
      userId: user.id,
    });
  }

  @Get('stock/:productId/:warehouseId/movements')
  @RequirePermission('inventory:stock:read')
  @ApiOperation({ summary: 'Get stock movements' })
  async getMovements(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string) {
    return this.stockService.getMovements(productId, warehouseId);
  }

  // --- Transfers ---

  @Post('transfers')
  @RequirePermission('inventory:transfer:create')
  @ApiOperation({ summary: 'Create stock transfer between warehouses' })
  async createTransfer(@Body() dto: CreateTransferDto, @CurrentUser() user: any) {
    return this.transferService.create({ tenantId: user.tenantId, ...dto });
  }

  @Get('transfers')
  @RequirePermission('inventory:transfer:read')
  @ApiOperation({ summary: 'List stock transfers' })
  async listTransfers(@CurrentUser() user: any) {
    return this.transferService.findAll(user.tenantId);
  }

  @Get('transfers/:id')
  @RequirePermission('inventory:transfer:read')
  @ApiOperation({ summary: 'Get transfer by ID' })
  async getTransfer(@Param('id') id: string) {
    return this.transferService.findById(id);
  }

  @Patch('transfers/:id/complete')
  @RequirePermission('inventory:transfer:complete')
  @ApiOperation({ summary: 'Complete transfer (moves stock)' })
  async completeTransfer(@Param('id') id: string) {
    return this.transferService.complete(id);
  }

  @Patch('transfers/:id/cancel')
  @RequirePermission('inventory:transfer:cancel')
  @ApiOperation({ summary: 'Cancel pending transfer' })
  async cancelTransfer(@Param('id') id: string) {
    return this.transferService.cancel(id);
  }

  // --- Reorder Points ---

  @Post('reorder-points')
  @RequirePermission('inventory:reorder-point:manage')
  @ApiOperation({ summary: 'Set reorder point for product in warehouse' })
  async setReorderPoint(@Body() dto: SetReorderPointDto, @CurrentUser() user: any) {
    return this.reorderPointService.set({ tenantId: user.tenantId, ...dto });
  }

  @Get('reorder-points')
  @RequirePermission('inventory:reorder-point:read')
  @ApiOperation({ summary: 'List reorder points' })
  async listReorderPoints(@CurrentUser() user: any) {
    return this.reorderPointService.findAll(user.tenantId);
  }

  @Get('reorder-points/low-stock')
  @RequirePermission('inventory:reorder-point:read')
  @ApiOperation({ summary: 'List products below reorder point' })
  async listLowStock(@CurrentUser() user: any) {
    return this.reorderPointService.findLowStock(user.tenantId);
  }

  @Get('reorder-points/:productId/:warehouseId')
  @RequirePermission('inventory:reorder-point:read')
  @ApiOperation({ summary: 'Get reorder point for product/warehouse' })
  async getReorderPoint(@Param('productId') productId: string, @Param('warehouseId') warehouseId: string) {
    return this.reorderPointService.findOne(productId, warehouseId);
  }

  @Patch('reorder-points/:id')
  @RequirePermission('inventory:reorder-point:manage')
  @ApiOperation({ summary: 'Update reorder point' })
  async updateReorderPoint(@Param('id') id: string, @Body() dto: UpdateReorderPointDto) {
    return this.reorderPointService.update(id, dto);
  }

  @Delete('reorder-points/:id')
  @RequirePermission('inventory:reorder-point:manage')
  @ApiOperation({ summary: 'Delete reorder point' })
  async deleteReorderPoint(@Param('id') id: string) {
    return this.reorderPointService.delete(id);
  }
}
