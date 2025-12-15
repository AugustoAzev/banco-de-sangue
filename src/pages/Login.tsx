import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Droplet } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Connects to the Python backend
      const response = await api.post('/auth/login', { email, password });
      const { access_token, role, name } = response.data;
      
      signIn(access_token, { name, role, email });
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      backgroundColor: 'var(--color-bg)' 
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '3rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            backgroundColor: '#fee2e2', 
            padding: '1rem', 
            borderRadius: '50%', 
            color: 'var(--color-primary)',
            marginBottom: '1rem'
          }}>
            <Droplet size={40} fill="var(--color-primary)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
            Pulse
          </h1>
          <p className="text-muted">Acesso Administrativo</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              color: '#991b1b', 
              padding: '0.75rem', 
              borderRadius: '6px', 
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              border: '1px solid #fecaca',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">E-mail</label>
            <input 
              id="email"
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@hemocentro.com.br"
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input 
              id="password"
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1.5rem', height: '48px' }}
            disabled={loading}
          >
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p className="text-muted" style={{ fontSize: '0.75rem' }}>
            © 2025 Banco de Sangue Digital. Acesso Restrito.
          </p>
        </div>
      </div>
    </div>
  );
}