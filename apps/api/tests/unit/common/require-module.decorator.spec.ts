import { RequireModule, MODULE_KEY } from '../../../src/common/guards/require-module.decorator';

describe('RequireModule decorator', () => {
  it('should set metadata with provided modules', () => {
    @RequireModule('sales', 'inventory')
    class TestController {}

    const modules = Reflect.getOwnMetadata(MODULE_KEY, TestController);
    expect(modules).toEqual(['sales', 'inventory']);
  });

  it('should set metadata with single module', () => {
    @RequireModule('inventory')
    class TestController {}

    const modules = Reflect.getOwnMetadata(MODULE_KEY, TestController);
    expect(modules).toEqual(['inventory']);
  });

  it('should set metadata on method level', () => {
    class TestController {
      @RequireModule('cash-payments')
      someMethod() {}
    }

    const modules = Reflect.getOwnMetadata(
      MODULE_KEY,
      TestController.prototype.someMethod,
    );
    expect(modules).toEqual(['cash-payments']);
  });
});
