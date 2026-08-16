import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.identifier, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container glass animate-fade-in">
        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={40} className="text-primary" />
          </div>
          <h2>Apolo Sublix</h2>
          <p>Gestión Administrativa</p>
        </div>

        {error && (
          <div className="login-error animate-fade-in">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>
              <User size={14} /> Usuario o Correo
            </label>
            <div className="input-with-icon">
              <LogIn size={18} className="input-icon" />
              <input
                type="text"
                placeholder="admin o admin@apolosublix.com"
                required
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <Lock size={14} /> Contraseña
            </label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="login-footer">
          <p>
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
        </div>
      </div>

      <div className="login-bg-elements">
        <div className="bg-blob primary"></div>
        <div className="bg-blob accent"></div>
        <div className="bg-blob purple"></div>
      </div>
    </div>
  );
};

export default Login;
