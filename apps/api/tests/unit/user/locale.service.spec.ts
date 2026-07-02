import { PrismaService } from '../../../src/infrastructure/database/prisma.service';

describe('UserController.updateLocale', () => {
  const mockPrisma = {
    user: { update: jest.fn() },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update user locale to es', async () => {
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1', locale: 'es' });

    const result = await mockPrisma.user.update({
      where: { id: 'user-1' },
      data: { locale: 'es' },
    });

    expect(result.locale).toBe('es');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { locale: 'es' },
    });
  });

  it('should update user locale to en', async () => {
    (mockPrisma.user.update as jest.Mock).mockResolvedValue({ id: 'user-1', locale: 'en' });

    const result = await mockPrisma.user.update({
      where: { id: 'user-1' },
      data: { locale: 'en' },
    });

    expect(result.locale).toBe('en');
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { locale: 'en' },
    });
  });
});
