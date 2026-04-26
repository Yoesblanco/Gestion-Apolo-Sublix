import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Sales from './pages/Sales';
import { AppProvider } from './context/AppContext';

// Placeholder components for other modules
const Settings = () => <div className="animate-fade-in"><h2>Configuración</h2><p>Ajustes del sistema.</p></div>;

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/pedidos" element={<Orders />} />
            <Route path="/ventas" element={<Sales />} />
            <Route path="/clientes" element={<Customers />} />
            <Route path="/configuracion" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
