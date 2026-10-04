'use client';

import { useState, useEffect } from 'react';
import api from '../../../src/services/api';
import { Droplet, Plus, Filter, Calendar, Trash2, X } from 'lucide-react';
import { useToast } from '../../../src/contexts/ToastContext';
import { BLOOD_TYPES, formatBloodType } from '../../../src/lib/blood-types';
import { INVENTORY_POLICY } from '../../../src/lib/inventory-policy';

interface Bolsa {
  id: string;
  tipo_sangue: string;
  quantidade: number;
  created_at?: string;
}

type EntradaErrors = Partial<Record<'tipo_sangue' | 'quantidade', string>>;

export default function Estoque() {
  const [bolsas, setBolsas] = useState<Bolsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { success, error, confirm } = useToast();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [novaBolsa, setNovaBolsa] = useState({ tipo_sangue: '', quantidade: '1' });
  const [errors, setErrors] = useState<EntradaErrors>({});

  async function loadBolsas() {
    try {
      setLoading(true);
      const url = filtroTipo ? `/inventory/bolsas?tipo_sangue=${filtroTipo}` : '/inventory/bolsas';
      const response = await api.get(url);
      setBolsas(response.data);
    } catch {
      error('Não foi possível carregar o estoque.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBolsas(); }, [filtroTipo]);

  // Mostra todos os tipos (inclusive os zerados) para que a falta de estoque fique visível.
  const tiposVisiveis = filtroTipo ? [filtroTipo] : [...BLOOD_TYPES];
  const linhas = tiposVisiveis.map(tipo => bolsas.find(b => b.tipo_sangue === tipo) ?? { id: '', tipo_sangue: tipo, quantidade: 0 });

  const closeForm = () => {
    setShowForm(false);
    setNovaBolsa({ tipo_sangue: '', quantidade: '1' });
    setErrors({});
  };

  const validate = (): EntradaErrors => {
    const e: EntradaErrors = {};
    if (!novaBolsa.tipo_sangue) e.tipo_sangue = 'Selecione o tipo sanguíneo.';
    const qtd = Number(novaBolsa.quantidade);
    if (!Number.isInteger(qtd) || qtd < 1) e.quantidade = 'Informe um número inteiro de bolsas, a partir de 1.';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      await api.post('/inventory/bolsas', { tipo_sangue: novaBolsa.tipo_sangue, quantidade: Number(novaBolsa.quantidade) });
      const qtd = Number(novaBolsa.quantidade);
      success(`${qtd} ${qtd === 1 ? 'bolsa registrada' : 'bolsas registradas'} no estoque de ${formatBloodType(novaBolsa.tipo_sangue)}.`);
      closeForm();
      loadBolsas();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      error(typeof detail === 'string' ? detail : 'Erro ao registrar bolsa. Verifique os dados.');
    }
  };

  const handleDelete = async (item: Bolsa) => {
    const rotulo = formatBloodType(item.tipo_sangue);
    const ok = await confirm(
      `Excluir o lote de ${item.quantidade} bolsa(s) do tipo ${rotulo}? Os registros serão apagados. ` +
      'Use esta opção apenas para corrigir um lançamento feito por engano.'
    );
    if (!ok) return;
    try {
      await api.delete(`/inventory/bolsas/${item.id}`);
      loadBolsas();
      success(`Lote de ${rotulo} excluído do estoque.`);
    } catch {
      error('Erro ao excluir lote.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '0.5rem' }}>Estoque de Sangue</h1>
          <p className="text-muted">Monitoramento de hemocomponentes</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> Registrar Entrada
          </button>
        )}
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-card-header">
            <h2><Droplet size={20} /> Registrar Entrada de Bolsas</h2>
            <button type="button" className="icon-btn" onClick={closeForm} title="Fechar formulário"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="input-group">
                <label>Tipo Sanguíneo</label>
                <select
                  className="input-field"
                  value={novaBolsa.tipo_sangue}
                  onChange={e => setNovaBolsa({ ...novaBolsa, tipo_sangue: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {BLOOD_TYPES.map(t => <option key={t} value={t}>{formatBloodType(t)}</option>)}
                </select>
                {errors.tipo_sangue && <p className="field-error">{errors.tipo_sangue}</p>}
              </div>
              <div className="input-group">
                <label>Quantidade de bolsas</label>
                <input
                  type="number" className="input-field" min="1" step="1"
                  value={novaBolsa.quantidade}
                  onChange={e => setNovaBolsa({ ...novaBolsa, quantidade: e.target.value })}
                />
                {errors.quantidade
                  ? <p className="field-error">{errors.quantidade}</p>
                  : <p className="field-hint">Cada unidade corresponde a uma bolsa de {INVENTORY_POLICY.bagVolumeMl} mL.</p>}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Salvar Entrada</button>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card filter-bar">
        <Filter size={18} className="text-muted" />
        <span className="text-muted" style={{ fontSize: '0.9rem' }}>Filtrar por:</span>
        <select
          className="input-field"
          style={{ width: '200px', margin: 0 }}
          value={filtroTipo}
          onChange={e => setFiltroTipo(e.target.value)}
        >
          <option value="">Todos os Tipos</option>
          {BLOOD_TYPES.map(t => <option key={t} value={t}>{formatBloodType(t)}</option>)}
        </select>
        <span className="field-hint" style={{ marginLeft: 'auto' }}>
          Estoque mínimo: {INVENTORY_POLICY.minimumBagsPerType} bolsas por tipo
        </span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Tipo Sanguíneo</th><th>Bolsas Disponíveis</th><th>Última Entrada</th><th>Situação</th><th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Atualizando estoque...</td></tr>
            ) : (
              linhas.map((item) => {
                const abaixo = item.quantidade < INVENTORY_POLICY.minimumBagsPerType;
                return (
                  <tr key={item.tipo_sangue}>
                    <td><span className="blood-type-chip">{formatBloodType(item.tipo_sangue)}</span></td>
                    <td style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{item.quantidade}</td>
                    <td>
                      {item.created_at ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={16} className="text-muted" />
                          {new Date(item.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      ) : <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {item.quantidade === 0
                        ? <span className="badge badge-danger">Sem estoque</span>
                        : abaixo
                          ? <span className="badge badge-warning">Abaixo do mínimo</span>
                          : <span className="badge badge-success">Adequado</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.quantidade > 0 && (
                        <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(item)} title="Excluir lote (lançamento incorreto)">
                          <Trash2 size={18} />
                        </button>
                      )}
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
