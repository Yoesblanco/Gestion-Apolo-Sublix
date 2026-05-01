import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { formatUSD } from '../utils/formatters';
import { 
  Wallet,
  Banknote,
  TrendingUp, 
  ArrowUpRight, 
  PlusCircle,
  MinusCircle,
  ArrowLeft,
  Package,
  CreditCard,
  Layers,
  Download,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import './Sales.css';

const Sales = () => {
  const navigate = useNavigate();
  const { transactions, setTransactions, salesTotals } = useAppContext();
  const [showConfirm, setShowConfirm] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [filter, setFilter] = useState('all');

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type.toLowerCase() === filter.toLowerCase();
  });

  const [formData, setFormData] = useState({
    product: '',
    amount: '',
    method: 'Efectivo',
    type: 'ingreso'
  });

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!formData.product || !formData.amount) return;

    const newTx = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      product: formData.product,
      amount: typeof formData.amount === 'string' ? parseFloat(formData.amount.replace(',', '.')) : parseFloat(formData.amount),
      method: formData.method,
      status: 'Completado',
      type: formData.type
    };

    setPendingTx(newTx);
    setShowConfirm(true);
  };

  const confirmTransaction = () => {
    setTransactions(prev => [pendingTx, ...prev]);
    setPendingTx(null);
    setShowConfirm(false);
    setFormData({ product: '', amount: '', method: 'Efectivo', type: 'ingreso' });
  };

  const cancelTransaction = () => {
    setPendingTx(null);
    setShowConfirm(false);
  };

  const handleDeleteTransaction = (id) => {
    const txToDelete = transactions.find(tx => tx.id === id);
    if (txToDelete && txToDelete.orderId && txToDelete.orderId !== 'N/A') {
      alert(`Esta transacción es automática y pertenece al pedido ${txToDelete.orderId}. Para eliminarla o modificarla, debes gestionar el pedido desde la sección de Pedidos.`);
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este movimiento? Los saldos se actualizarán automáticamente.')) {
      setTransactions(prev => prev.filter(tx => tx.id !== id));
    }
  };

  const handleEditClick = (tx) => {
    if (tx.orderId && tx.orderId !== 'N/A') {
      alert(`Esta transacción es automática y pertenece al pedido ${tx.orderId}. Para editarla, debes gestionar el pedido desde la sección de Pedidos.`);
      return;
    }
    setSelectedTx(tx);
    setFormData({
      product: tx.product,
      amount: tx.amount.toString(),
      method: tx.method,
      type: tx.type.toLowerCase()
    });
    setEditModalOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateTransaction = (e) => {
    e.preventDefault();
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === selectedTx.id) {
        return {
          ...tx,
          product: formData.product,
          amount: typeof formData.amount === 'string' ? parseFloat(formData.amount.replace(',', '.')) : parseFloat(formData.amount),
          method: formData.method,
          type: formData.type
        };
      }
      return tx;
    });
    setTransactions(updatedTransactions);
    setEditModalOpen(false);
    setSelectedTx(null);
    setFormData({ product: '', amount: '', method: 'Efectivo', type: 'ingreso' });
  };

  const handleClearHistory = () => {
    const confirm1 = window.confirm('¿Estás seguro de que deseas limpiar todo el historial de ventas? Esta acción es irreversible.');
    if (!confirm1) return;

    const confirm2 = window.confirm('ADVERTENCIA: Al limpiar el historial, los saldos totales en las tarjetas se reiniciarán a $0.00. ¿Deseas continuar?');
    if (confirm2) {
      setTransactions([]);
      alert('Historial de ventas reiniciado correctamente.');
    }
  };

  return (
    <>
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-fade-in">
            <h3>¿Confirmar Movimiento?</h3>
            <div className="confirm-details">
              <p><strong>Concepto:</strong> {pendingTx.product}</p>
              <p><strong>Monto:</strong> ${formatUSD(pendingTx.amount)}</p>
              <p><strong>Tipo:</strong> <span className={`type-badge ${pendingTx.type}`}>{pendingTx.type.toUpperCase()}</span></p>
              <p><strong>Método:</strong> {pendingTx.method}</p>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={cancelTransaction}>Cancelar</button>
              <button className="confirm-btn" onClick={confirmTransaction}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass animate-fade-in">
            <h3>Editar Transacción</h3>
            <form onSubmit={handleUpdateTransaction} className="reporting-form" style={{ marginTop: '20px' }}>
              <div className="form-group">
                <label><Package size={14} /> Producto / Concepto</label>
                <input 
                  type="text" 
                  required
                  value={formData.product}
                  onChange={(e) => setFormData({...formData, product: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label><Banknote size={14} /> Monto ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label><CreditCard size={14} /> Método de Pago</label>
                <select 
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                >
                  <option value="EFECTIVO BCV">EFECTIVO BCV</option>
                  <option value="TRANSFERENCIA BCV">TRANSFERENCIA BCV</option>
                  <option value="USD">USD</option>
                  <option value="USDT">USDT</option>
                  <option value="ZINLI">ZINLI</option>
                </select>
              </div>
              <div className="form-group">
                <label><Layers size={14} /> Tipo</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="egreso">Egreso</option>
                </select>
              </div>
              <div className="modal-actions" style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                <button type="button" className="cancel-btn" onClick={() => setEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="confirm-btn">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sales animate-fade-in">
      <div className="page-header">
        <div className="header-title-area">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2>Ventas y Finanzas</h2>
            <p>Informe detallado de ingresos y egresos</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="clear-history-btn" onClick={handleClearHistory} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem 1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.3s' }}>
            <Trash2 size={18} />
            <span>Limpiar Historial</span>
          </button>
          <button className="export-btn">
            <Download size={20} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      <div className="sales-overview">
        <div className="overview-card glass">
          <div className="card-header">
            <span className="card-title">Balance Neto</span>
            <TrendingUp size={20} className="text-accent" />
          </div>
          <div className="card-body">
            <h3>${formatUSD(salesTotals.total)}</h3>
            <span className="card-subtitle success">
              <ArrowUpRight size={14} /> Neto actual
            </span>
          </div>
        </div>

        <div className="overview-card glass">
          <div className="card-header">
            <span className="card-title">Ingresos Totales</span>
            <PlusCircle size={20} className="text-primary" />
          </div>
          <div className="card-body">
            <h3 className="text-primary">${formatUSD(salesTotals.ingresos)}</h3>
            <span className="card-subtitle success">
              Entradas
            </span>
          </div>
        </div>

        <div className="overview-card glass">
          <div className="card-header">
            <span className="card-title">Egresos Totales</span>
            <MinusCircle size={20} className="text-danger" />
          </div>
          <div className="card-body">
            <h3 className="text-danger">${formatUSD(salesTotals.egresos)}</h3>
            <span className="card-subtitle danger">
              Salidas y gastos
            </span>
          </div>
        </div>
      </div>

      <div className="reporting-section glass">
        <h3>Reportar Movimiento</h3>
        <form onSubmit={handleAddTransaction} className="reporting-form">
          <div className="form-group">
            <label><Package size={14} /> Concepto / Producto</label>
            <input 
              type="text" 
              placeholder="Ej: Venta Taza" 
              value={formData.product}
              onChange={(e) => setFormData({...formData, product: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label><Banknote size={14} /> Monto ($)</label>
            <input 
              type="number" 
              step="0.01" 
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label><CreditCard size={14} /> Método de Pago</label>
            <select 
              value={formData.method}
              onChange={(e) => setFormData({...formData, method: e.target.value})}
            >
              <option value="EFECTIVO BCV">EFECTIVO BCV</option>
              <option value="TRANSFERENCIA BCV">TRANSFERENCIA BCV</option>
              <option value="USD">USD</option>
              <option value="USDT">USDT</option>
              <option value="ZINLI">ZINLI</option>
            </select>
          </div>
          <div className="form-group">
            <label><Layers size={14} /> Tipo de Movimiento</label>
            <div className="type-toggle">
              <button 
                type="button"
                className={`type-btn ${formData.type === 'ingreso' ? 'active-ingreso' : ''}`}
                onClick={() => setFormData({...formData, type: 'ingreso'})}
              >
                Ingreso
              </button>
              <button 
                type="button"
                className={`type-btn ${formData.type === 'egreso' ? 'active-egreso' : ''}`}
                onClick={() => setFormData({...formData, type: 'egreso'})}
              >
                Egreso
              </button>
            </div>
          </div>
          <button type="submit" className="submit-tx-btn">
            <PlusCircle size={20} />
            Registrar Movimiento
          </button>
        </form>
      </div>

      <div className="transactions-section glass">
        <div className="section-header">
          <h3>Historial de Movimientos</h3>
          <div className="history-filters">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todo
            </button>
            <button 
              className={`filter-btn ${filter === 'ingreso' ? 'active' : ''}`}
              onClick={() => setFilter('ingreso')}
            >
              Ingresos
            </button>
            <button 
              className={`filter-btn ${filter === 'egreso' ? 'active' : ''}`}
              onClick={() => setFilter('egreso')}
            >
              Egresos
            </button>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="sales-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-msg">No hay movimientos registrados aún</td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="tx-id">{tx.id}</td>
                    <td className="tx-date">{new Date(tx.date).toLocaleDateString()}</td>
                    <td>{tx.product || tx.description}</td>
                    <td>
                      <span className={`type-badge ${tx.type.toLowerCase()}`}>
                        {tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td className={`tx-amount ${tx.type.toLowerCase() === 'egreso' ? 'text-danger' : 'text-accent'}`}>
                      {tx.type.toLowerCase() === 'egreso' ? '-' : '+'}${formatUSD(tx.amount)}
                    </td>
                    <td>{tx.method}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="tx-edit-btn" onClick={() => handleEditClick(tx)} title="Editar" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                          <Edit2 size={16} />
                        </button>
                        <button className="tx-delete-btn" onClick={() => handleDeleteTransaction(tx.id)} title="Borrar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  );
};

export default Sales;
