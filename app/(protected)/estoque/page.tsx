'use client';

import { useState, useEffect } from 'react';
import api from '../../../src/services/api';
import { Droplet, Plus, Filter, Calendar, Trash2, X, PackageMinus } from 'lucide-react';
import { useToast } from '../../../src/contexts/ToastContext';
import { BLOOD_TYPES, formatBloodType, speakBloodType } from '../../../src/lib/blood-types';
import { INVENTORY_POLICY } from '../../../src/lib/inventory-policy';
import { STOCK_EXIT_LABELS, STOCK_EXIT_NOTE_MAX_LENGTH, type StockExitStatus } from '../../../src/lib/stock-movements';
import MovementsList from '../_components/MovementsList';

interface Bolsa {
  id: string;
  tipo_sangue: string;
  quantidade: number;
  created_at?: string;
}

type EntradaErrors = Partial<Record<'tipo_sangue' | 'quantidade', string>>;
type SaidaErrors = Partial<Record<'tipo_sangue' | 'quantidade' | 'observacoes', string>>;
type FormMode = 'entrada' | 'saida' | null;

const SAIDA_INICIAL = { tipo_sangue: '', quantidade: '1', status: 'DESPACHADA' as StockExitStatus, observacoes: '' };

export default function Estoque() {
  const [bolsas, setBolsas] = useState<Bolsa[]>([]);
  const [loading, setLoading] = useState(true);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const showForm = formMode === 'entrada';
  const { success, error, confirm } = useToast();
  const [filtroTipo, setFiltroTipo] = useState('');
  const [novaBolsa, setNovaBolsa] = useState({ tipo_sangue: '', quantidade: '1' });
  const [errors, setErrors] = useState<EntradaErrors>({});
  const [saida, setSaida] = useState(SAIDA_INICIAL);
  const [saidaErrors, setSaidaErrors] = useState<SaidaErrors>({});
  const [movementsKey, setMovementsKey] = useState(0);
  const [todasBolsas, setTodasBolsas] = useState<Bolsa[]>([]);

  async function loadBolsas() {
    try {
      setLoading(true);
      const url = filtroTipo ? `/inventory/bolsas?tipo_sangue=${filtroTipo}` : '/inventory/bolsas';
      const response = await api.get(url);
      setBolsas(response.data);
      // O formulário de saída precisa da quantidade de todos os tipos, mesmo com filtro ativo.
      setTodasBolsas(filtroTipo ? (await api.get('/inventory/bolsas')).data : response.data);
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
    setFormMode(null);
    setNovaBolsa({ tipo_sangue: '', quantidade: '1' });
    setErrors({});
    setSaida(SAIDA_INICIAL);
    setSaidaErrors({});
  };

  const disponivel = (tipo: string) => todasBolsas.find(b => b.tipo_sangue === tipo)?.quantidade ?? 0;
  const tiposComEstoque = BLOOD_TYPES.filter(t => disponivel(t) > 0);

  const openSaida = (tipo = '') => {
    setSaida({ ...SAIDA_INICIAL, tipo_sangue: tipo });
    setSaidaErrors({});
    setFormMode('saida');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateSaida = (): SaidaErrors => {
    const e: SaidaErrors = {};
    if (!saida.tipo_sangue) e.tipo_sangue = 'Selecione o tipo sanguíneo.';
    const qtd = Number(saida.quantidade);
    const max = disponivel(saida.tipo_sangue);
    if (!Number.isInteger(qtd) || qtd < 1) e.quantidade = 'Informe um número inteiro de bolsas, a partir de 1.';
    else if (saida.tipo_sangue && qtd > max) e.quantidade = `Há apenas ${max} bolsa(s) de ${formatBloodType(saida.tipo_sangue)} em estoque.`;
    if (saida.status === 'DESCARTADA' && !saida.observacoes.trim()) e.observacoes = 'Informe o motivo do descarte.';
    return e;
  };

  const handleSaidaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateSaida();
    setSaidaErrors(found);
    if (Object.keys(found).length > 0) {
      const first = (['tipo_sangue', 'quantidade', 'observacoes'] as const).find(f => found[f]);
      document.getElementById(`saida-${first}`)?.focus();
      return;
    }
    const qtd = Number(saida.quantidade);
    const rotulo = formatBloodType(saida.tipo_sangue);
    const acao = STOCK_EXIT_LABELS[saida.status].toLowerCase();
    const ok = await confirm(
      `Registrar o ${acao} de ${qtd} bolsa(s) de ${rotulo}? As bolsas mais antigas desse tipo saem primeiro ` +
      'e deixam de contar no estoque. O registro fica no histórico de movimentações.'
    );
    if (!ok) return;
    try {
      const res = await api.post('/inventory/saidas', {
        tipo_sangue: saida.tipo_sangue, quantidade: qtd, status: saida.status, observacoes: saida.observacoes,
      });
      success(`${STOCK_EXIT_LABELS[saida.status]} de ${res.data.quantidade} bolsa(s) de ${rotulo} registrado.`);
      closeForm();
      loadBolsas();
      setMovementsKey(k => k + 1);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      error(typeof detail === 'string' ? detail : 'Erro ao registrar a saída.');
    }
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
      setMovementsKey(k => k + 1);
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
      setMovementsKey(k => k + 1);
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
        {!formMode && (
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => openSaida()} disabled={tiposComEstoque.length === 0}>
              <PackageMinus size={20} aria-hidden="true" /> Registrar Saída
            </button>
            <button className="btn btn-primary" onClick={() => setFormMode('entrada')}>
              <Plus size={20} /> Registrar Entrada
            </button>
          </div>
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


      {formMode === 'saida' && (
        <section className="card form-card form-card-exit" aria-labelledby="saida-titulo">
          <div className="form-card-header">
            <h2 id="saida-titulo"><PackageMinus size={20} aria-hidden="true" /> Registrar Saída de Bolsas</h2>
            <button type="button" className="icon-btn" onClick={closeForm} aria-label="Fechar formulário de saída" title="Fechar formulário">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="field-hint" style={{ marginBottom: '1rem' }}>
            Use para bolsas enviadas para uso (despacho) ou descartadas. Diferente de excluir, a saída mantém o registro no histórico.
          </p>
          <form onSubmit={handleSaidaSubmit} noValidate>
            <fieldset className="choice-group">
              <legend>Tipo de saída *</legend>
              {(['DESPACHADA', 'DESCARTADA'] as const).map(st => (
                <label key={st} className={`choice${saida.status === st ? ' choice-selected' : ''}`}>
                  <input
                    type="radio" name="saida-status" value={st}
                    checked={saida.status === st}
                    onChange={() => { setSaida({ ...saida, status: st }); setSaidaErrors(prev => ({ ...prev, observacoes: undefined })); }}
                  />
                  <span>
                    <strong>{STOCK_EXIT_LABELS[st]}</strong>
                    <small>{st === 'DESPACHADA' ? 'Bolsa enviada para uso (hospital, setor)' : 'Bolsa inutilizada (vencida, contaminada, violada)'}</small>
                  </span>
                </label>
              ))}
            </fieldset>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="saida-tipo_sangue">Tipo Sanguíneo *</label>
                <select
                  id="saida-tipo_sangue" className={`input-field${saidaErrors.tipo_sangue ? ' input-error' : ''}`}
                  value={saida.tipo_sangue}
                  onChange={e => { setSaida({ ...saida, tipo_sangue: e.target.value }); setSaidaErrors(prev => ({ ...prev, tipo_sangue: undefined, quantidade: undefined })); }}
                  aria-invalid={!!saidaErrors.tipo_sangue}
                  aria-describedby={saidaErrors.tipo_sangue ? 'saida-tipo_sangue-erro' : undefined}
                  required
                >
                  <option value="">Selecione...</option>
                  {tiposComEstoque.map(t => (
                    <option key={t} value={t}>{formatBloodType(t)} — {disponivel(t)} {disponivel(t) === 1 ? 'disponível' : 'disponíveis'}</option>
                  ))}
                </select>
                {saidaErrors.tipo_sangue && <p id="saida-tipo_sangue-erro" className="field-error">{saidaErrors.tipo_sangue}</p>}
              </div>
              <div className="input-group">
                <label htmlFor="saida-quantidade">Quantidade de bolsas *</label>
                <input
                  id="saida-quantidade" type="number" min="1" step="1"
                  max={saida.tipo_sangue ? disponivel(saida.tipo_sangue) : undefined}
                  className={`input-field${saidaErrors.quantidade ? ' input-error' : ''}`}
                  value={saida.quantidade}
                  onChange={e => { setSaida({ ...saida, quantidade: e.target.value }); setSaidaErrors(prev => ({ ...prev, quantidade: undefined })); }}
                  aria-invalid={!!saidaErrors.quantidade}
                  aria-describedby={saidaErrors.quantidade ? 'saida-quantidade-erro' : 'saida-quantidade-dica'}
                  required
                />
                {saidaErrors.quantidade
                  ? <p id="saida-quantidade-erro" className="field-error">{saidaErrors.quantidade}</p>
                  : <p id="saida-quantidade-dica" className="field-hint">
                      {saida.tipo_sangue
                        ? `Disponíveis: ${disponivel(saida.tipo_sangue)}. As mais antigas saem primeiro.`
                        : 'As bolsas mais antigas do tipo saem primeiro.'}
                    </p>}
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="saida-observacoes">
                  {saida.status === 'DESCARTADA' ? 'Motivo do descarte *' : 'Destino (opcional)'}
                </label>
                <input
                  id="saida-observacoes" className={`input-field${saidaErrors.observacoes ? ' input-error' : ''}`}
                  maxLength={STOCK_EXIT_NOTE_MAX_LENGTH}
                  placeholder={saida.status === 'DESCARTADA' ? 'Ex.: Vencida — fora do prazo de validade' : 'Ex.: Hospital Universitário Getúlio Vargas'}
                  value={saida.observacoes}
                  onChange={e => { setSaida({ ...saida, observacoes: e.target.value }); setSaidaErrors(prev => ({ ...prev, observacoes: undefined })); }}
                  aria-invalid={!!saidaErrors.observacoes}
                  aria-describedby={saidaErrors.observacoes ? 'saida-observacoes-erro' : undefined}
                  required={saida.status === 'DESCARTADA'}
                />
                {saidaErrors.observacoes && <p id="saida-observacoes-erro" className="field-error">{saidaErrors.observacoes}</p>}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Registrar {STOCK_EXIT_LABELS[saida.status]}</button>
              <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
            </div>
          </form>
        </section>
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
                        <div className="row-actions">
                          <button
                            className="icon-btn icon-btn-action" onClick={() => openSaida(item.tipo_sangue)}
                            title="Registrar saída" aria-label={`Registrar saída de bolsas ${speakBloodType(item.tipo_sangue)}`}
                          >
                            <PackageMinus size={18} aria-hidden="true" />
                          </button>
                          <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(item)} title="Excluir lote (lançamento incorreto)">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <section className="card movements-card" aria-labelledby="movimentacoes-titulo">
        <h2 id="movimentacoes-titulo" className="panel-title">Movimentações Recentes</h2>
        <MovementsList limite={10} refreshKey={movementsKey} />
      </section>
    </div>
  );
}
