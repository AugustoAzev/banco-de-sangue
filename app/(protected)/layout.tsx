'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../src/contexts/AuthContext';
import { AuthProvider } from '../../src/contexts/AuthContext';
import { LayoutDashboard, Users, Droplet, LogOut, Package } from 'lucide-react';

function Sidebar() {
  const { signOut, user } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    { path: '/dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { path: '/doadores', label: 'Doadores', icon: Users },
    { path: '/estoque', label: 'Estoque de Sangue', icon: Droplet },
    { path: '/insumos', label: 'Insumos', icon: Package },
  ];

  return (
    <aside className="app-sidebar">
      <div className="app-brand">
        <h2 style={{ color: 'var(--color-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Droplet fill="var(--color-primary)" /> Banco de Sangue
        </h2>
        <p>
          Gestão de Hemocentro
        </p>
      </div>

      <nav className="app-nav">
        <ul>
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                <Link
                  href={item.path}
                  aria-current={isActive ? 'page' : undefined}
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

      <div className="app-user">
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
  );
}

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { signed, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !signed) {
      router.push('/');
    }
  }, [loading, signed, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-text-muted)' }}>
        Carregando sistema...
      </div>
    );
  }

  if (!signed) return null;

  return (
    <div className="layout-container">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedContent>{children}</ProtectedContent>
    </AuthProvider>
  );
}
