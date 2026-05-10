import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, Info, AlertCircle, Search, User, Database, ArrowRight, ShoppingBag, X, Menu } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { toasts, products, orders, customers } = useAppContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [results, setResults] = React.useState({ products: [], orders: [], customers: [] });
  const [showResults, setShowResults] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Lógica de búsqueda global con protecciones de seguridad
  React.useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults({ products: [], orders: [], customers: [] });
      setShowResults(false);
      return;
    }

    const query = searchTerm.toLowerCase();

    // Protecciones contra datos nulos o indefinidos
    const safeProducts = products || [];
    const safeOrders = orders || [];
    const safeCustomers = customers || [];

    const filteredProducts = safeProducts.filter(item => 
      item && item.name && item.name.toLowerCase().includes(query)
    ).slice(0, 3);

    const filteredOrders = safeOrders.filter(order => 
      order && (
        (order.customerName && order.customerName.toLowerCase().includes(query)) || 
        (order.id && order.id.toString().includes(query))
      )
    ).slice(0, 3);

    const filteredCustomers = safeCustomers.filter(c => 
      c && (
        (c.name && c.name.toLowerCase().includes(query)) || 
        (c.phone && c.phone.includes(query))
      )
    ).slice(0, 3);

    setResults({
      products: filteredProducts,
      orders: filteredOrders,
      customers: filteredCustomers
    });
    setShowResults(true);
  }, [searchTerm, products, orders, customers]);

  const handleResultClick = (path) => {
    navigate(path);
    setSearchTerm('');
    setShowResults(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="app-container">
      {/* Elementos decorativos de fondo */}
      <div className="bg-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="main-content">
        <header className="top-header glass">
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="search-container">
              <div className="search-bar-mini glass">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar pedidos, clientes, productos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
                />
                {searchTerm && (
                  <button className="clear-search-btn" onClick={clearSearch}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {showResults && (
                <div className="search-results-dropdown glass animate-slide-up">
                  {results.products.length > 0 && (
                    <div className="search-section">
                      <label>Inventario</label>
                      {results.products.map(item => (
                        <div key={item.id} className="search-item" onClick={() => handleResultClick('/inventario')}>
                          <div className="item-icon"><Database size={14} /></div>
                          <div className="item-info">
                            <span className="item-title">{item.name}</span>
                            <span className="item-sub">Stock: {item.stock || 0} unidades</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.orders.length > 0 && (
                    <div className="search-section">
                      <label>Pedidos</label>
                      {results.orders.map(order => (
                        <div key={order.id} className="search-item" onClick={() => handleResultClick('/pedidos')}>
                          <div className="item-icon"><ArrowRight size={14} /></div>
                          <div className="item-info">
                            <span className="item-title">Pedido de {order.customerName}</span>
                            <span className="item-sub">ID: #{order.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.customers.length > 0 && (
                    <div className="search-section">
                      <label>Clientes</label>
                      {results.customers.map(c => {
                        const activeOrder = orders.find(o => 
                          (o.customerId === c.id || o.customer === c.name) && 
                          (o.status === 'Pendiente' || o.status === 'En Proceso')
                        );
                        return (
                          <div key={c.id} className="search-item-multi">
                            <div className="search-item" onClick={() => handleResultClick('/clientes')}>
                              <div className="item-icon"><User size={14} /></div>
                              <div className="item-info">
                                <span className="item-title">{c.name}</span>
                                <span className="item-sub">{c.phone || 'Sin teléfono'}</span>
                              </div>
                            </div>
                            {activeOrder && (
                              <div className="search-sub-item" onClick={() => handleResultClick('/pedidos')}>
                                <ShoppingBag size={12} className="text-warning" />
                                <span>Tiene un pedido activo (#{activeOrder.id})</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {Object.values(results).every(arr => arr.length === 0) && (
                    <div className="no-results">No se encontraron coincidencias</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="header-right">
            <div className="system-status">
              <div className="status-dot pulse-green"></div>
              <span>Sistema Online</span>
            </div>
            
            <div className="user-profile-premium">
              <div className="user-info">
                <span className="user-name">{user?.name || 'Administrador'}</span>
                <span className="user-role">{user?.role || 'Gestor Principal'}</span>
              </div>
              <div className="user-avatar">
                {user?.name ? user.name.charAt(0) : <User size={18} />}
              </div>
            </div>
          </div>
        </header>

        <div className="content-area">
          {children}
        </div>

        {/* Custom Toast System */}
        <div className="toast-container">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast-item glass animate-slide-up ${toast.type}`}>
              {toast.type === 'success' && <CheckCircle size={18} className="text-accent" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-danger" />}
              {toast.type === 'info' && <Info size={18} className="text-primary" />}
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Layout;
