export interface LoginData {
  email: string;
  password: string;
  tenantId?: string;
}

export interface LoginResult {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    tenantId: string;
  };
}

export interface UserCredentials {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  imageUrl: string | null;
  phone: string | null;
  status: string;
  tenantId: string;
  locale: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  deletedAt: Date | null;
}

export interface AuthRepository {
  findUserByEmail(email: string, tenantId: string): Promise<UserCredentials | null>;
  updateLoginAttempts(
    userId: string,
    data: {
      failedLoginAttempts: number;
      status?: string;
      lockedUntil?: Date | null;
      lastLoginAt?: Date;
    },
  ): Promise<void>;
}
