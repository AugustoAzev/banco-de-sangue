'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../../src/services/api';
import { Plus, Trash2, Pencil, X, Package } from 'lucide-react';
import { useToast } from '../../../src/contexts/ToastContext';
import { INVENTORY_POLICY, isSupplyLow } from '../../../src/lib/inventory-policy';
import { useFocusTarget } from '../../../src/hooks/use-focus-target';

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
  const openerIdRef = useRef('btn-novo-insumo');
  const focusOn = useFocusTarget();

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
    openerIdRef.current = 'btn-novo-insumo';
    focusOn('insumo-nome');
  };

  const handleEdit = (item: Insumo) => {
    setFormData({ nome: item.nome, quantidade: String(item.quantidade) });
    setEditingItem(item);
    setErrors({});
    setShowForm(true);
    openerIdRef.current = `editar-insumo-${item.id}`;
    focusOn('insumo-nome');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ nome: '', quantidade: '0' });
    setErrors({});
    focusOn(openerIdRef.current);
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
    if (Object.keys(found).length > 0) {
      document.getElementById(found.nome ? 'insumo-nome' : 'insumo-quantidade')?.focus();
      return;
    }
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
          <button id="btn-novo-insumo" className="btn btn-primary" onClick={openNew}>
            <Plus size={20} /> Adicionar Item
          </button>
        )}
      </div>

      {showForm && (
        <section className="card form-card" aria-labelledby="insumo-titulo">
          <div className="form-card-header">
            <h2 id="insumo-titulo"><Package size={20} /> {editingItem ? `Editar Insumo: ${editingItem.nome}` : 'Novo Insumo'}</h2>
            <button type="button" className="icon-btn" onClick={closeForm} title="Fechar formulário" aria-label="Fechar formulário de insumo"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid form-grid-wide">
              <div className="input-group">
                <label htmlFor="insumo-nome">Nome do Material *</label>
                <input
                  id="insumo-nome"
                  required
                  aria-invalid={!!errors.nome}
                  aria-describedby={errors.nome ? 'insumo-nome-erro' : undefined}
                  className={`input-field${errors.nome ? ' input-error' : ''}`}
                  placeholder="Ex: Seringas descartáveis 5ml"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                />
                {errors.nome && <p id="insumo-nome-erro" className="field-error">{errors.nome}</p>}
              </div>
              <div className="input-group">
                <label htmlFor="insumo-quantidade">Quantidade *</label>
                <input
                  id="insumo-quantidade"
                  type="number" min="0" step="1"
                  required
                  aria-invalid={!!errors.quantidade}
                  aria-describedby={errors.quantidade ? 'insumo-quantidade-erro' : 'insumo-quantidade-dica'}
                  className={`input-field${errors.quantidade ? ' input-error' : ''}`}
                  value={formData.quantidade}
                  onChange={e => setFormData({ ...formData, quantidade: e.target.value })}
                />
                {errors.quantidade
                  ? <p id="insumo-quantidade-erro" className="field-error">{errors.quantidade}</p>
                  : <p id="insumo-quantidade-dica" className="field-hint">Abaixo de {INVENTORY_POLICY.lowSupplyThreshold} unidades o item aparece como baixo estoque.</p>}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingItem ? 'Salvar Alterações' : 'Adicionar Insumo'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      <div className="table-container">
        <table aria-busy={loading}>
          <caption className="sr-only">Insumos e materiais em estoque</caption>
          <thead>
            <tr>
              <th scope="col">ID</th><th scope="col">Material / Insumo</th><th scope="col">Quantidade em Estoque</th>
              <th scope="col">Status</th><th scope="col">Ações</th>
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
                  <td className="cell-wrap" style={{ fontWeight: 500 }}>{item.nome}</td>
                  <td style={{ fontSize: '1.1rem' }}>{item.quantidade}</td>
                  <td>
                    {isSupplyLow(item.quantidade)
                      ? <span className="badge badge-warning">Baixo Estoque</span>
                      : <span className="badge badge-success">Normal</span>}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        id={`editar-insumo-${item.id}`} className="icon-btn icon-btn-edit" onClick={() => handleEdit(item)}
                        title="Editar insumo" aria-label={`Editar insumo ${item.nome}`}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="icon-btn icon-btn-danger" onClick={() => handleDelete(item)}
                        title="Excluir insumo" aria-label={`Excluir insumo ${item.nome}`}
                      >
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
