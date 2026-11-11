import * as bcrypt from 'bcryptjs';
import { UserRepository } from '../domain/user.repository.interface';

interface CreateUserInput {
  tenantId: string;
  email: string;
  password: string;
  name: string;
  employeeId?: string;
}

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: CreateUserInput) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.userRepository.create({
      tenantId: dto.tenantId,
      email: dto.email,
      passwordHash,
      name: dto.name,
      employeeId: dto.employeeId,
    });
  }
}
