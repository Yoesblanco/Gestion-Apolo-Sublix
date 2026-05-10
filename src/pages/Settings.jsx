import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Moon, Sun, Database, Trash2, Save, LogOut, User } from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { theme, setTheme, addToast } = useAppContext();
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone: user?.phone || '',
    businessName: user?.businessName || '',
    role: user?.role || 'Administrador',
    password: ''
  });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    // Verificar si realmente hubo cambios
    const hasChanges = 
      profileData.name !== (user?.name || '') ||
      profileData.username !== (user?.username || '') ||
      profileData.email !== (user?.email || '') ||
      profileData.phone !== (user?.phone || '') ||
      profileData.businessName !== (user?.businessName || '') ||
      profileData.password !== '';

    if (!hasChanges) {
      setIsEditing(false);
      return;
    }
    
    const confirmSave = window.confirm('¿Estás seguro de que deseas actualizar tu información de perfil? Si cambias tu usuario o contraseña, deberás usarlos en tu próximo inicio de sesión.');
    
    if (!confirmSave) return;

    const result = await updateProfile(profileData);
    if (result.success) {
      addToast(result.message, 'success');
      setProfileData(prev => ({ ...prev, password: '' }));
      setIsEditing(false);
    } else {
      addToast(result.message, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleClearData = () => {
    if (window.confirm('¿ESTÁS SEGURO? Esto eliminará TODOS los datos locales (pedidos, clientes, inventario). Esta acción no se puede deshacer.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSaveSettings = () => {
    addToast('Configuración guardada correctamente.', 'success');
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="page-header">
        <div>
          <h2>Configuración</h2>
          <p>Personaliza tu experiencia y gestiona tus datos</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Visual Settings */}
        <div className="settings-card glass">
          <div className="card-header">
            <Sun size={20} className="text-primary" />
            <h3>Apariencia y Temas</h3>
          </div>
          <div className="card-body">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Tema Visual</h4>
                <p>Cambia entre el modo oscuro premium o el modo claro.</p>
              </div>
              <div className="theme-toggle-group">
                <button 
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <Moon size={16} /> Oscuro
                </button>
                <button 
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <Sun size={16} /> Claro
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-card glass">
          <div className="card-header">
            <Database size={20} className="text-accent" />
            <h3>Gestión de Datos</h3>
          </div>
          <div className="card-body">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Limpiar Base de Datos</h4>
                <p>Borra todos los registros guardados en este navegador.</p>
              </div>
              <button className="danger-btn" onClick={handleClearData}>
                <Trash2 size={16} /> Borrar Todo
              </button>
            </div>
          </div>
        </div>

        {/* Account & Profile Combined (Fixed Grid) */}
        <div className="settings-card glass account-card">
          <div className="card-header">
            <User size={20} className="text-primary" />
            <h3>Gestión de Cuenta</h3>
            <button className="edit-btn-text" onClick={() => setIsEditing(true)}>
              Editar Perfil
            </button>
          </div>
          <div className="card-body">
            <div className="profile-summary">
              <div className="user-profile-header">
                <div className="user-avatar-large">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="user-main-info">
                  <h4>{user?.name || 'Administrador'}</h4>
                  <span>{user?.role || 'Gestor Principal'}</span>
                </div>
              </div>
              <div className="profile-details-grid-mini">
                <div className="detail-item-mini">
                  <label>Usuario</label>
                  <p>{user?.username || 'admin'}</p>
                </div>
                <div className="detail-item-mini">
                  <label>Correo</label>
                  <p>{user?.email}</p>
                </div>
              </div>
              <div className="account-footer">
                <button className="danger-btn-outline" onClick={handleLogout}>
                  <LogOut size={16} /> Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE PERFIL */}
      {isEditing && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsEditing(false)}>
          <div className="modal-content glass animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <User size={24} className="text-primary" />
                <div>
                  <h3>Editar Perfil</h3>
                  <p>Actualiza tu información personal y de acceso</p>
                </div>
              </div>
              <button className="close-modal" onClick={() => setIsEditing(false)}>×</button>
            </div>

            <form onSubmit={handleUpdateProfile} className="profile-form-expanded">
              <div className="form-row">
                <div className="setting-item-column">
                  <label>Nombre Completo</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="settings-input"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div className="setting-item-column">
                  <label>Nombre del Negocio</label>
                  <input 
                    type="text" 
                    value={profileData.businessName}
                    onChange={(e) => setProfileData({...profileData, businessName: e.target.value})}
                    className="settings-input"
                    placeholder="Ej: Apolo Sublix"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="setting-item-column">
                  <label>Usuario</label>
                  <input 
                    type="text" 
                    value={profileData.username}
                    onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                    className="settings-input"
                  />
                </div>
                <div className="setting-item-column">
                  <label>Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="settings-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="setting-item-column">
                  <label>Teléfono</label>
                  <input 
                    type="text" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="settings-input"
                    placeholder="+58 412..."
                  />
                </div>
                <div className="setting-item-column">
                  <label>Nueva Contraseña (opcional)</label>
                  <input 
                    type="password" 
                    value={profileData.password}
                    onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                    className="settings-input"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="form-actions-modal">
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>
                  Cancelar
                </button>
                <button type="submit" className="save-profile-btn-large">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="settings-actions">
        <button className="save-settings-btn" onClick={handleSaveSettings}>
          <Save size={18} /> Guardar Configuración
        </button>
      </div>
    </div>
  );
};

export default Settings;
