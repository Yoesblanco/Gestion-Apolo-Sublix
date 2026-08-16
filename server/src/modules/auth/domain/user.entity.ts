export interface UserEntity {
  id: string;
  email: string;
  password?: string;
  name: string;
  username?: string | null;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserWithoutPassword {
  id: string;
  email: string;
  name: string;
  username?: string | null;
  role: string;
}

export interface AuthTokens {
  token: string;
  user: UserWithoutPassword;
}
