import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

// Define a estrutura do usuário que vem do backend
interface User {
  name: string;
  role: string;
  email: string;
}

// Define o formato dos dados que o contexto vai compartilhar
interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
}

// Cria o contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao carregar a aplicação, verifica se existem dados salvos
    const storagedUser = localStorage.getItem('@BancoSangue:user');
    const storagedToken = localStorage.getItem('@BancoSangue:token');

    if (storagedToken && storagedUser) {
      // Se tiver token, injeta no header padrão do Axios
      api.defaults.headers.common['Authorization'] = `Bearer ${storagedToken}`;
      setUser(JSON.parse(storagedUser));
    }
    setLoading(false);
  }, []);

  const signIn = (token: string, userData: User) => {
    // Salva token e usuário no localStorage
    localStorage.setItem('@BancoSangue:token', token);
    localStorage.setItem('@BancoSangue:user', JSON.stringify(userData));
    
    // Configura o token nas requisições futuras
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Atualiza o estado da aplicação
    setUser(userData);
  };

  const signOut = () => {
    // Limpa tudo ao sair
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ signed: !!user, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para facilitar o uso do contexto
export function useAuth() {
  return useContext(AuthContext);
}