import { UserRepository } from '../domain/user.repository.interface';

export class ManageUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string) {
    return this.userRepository.findById(id);
  }

  async findByTenant(tenantId: string) {
    return this.userRepository.findByTenant(tenantId);
  }

  async softDelete(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user || user.deletedAt) throw new Error('User not found');
    return this.userRepository.update(id, {
      deletedAt: new Date(),
      status: 'inactive',
    } as any);
  }

  async linkEmployee(userId: string, employeeId: string) {
    return this.userRepository.update(userId, { employeeId } as any);
  }

  async unlinkEmployee(userId: string) {
    return this.userRepository.update(userId, { employeeId: null } as any);
  }
}
