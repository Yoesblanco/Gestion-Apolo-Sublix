import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  ShoppingBag,
  ChevronLeft,
  Menu
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const { logout } = useAuth();
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useAppContext();
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
    <aside className="sidebar glass collapsed">
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={item.label}
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
