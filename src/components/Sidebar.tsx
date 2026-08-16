import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  ShoppingBag,
  X,
} from 'lucide-react';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Inventario', path: '/inventario' },
    { icon: ShoppingCart, label: 'Ventas', path: '/ventas' },
    { icon: ClipboardList, label: 'Pedidos', path: '/pedidos' },
    { icon: ShoppingBag, label: 'Por Comprar', path: '/por-comprar' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: Settings, label: 'Configuración', path: '/configuracion' },
  ];

  return (
    <aside className={`sidebar glass ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header-mobile">
        <button className="mobile-close-btn" onClick={onClose} aria-label="Cerrar menú">
          <X size={24} />
        </button>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
            onClick={onClose}
          >
            <item.icon size={20} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title="Cerrar Sesión">
          <LogOut size={20} />
          <span className="nav-label">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
