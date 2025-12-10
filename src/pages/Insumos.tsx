import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Trash2, Pencil, X } from 'lucide-react';

interface Insumo {
  id: number;
  nome: string;
  quantidade: number;
}

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Insumo | null>(null);
  
  const [formData, setFormData] = useState({ nome: '', quantidade: 0 });

  useEffect(() => {
    loadInsumos();
  }, []);

  async function loadInsumos() {
    try {
      const response = await api.get('/inventory/insumos');
      setInsumos(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (item: Insumo) => {
    setFormData({ nome: item.nome, quantidade: item.quantidade });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir este insumo?')) return;
    try {
      await api.delete(`/inventory/insumos/${id}`);
      loadInsumos();
    } catch (err) {
      alert('Erro ao excluir insumo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Atualizar (PUT)
        await api.put(`/inventory/insumos/${editingItem.id}`, formData);
      } else {
        // Criar (POST)
        await api.post('/inventory/insumos', formData);
      }
      
      setShowForm(false);
      setEditingItem(null);
      setFormData({ nome: '', quantidade: 0 });
      loadInsumos();
    } catch (err) {
      alert('Erro ao salvar insumo.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="text-h1" style={{ marginBottom: '0.5rem' }}>Gestão de Insumos</h1>
          <p className="text-muted">Controle de materiais e descartáveis</p>
        </div>
        {!showForm && (
            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({nome:'', quantidade:0}); setShowForm(true); }}>
            <Plus size={20} /> Adicionar Item
            </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
             <h3>{editingItem ? 'Editar Item' : 'Novo Item'}</h3>
             <button onClick={() => setShowForm(false)} style={{border:'none', background:'transparent', cursor:'pointer'}}><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 2 }}>
              <label>Nome do Material</label>
              <input 
                className="input-field" 
                placeholder="Ex: Seringas descartáveis 5ml"
                value={formData.nome}
                onChange={e => setFormData({...formData, nome: e.target.value})}
                required
              />
            </div>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Quantidade</label>
              <input 
                type="number" 
                className="input-field" 
                value={formData.quantidade}
                onChange={e => setFormData({...formData, quantidade: parseInt(e.target.value)})}
                required
              />
            </div>
            <div className="input-group">
               <button type="submit" className="btn btn-primary" style={{ height: '42px' }}>
                 {editingItem ? 'Atualizar' : 'Adicionar'}
               </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Material / Insumo</th>
              <th>Quantidade em Estoque</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>Carregando...</td></tr>
            ) : insumos.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>Nenhum insumo registrado.</td></tr>
            ) : (
              insumos.map((item) => (
                <tr key={item.id}>
                  <td className="text-muted">#{item.id}</td>
                  <td style={{ fontWeight: 500 }}>{item.nome}</td>
                  <td style={{ fontSize: '1.1rem' }}>{item.quantidade}</td>
                  <td>
                    {item.quantidade < 10 ? (
                      <span className="badge bg-red-50">Baixo Estoque</span>
                    ) : (
                      <span className="badge bg-blue-50">Normal</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button onClick={() => handleEdit(item)} style={{ marginRight: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
                        <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}