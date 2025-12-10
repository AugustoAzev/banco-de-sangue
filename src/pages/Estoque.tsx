import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Droplet, Plus, Filter, Calendar, Trash2 } from 'lucide-react';

interface Bolsa {
  id: number;
  tipo_sangue: string;
  quantidade: number;
  created_at?: string;
}

export default function Estoque() {
  const [bolsas, setBolsas] = useState<Bolsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  
  const [filtroTipo, setFiltroTipo] = useState('');
  const [novaBolsa, setNovaBolsa] = useState({ tipo_sangue: '', quantidade: 1 });

  // Função auxiliar para estilizar o tipo sanguíneo (Mesmo padrão de Doadores)
  const formatTipoSanguineo = (tipo: string) => {
    if (!tipo) return { text: '-', color: '#6b7280', bg: '#f3f4f6' };
    
    // Converte "A_POSITIVO" para "A+"
    const [grupo, rh] = tipo.split('_');
    const sinal = rh === 'POSITIVO' ? '+' : '-';
    
    return { 
      text: `${grupo}${sinal}`, 
      color: '#991b1b', // Vermelho escuro
      bg: '#fee2e2'     // Vermelho claro
    };
  };

  useEffect(() => {
    loadBolsas();
  }, [filtroTipo]);

  async function loadBolsas() {
    try {
      setLoading(true);
      const url = filtroTipo ? `/inventory/bolsas?tipo_sangue=${filtroTipo}` : '/inventory/bolsas';
      const response = await api.get(url);
      setBolsas(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar estoque.');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/inventory/bolsas', novaBolsa);
      setShowForm(false);
      setNovaBolsa({ tipo_sangue: '', quantidade: 1 });
      loadBolsas();
      alert('Bolsa registrada com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar bolsa. Verifique os dados.');
    }
  };

  const handleDelete = async (id: number) => {
    if(!window.confirm("Deseja remover este registro de estoque?")) return;
    try {
        await api.delete(`/inventory/bolsas/${id}`);
        loadBolsas();
    } catch (err) {
        alert("Erro ao excluir registro.");
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: '0.5rem' }}>Estoque de Sangue</h1>
          <p className="text-muted">Monitoramento de hemocomponentes</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> {showForm ? 'Cancelar' : 'Registrar Entrada'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={20} /> Registrar Nova Bolsa
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: '1 1 200px' }}>
              <label>Tipo Sanguíneo</label>
              <select 
                className="input-field" 
                value={novaBolsa.tipo_sangue}
                onChange={e => setNovaBolsa({...novaBolsa, tipo_sangue: e.target.value})}
                required
              >
                <option value="">Selecione...</option>
                <option value="A_POSITIVO">A+</option>
                <option value="A_NEGATIVO">A-</option>
                <option value="B_POSITIVO">B+</option>
                <option value="B_NEGATIVO">B-</option>
                <option value="AB_POSITIVO">AB+</option>
                <option value="AB_NEGATIVO">AB-</option>
                <option value="O_POSITIVO">O+</option>
                <option value="O_NEGATIVO">O-</option>
              </select>
            </div>
            <div className="input-group" style={{ flex: '1 1 200px' }}>
              <label>Quantidade (Unidades)</label>
              <input type="number" className="input-field" value={novaBolsa.quantidade} onChange={e => setNovaBolsa({...novaBolsa, quantidade: parseInt(e.target.value)})} min="1" required />
            </div>
            <div className="input-group" style={{ flex: '0 0 auto' }}>
               <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>Salvar Entrada</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={18} className="text-muted" />
        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Filtrar por:</span>
        <select 
          className="input-field" 
          style={{ width: '200px', margin: 0 }}
          value={filtroTipo} 
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os Tipos</option>
          <option value="A_POSITIVO">A+</option>
          <option value="A_NEGATIVO">A-</option>
          <option value="B_POSITIVO">B+</option>
          <option value="B_NEGATIVO">B-</option>
          <option value="AB_POSITIVO">AB+</option>
          <option value="AB_NEGATIVO">AB-</option>
          <option value="O_POSITIVO">O+</option>
          <option value="O_NEGATIVO">O-</option>
        </select>
      </div>

      {/* Listagem com Ações */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Lote</th>
              <th>Tipo Sanguíneo</th>
              <th>Qtd.</th>
              <th>Data</th>
              <th>Status</th>
              <th style={{textAlign: 'right'}}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Atualizando estoque...</td></tr>
            ) : bolsas.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Estoque vazio para este filtro.</td></tr>
            ) : (
              bolsas.map((item, index) => {
                const estilo = formatTipoSanguineo(item.tipo_sangue);
                return (
                  <tr key={item.id || index}>
                    <td className="text-muted">#{item.id.toString().slice(0,8)}...</td>
                    <td>
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: estilo.bg,
                        color: estilo.color,
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        border: '1px solid rgba(153, 27, 27, 0.1)'
                      }}>
                        {estilo.text}
                      </div>
                    </td>
                    <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.quantidade}</td>
                    <td>
                        {item.created_at ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={16} className="text-muted" />
                                {new Date(item.created_at).toLocaleDateString('pt-BR')}
                            </div>
                        ) : '-'}
                    </td>
                    <td><span className="badge bg-green-50" style={{ color: '#166534' }}>Disponível</span></td>
                    <td style={{textAlign: 'right'}}>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} title="Excluir Lote">
                          <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}