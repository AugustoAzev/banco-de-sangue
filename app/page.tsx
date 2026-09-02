'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../src/services/api';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, role, name } = response.data;
      signIn(access_token, { name, role, email });
      router.push('/dashboard');
    } catch {
      setError('Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel" aria-label="Banco de Sangue Digital">
        <div className="brand-kicker"><span /> Cuidado que circula</div>
        <img className="brand-image" src="/banco-de-sangue-logo.png" alt="Gota de sangue sobre uma mão" />
        <div className="brand-copy">
          <p className="brand-eyebrow">Banco de Sangue Digital</p>
          <h1>Conectando cuidado,<br />preservando vidas.</h1>
          <p>Gestão inteligente para que cada doação encontre o seu destino.</p>
        </div>
        <div className="brand-stat"><strong>24h</strong><span>de cuidado contínuo</span></div>
      </section>

      <section className="login-form-area">
        <div className="login-card">
          <div className="login-heading">
            <div className="login-mark"><span>+</span></div>
            <div>
              <p className="login-overline">Área restrita</p>
              <h2>Bem-vindo de volta</h2>
            </div>
          </div>
          <p className="login-intro">Entre para acompanhar o estoque e cuidar do que importa.</p>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">E-mail profissional</label>
            <div className="login-input-wrap"><Mail size={18} aria-hidden="true" /><input id="email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@pulse.com" required autoFocus /></div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="login-input-wrap"><LockKeyhole size={18} aria-hidden="true" /><input id="password" type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" required /></div>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Autenticando...' : <>Acessar sistema <ArrowRight size={18} aria-hidden="true" /></>}
          </button>
        </form>

          <p className="login-footer">© 2025 Banco de Sangue Digital <span /> Ambiente seguro e restrito</p>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
