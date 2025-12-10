import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, Users, Droplet, LogOut, Package } from 'lucide-react';

export default function Layout() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { path: '/doadores', label: 'Doadores', icon: Users },
    { path: '/estoque', label: 'Estoque de Sangue', icon: Droplet },
    { path: '/insumos', label: 'Insumos', icon: Package },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        backgroundColor: '#ffffff', 
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ color: 'var(--color-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Droplet fill="var(--color-primary)" /> Pulse
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '5px' }}>
            Gestão de Hemocentro
          </p>
        </div>

        <nav style={{ flex: 1, padding: '1rem' }}>
          <ul style={{ listStyle: 'none' }}>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                  <Link 
                    to={item.path} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: isActive ? 'var(--color-primary)' : 'var(--color-text-main)',
                      backgroundColor: isActive ? '#fff1f2' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                      transition: 'all 0.2s'
                    }}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: '#fafafa' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{user?.name || 'Usuário'}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user?.role || 'Acesso Restrito'}</p>
          </div>
          <button 
            onClick={signOut}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#ef4444', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
              width: '100%',
              padding: '8px 0'
            }}
          >
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}