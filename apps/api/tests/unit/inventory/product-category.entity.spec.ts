import { ProductCategory } from '../../../src/modules/inventory/domain/product-category.entity';

describe('ProductCategory', () => {
  it('should create with all fields', () => {
    const cat = new ProductCategory(
      'cat-1', 'tenant-1', 'Electronics', null, new Date(),
    );
    expect(cat.id).toBe('cat-1');
    expect(cat.name).toBe('Electronics');
    expect(cat.parentId).toBeNull();
  });

  it('should create with parent category', () => {
    const child = new ProductCategory(
      'cat-2', 'tenant-1', 'Laptops', 'cat-1', new Date(),
    );
    expect(child.parentId).toBe('cat-1');
  });
});
