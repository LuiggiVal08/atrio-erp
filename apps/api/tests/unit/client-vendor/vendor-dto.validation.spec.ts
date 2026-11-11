import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVendorDto, VendorContactDto } from '../../../src/modules/client-vendor/infrastructure/dto/client-vendor.dto';

const baseVendor = { documentId: 'doc-1', legalName: 'Vendor Corp', taxId: 'J-1' };

async function validateVendor(overrides: Record<string, unknown>) {
  const dto = plainToInstance(CreateVendorDto, { ...baseVendor, ...overrides });
  const errors = await validate(dto, { whitelist: true });
  return { dto, errors };
}

describe('Vendor DTO email validation', () => {
  it('accepts an omitted email', async () => {
    const { errors } = await validateVendor({});
    expect(errors).toHaveLength(0);
  });

  it('accepts an empty email and transforms it to undefined', async () => {
    const { dto, errors } = await validateVendor({ email: '' });
    expect(errors).toHaveLength(0);
    expect(dto.email).toBeUndefined();
  });

  it('accepts a whitespace-only email and transforms it to undefined', async () => {
    const { dto, errors } = await validateVendor({ email: '   ' });
    expect(errors).toHaveLength(0);
    expect(dto.email).toBeUndefined();
  });

  it('rejects an invalid email with a Spanish message', async () => {
    const { errors } = await validateVendor({ email: 'correo@empresa' });
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isEmail).toBe('El correo no es válido');
  });

  it('trims surrounding whitespace from a valid email', async () => {
    const { dto, errors } = await validateVendor({ email: '  ventas@proveedor.com  ' });
    expect(errors).toHaveLength(0);
    expect(dto.email).toBe('ventas@proveedor.com');
  });

  it('validates contact emails with the same rules', async () => {
    const dto = plainToInstance(VendorContactDto, { fullName: 'Ana', email: 'ana@empresa' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints?.isEmail).toBe('El correo no es válido');
  });
});
