export interface User {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role?: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  users: User[];
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, username: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
}
