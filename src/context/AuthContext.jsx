import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gestion-apolo-sublix.onrender.com';
const STORAGE_KEY_USER = 'apolo_user';
const STORAGE_KEY_USERS = 'apolo_users';

const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
};

const sanitizeUsers = (users) => {
  if (!Array.isArray(users)) return [];

  return users.map((user) => sanitizeUser(user)).filter(Boolean);
};

const persistUsers = (users) => {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(sanitizeUsers(users)));
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

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

  const login = async (identifier, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'Usuario o contraseña incorrectos' };
      }

      const safeUser = sanitizeUser(data.user);
      if (!safeUser) {
        return { success: false, message: 'Respuesta inválida del servidor' };
      }

      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(safeUser));
      setUser(safeUser);
      return { success: true };
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor. Inténtalo más tarde.' };
    }
  };

  const register = async (name, username, email, password) => {
    if (users.some((user) => user.username === username)) {
      return { success: false, message: 'El nombre de usuario ya está en uso' };
    }

    if (users.some((user) => user.email === email)) {
      return { success: false, message: 'El correo electrónico ya está registrado' };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, username, email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'No se pudo registrar el usuario' };
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        username,
        email
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      persistUsers(updatedUsers);

      return { success: true };
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor. Inténtalo más tarde.' };
    }
  };

  const updateProfile = async (updatedData) => {
    if (!user) return { success: false, message: 'No hay sesión activa' };

    if (updatedData.username && users.some((storedUser) => storedUser.username === updatedData.username && storedUser.id !== user.id)) {
      return { success: false, message: 'El nombre de usuario ya está en uso' };
    }

    if (updatedData.email && users.some((storedUser) => storedUser.email === updatedData.email && storedUser.id !== user.id)) {
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
      const payload = {
        id: user.id,
        ...newSessionUser
      };

      if (updatedData.password) {
        payload.password = updatedData.password;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.message || 'No se pudo actualizar el perfil' };
      }

      return { success: true, message: 'Perfil actualizado correctamente' };
    } catch {
      return { success: false, message: 'No se pudo conectar con el servidor. Inténtalo más tarde.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('apolo_token');
    localStorage.removeItem(STORAGE_KEY_USER);
    setUser(null);
  };

  const value = {
    user,
    users,
    login,
    register,
    logout,
    updateProfile,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
