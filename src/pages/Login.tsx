import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Droplet } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, role, name } = response.data;
      
      signIn(access_token, { name, role, email });
      navigate('/dashboard');
    } catch (err) {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
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
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            backgroundColor: '#fee2e2', 
            padding: '1rem', 
            borderRadius: '50%', 
            color: 'var(--color-primary)' 
          }}>
            <Droplet size={32} fill="var(--color-primary)" />
          </div>
        </div>
        
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.5rem', color: 'var(--color-primary)' }}>
          Acesso ao Sistema
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
          Banco de Sangue Digital
        </p>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              color: '#991b1b', 
              padding: '0.75rem', 
              borderRadius: '6px', 
              marginBottom: '1rem',
              fontSize: '0.9rem' 
            }}>
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">E-mail Corporativo</label>
            <input 
              id="email"
              type="text" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ex: admin@banco.com"
              required
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}