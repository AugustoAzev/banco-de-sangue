'use client';

import { useState, useEffect } from 'react';
import api from '../../../src/services/api';
import { Plus, Trash2, Pencil, X, Package } from 'lucide-react';
import { useToast } from '../../../src/contexts/ToastContext';
import { INVENTORY_POLICY, isSupplyLow } from '../../../src/lib/inventory-policy';

interface Insumo {
  id: number;
  nome: string;
  quantidade: number;
}

type InsumoErrors = Partial<Record<'nome' | 'quantidade', string>>;

export default function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({ nome: '', quantidade: '0' });
  const [errors, setErrors] = useState<InsumoErrors>({});
  const { success, error, confirm } = useToast();

  async function loadInsumos() {
    try {
      const response = await api.get('/inventory/insumos');
      setInsumos(response.data);
    } catch {
      error('Não foi possível carregar os insumos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInsumos(); }, []);

  const openNew = () => {
    setEditingItem(null);
    setFormData({ nome: '', quantidade: '0' });
    setErrors({});
    setShowForm(true);
  };

  const handleEdit = (item: Insumo) => {
    setFormData({ nome: item.nome, quantidade: String(item.quantidade) });
    setEditingItem(item);
    setErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ nome: '', quantidade: '0' });
    setErrors({});
  };

  const handleDelete = async (item: Insumo) => {
    if (!await confirm(`Excluir o insumo "${item.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/inventory/insumos/${item.id}`);
      loadInsumos();
      success(`Insumo "${item.nome}" excluído.`);
    } catch {
      error('Erro ao excluir insumo.');
    }
  };

  const validate = (): InsumoErrors => {
    const e: InsumoErrors = {};
    if (!formData.nome.trim()) e.nome = 'Informe o nome do material.';
    const qtd = Number(formData.quantidade);
    if (formData.quantidade.trim() === '' || !Number.isInteger(qtd) || qtd < 0) {
      e.quantidade = 'Informe um número inteiro igual ou maior que zero.';
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const payload = { nome: formData.nome.trim(), quantidade: Number(formData.quantidade) };
    try {
      if (editingItem) {
        await api.put(`/inventory/insumos/${editingItem.id}`, payload);
      } else {
        await api.post('/inventory/insumos', payload);
      }
      success(editingItem ? `Insumo "${payload.nome}" atualizado.` : `Insumo "${payload.nome}" adicionado.`);
      closeForm();
      loadInsumos();
    } catch {
      error('Erro ao salvar insumo.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '0.5rem' }}>Gestão de Insumos</h1>
          <p className="text-muted">Controle de materiais e descartáveis</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={20} /> Adicionar Item
          </button>
        )}
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-card-header">
            <h2><Package size={20} /> {editingItem ? `Editar Insumo: ${editingItem.nome}` : 'Novo Insumo'}</h2>
            <button type="button" className="icon-btn" onClick={closeForm} title="Fechar formulário"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid form-grid-wide">
              <div className="input-group">
                <label>Nome do Material</label>
                <input
                  className="input-field"
                  placeholder="Ex: Seringas descartáveis 5ml"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                />
                {errors.nome && <p className="field-error">{errors.nome}</p>}
              </div>
              <div className="input-group">
                <label>Quantidade</label>
                <input
                  type="number" min="0" step="1"
                  className="input-field"
                  value={formData.quantidade}
                  onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                />
                {errors.quantidade
                  ? <p className="field-error">{errors.quantidade}</p>
                  : <p className="field-hint">Abaixo de {INVENTORY_POLICY.lowSupplyThreshold} unidades o item aparece como baixo estoque.</p>}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingItem ? 'Salvar Alterações' : 'Adicionar Insumo'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Material / Insumo</th><th>Quantidade em Estoque</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Carregando insumos...</td></tr>
            ) : insumos.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum insumo registrado.</td></tr>
            ) : (
              insumos.map((item) => (
                <tr key={item.id}>
                  <td className="text-muted">#{item.id}</td>
                  <td style={{ fontWeight: 500 }}>{item.nome}</td>
                  <td style={{ fontSize: '1.1rem' }}>{item.quantidade}</td>
                  <td>
                    {isSupplyLow(item.quantidade)
                      ? <span className="badge badge-warning">Baixo Estoque</span>
                      : <span className="badge badge-success">Normal</span>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-actions">
                      <button className="icon-btn icon-btn-edit" onClick={() => handleEdit(item)} title="Editar insumo">
                        <Pencil size={18} />
                      </button>
                      <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(item)} title="Excluir insumo">
                        <Trash2 size={18} />
                      </button>
                    </div>
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
