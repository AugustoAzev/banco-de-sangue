import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Droplet, Activity, AlertTriangle, Calendar } from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  // Adicionado 'nivelCritico' ao estado
  const [stats, setStats] = useState({ 
    doadores: 0, 
    bolsas: 0, 
    coletasHoje: 0,
    nivelCritico: '-' 
  });
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Função auxiliar para formatar A_POSITIVO -> A+
  const formatType = (type: string) => {
    if (!type) return '-';
    const parts = type.split('_');
    const group = parts[0];
    const rh = parts[1] === 'POSITIVO' ? '+' : '-';
    return `${group}${rh}`;
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [resDoadores, resBolsas] = await Promise.all([
          api.get('/donors/'),
          api.get('/inventory/bolsas')
        ]);

        const bolsas = resBolsas.data;
        const hoje = new Date();

        // 1. Calcular Coletas de Hoje
        const totalColetasHoje = bolsas.filter((item: any) => {
            if (!item.created_at) return false;
            const dataItem = new Date(item.created_at);
            return (
                dataItem.getDate() === hoje.getDate() &&
                dataItem.getMonth() === hoje.getMonth() &&
                dataItem.getFullYear() === hoje.getFullYear()
            );
        }).length;

        // 2. Calcular Nível Crítico (Tipo com menor estoque)
        // Inicializa contadores zerados para todos os tipos
        const counts: Record<string, number> = {
            'A_POSITIVO': 0, 'A_NEGATIVO': 0,
            'B_POSITIVO': 0, 'B_NEGATIVO': 0,
            'AB_POSITIVO': 0, 'AB_NEGATIVO': 0,
            'O_POSITIVO': 0, 'O_NEGATIVO': 0
        };

        // Conta as bolsas reais
        bolsas.forEach((b: any) => {
            if (counts[b.tipo_sangue] !== undefined) {
                counts[b.tipo_sangue]++;
            }
        });

        // Encontra o tipo com menor quantidade (ordenando as entradas)
        const entries = Object.entries(counts);
        // Ordena por quantidade (valor) crescente
        entries.sort((a, b) => a[1] - b[1]);
        
        // Pega o primeiro (menor estoque) e formata
        const menorEstoque = entries[0];
        const tipoCriticoFormatado = formatType(menorEstoque[0]);

        setStats({
          doadores: resDoadores.data.length,
          bolsas: resBolsas.data.length,
          coletasHoje: totalColetasHoje,
          nivelCritico: tipoCriticoFormatado
        });

      } catch (error) {
        console.error("Erro ao carregar estatísticas", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { 
      title: 'Total de Doadores', 
      value: loading ? '-' : stats.doadores, 
      icon: Users, 
      color: '#3b82f6', 
      bg: '#eff6ff',
      desc: 'Cadastrados no sistema',
      path: '/doadores'
    },
    { 
      title: 'Bolsas em Estoque', 
      value: loading ? '-' : stats.bolsas, 
      icon: Droplet, 
      color: '#ef4444', 
      bg: '#fef2f2',
      desc: 'Disponíveis para uso',
      path: '/estoque'
    },
    { 
      title: 'Coletas Hoje', 
      value: loading ? '-' : stats.coletasHoje, 
      icon: Activity, 
      color: '#10b981', 
      bg: '#ecfdf5',
      desc: 'Registradas até agora',
      path: null 
    }, 
    { 
      title: 'Nível Crítico', 
      // Agora usa o valor calculado
      value: loading ? '-' : stats.nivelCritico, 
      icon: AlertTriangle, 
      color: '#f59e0b', 
      bg: '#fffbeb',
      desc: 'Menor estoque atual',
      path: '/estoque'
    }, 
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: '0.5rem' }}>Painel de Controle</h1>
          <p className="text-muted">Visão geral do hemocentro</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--color-text-muted)' }}>
          <Calendar size={18} />
          <span>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
        {cards.map((card, index) => (
          <div 
            key={index} 
            className="card" 
            onClick={() => card.path && navigate(card.path)}
            style={{ 
              transition: 'transform 0.2s, box-shadow 0.2s', 
              cursor: card.path ? 'pointer' : 'default',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              if(card.path) e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              if(card.path) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ 
                backgroundColor: card.bg, 
                padding: '0.75rem', 
                borderRadius: '12px', 
                color: card.color 
              }}>
                <card.icon size={24} />
              </div>
              {index === 3 && <span className="badge badge-warning">Atenção</span>}
            </div>
            
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
              {card.title}
            </p>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-main)' }}>
              {card.value}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Seção de Avisos */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2 className="text-h2" style={{ fontSize: '1.25rem' }}>Movimentações Recentes</h2>
          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Nenhuma movimentação registrada hoje.
            </p>
          </div>
        </div>

        <div className="card" style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}>
          <h2 className="text-h2" style={{ fontSize: '1.1rem', color: '#9a3412', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} /> Avisos do Sistema
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#9a3412', marginTop: '0.5rem', lineHeight: '1.6' }}>
            O estoque de sangue <strong>{stats.nivelCritico}</strong> está abaixo do nível de segurança. Considere contatar doadores compatíveis.
          </p>
          <button 
            className="btn" 
            onClick={() => navigate('/doadores')}
            style={{ 
              backgroundColor: '#ffffff', 
              color: '#9a3412', 
              border: '1px solid #fed7aa', 
              marginTop: '1rem',
              width: '100%',
              fontSize: '0.85rem'
            }}
          >
            Ver Lista de Doadores
          </button>
        </div>
      </div>
    </div>
  );
}