import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Importação das Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Doadores from './pages/Doadores';
import Estoque from './pages/Estoque';
import Insumos from './pages/Insumos';
import Layout from './components/Layout';

// Componente para proteger rotas privadas
function PrivateRoute({ children }: { children: JSX.Element }) {
  const { signed, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        color: 'var(--color-text-muted)' 
      }}>
        Carregando sistema...
      </div>
    );
  }

  return signed ? children : <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota Pública (Login) */}
          <Route path="/" element={<Login />} />
          
          {/* Rotas Privadas (Protegidas pelo Layout e Contexto) */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/doadores" element={<Doadores />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/insumos" element={<Insumos />} />
          </Route>

          {/* Rota de Catch-all (Redireciona para Login se não encontrar) */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;