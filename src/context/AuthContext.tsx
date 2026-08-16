import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthState | null>(null);
const STORAGE_KEY_USER = 'apolo_user';
const STORAGE_KEY_USERS = 'apolo_users';
const STORAGE_KEY_TOKEN = 'apolo_token';

const sanitizeUser = (user: any): User | null => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser as User;
};

const sanitizeUsers = (users: any[]): User[] => {
  if (!Array.isArray(users)) return [];
  return users.map((user) => sanitizeUser(user)).filter((u): u is User => u !== null);
};

const persistUsers = (users: User[]): void => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(sanitizeUsers(users)));
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        const safeUser = sanitizeUser(parsedUser);
        if (safeUser) {
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(safeUser));
          setUser(safeUser);
        } else {
          localStorage.removeItem(STORAGE_KEY_USER);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }

    const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
    if (savedUsers) {
      try {
        const parsedUsers = JSON.parse(savedUsers);
        const safeUsers = sanitizeUsers(parsedUsers);
        setUsers(safeUsers);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(safeUsers));
      } catch {
        localStorage.removeItem(STORAGE_KEY_USERS);
        setUsers([]);
      }
    }

    setLoading(false);
  }, []);

  const login = async (identifier: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await authService.login(identifier, pass);
      const safeUser = sanitizeUser(data.user);
      if (!safeUser) {
        return { success: false, message: 'Respuesta inválida del servidor' };
      }

      if (data.token) {
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
      }
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(safeUser));
      setUser(safeUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Usuario o contraseña incorrectos' };
    }
  };

  const register = async (
    name: string,
    username: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; message?: string }> => {
    if (users.some((u) => u.username === username)) {
      return { success: false, message: 'El nombre de usuario ya está en uso' };
    }

    if (users.some((u) => u.email === email)) {
      return { success: false, message: 'El correo electrónico ya está registrado' };
    }

    try {
      await authService.register(name, username, email, pass);

      const newUser: User = {
        id: Date.now().toString(),
        name,
        username,
        email,
        role: 'Cliente',
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      persistUsers(updatedUsers);

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err?.message || 'No se pudo registrar el usuario' };
    }
  };

  const updateProfile = async (updatedData: Partial<User>): Promise<{ success: boolean; message?: string }> => {
    if (!user) return { success: false, message: 'No hay sesión activa' };

    if (
      updatedData.username &&
      users.some((storedUser) => storedUser.username === updatedData.username && storedUser.id !== user.id)
    ) {
      return { success: false, message: 'El nombre de usuario ya está en uso' };
    }

    if (
      updatedData.email &&
      users.some((storedUser) => storedUser.email === updatedData.email && storedUser.id !== user.id)
    ) {
      return { success: false, message: 'El correo electrónico ya está en uso' };
    }

    const finalUpdate = { ...updatedData };
    if (!finalUpdate.password) {
      delete finalUpdate.password;
    }

    const updatedUsers = sanitizeUsers(
      users.map((storedUser) => {
        if (storedUser.id === user.id) {
          return { ...storedUser, ...finalUpdate };
        }
        return storedUser;
      })
    );

    setUsers(updatedUsers);
    persistUsers(updatedUsers);

    const newSessionUser = sanitizeUser({ ...user, ...finalUpdate });
    if (!newSessionUser) {
      return { success: false, message: 'No se pudo actualizar el perfil' };
    }

    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newSessionUser));
    setUser(newSessionUser);

    try {
      await authService.updateProfile({
        id: user.id,
        ...newSessionUser,
        ...(updatedData.password ? { password: updatedData.password } : {}),
      });

      return { success: true, message: 'Perfil actualizado correctamente' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error al actualizar perfil en servidor' };
    }
  };

  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    setUser(null);
  };

  const value: AuthState = {
    user,
    users,
    login,
    register,
    logout,
    updateProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
