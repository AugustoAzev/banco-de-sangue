import { Outlet, Link, useLocation } from 'react-router-dom';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { signed, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return signed ? children : <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/doadores" element={<div className="card">Página de Doadores (Em construção)</div>} />
            <Route path="/estoque" element={<div className="card">Página de Estoque (Em construção)</div>} />
            <Route path="/insumos" element={<div className="card">Página de Insumos (Em construção)</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;