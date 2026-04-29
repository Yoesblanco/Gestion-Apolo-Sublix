import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Cargar usuario actual
    const savedUser = localStorage.getItem('apolo_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Cargar lista de usuarios locales (o crear el admin por defecto)
    const savedUsers = localStorage.getItem('apolo_users');
    let currentUsers = [];
    
    if (savedUsers) {
      currentUsers = JSON.parse(savedUsers);
      // Forzar actualización de la contraseña del admin por si quedó vieja en caché
      currentUsers = currentUsers.map(u => 
        u.username === 'admin' ? { ...u, password: 'admin123' } : u
      );
    } else {
      currentUsers = [
        { id: '1', username: 'admin', email: 'admin@apolosublix.com', password: 'admin123', name: 'Administrador' }
      ];
    }
    
    setUsers(currentUsers);
    localStorage.setItem('apolo_users', JSON.stringify(currentUsers));
    
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const idLower = identifier.trim().toLowerCase();
    
    // Intentar login local primero
    const foundUser = users.find(u => 
      (u.username?.toLowerCase() === idLower || 
       u.email?.toLowerCase() === idLower || 
       u.name?.toLowerCase() === idLower) && 
      u.password === password
    );

    if (foundUser) {
      const sessionUser = { ...foundUser };
      delete sessionUser.password; // No guardar password en sesión
      localStorage.setItem('apolo_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return { success: true };
    }

    // Fallback al backend si existe
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password })
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('apolo_token', data.token);
        localStorage.setItem('apolo_user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true };
      }
    } catch (e) { /* Silencio si el servidor no está */ }

    return { success: false, message: 'Usuario o contraseña incorrectos' };
  };

  const register = async (name, username, email, password) => {
    // Validar duplicados localmente
    if (users.some(u => u.username === username)) {
      return { success: false, message: 'El nombre de usuario ya está en uso' };
    }
    if (users.some(u => u.email === email)) {
      return { success: false, message: 'El correo electrónico ya está registrado' };
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      username,
      email,
      password
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('apolo_users', JSON.stringify(updatedUsers));

    // Intentar registro en backend si existe
    try {
      await fetch(`http://${window.location.hostname}:5000/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
    } catch (e) { /* Silencio */ }

    return { success: true };
  };

  const updateProfile = async (updatedData) => {
    if (!user) return { success: false, message: 'No hay sesión activa' };

    // Validar duplicados (excluyendo al usuario actual)
    if (updatedData.username && users.some(u => u.username === updatedData.username && u.id !== user.id)) {
      return { success: false, message: 'El nombre de usuario ya está en uso' };
    }
    if (updatedData.email && users.some(u => u.email === updatedData.email && u.id !== user.id)) {
      return { success: false, message: 'El correo electrónico ya está en uso' };
    }

    // Filtrar datos: No actualizar password si viene vacío
    const finalUpdate = { ...updatedData };
    if (!finalUpdate.password) {
      delete finalUpdate.password;
    }

    const updatedUsers = users.map(u => {
      if (u.id === user.id) {
        return { ...u, ...finalUpdate };
      }
      return u;
    });

    setUsers(updatedUsers);
    localStorage.setItem('apolo_users', JSON.stringify(updatedUsers));

    const newSessionUser = { ...user, ...finalUpdate };
    delete newSessionUser.password;
    localStorage.setItem('apolo_user', JSON.stringify(newSessionUser));
    setUser(newSessionUser);

    // Intentar actualizar en backend
    try {
      await fetch(`http://${window.location.hostname}:5000/api/auth/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newSessionUser, id: user.id, password: updatedData.password })
      });
    } catch (e) { console.error('Error sincronizando con servidor:', e); }

    return { success: true, message: 'Perfil actualizado correctamente' };
  };

  const logout = () => {
    localStorage.removeItem('apolo_token');
    localStorage.removeItem('apolo_user');
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
