'use client';

import { useState, useEffect, useRef } from 'react';
import api from '../../../src/services/api';
import { Plus, Pencil, Trash2, X, ShieldOff, UserPlus, UserCog } from 'lucide-react';
import { useToast } from '../../../src/contexts/ToastContext';
import { DONOR_SCREENING_CRITERIA } from '../../../src/lib/donor-eligibility';
import { BLOOD_TYPES, formatBloodType } from '../../../src/lib/blood-types';
import { isGenericDonor } from '../../../src/lib/system-records';
import {
  validateDonorForm,
  fieldForApiError,
  DONOR_FORM_FIELD_ORDER,
  type DonorFormErrors,
} from '../../../src/lib/donor-form-validation';

interface Doador {
  id_doador: string;
  nome_completo: string;
  cpf: string;
  tipo_sanguineo: string;
  idade: number;
  sexo: string;
  email: string;
  telefone: string;
  endereco: string;
  anonimizado_em?: string | null;
}

export default function Doadores() {
  const [doadores, setDoadores] = useState<Doador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<DonorFormErrors>({});
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const { success, error, confirm } = useToast();

  const initialFormState = {
    nome: '', documento: 'RG', cpf: '', tipo_sanguineo: '', idade: '',
    sexo: '', email: '', telefone: '', cep: '', endereco: '',
    condicao_1: false, condicao_2: false, condicao_3: false,
    consentimento_lgpd: false
  };
  const [formData, setFormData] = useState(initialFormState);
  const [cepStatus, setCepStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const formatCpf = (cpf: string) => {
    if (!cpf) return '—';
    const d = cpf.replace(/\D/g, '');
    if (d.length !== 11) return cpf;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  };

  async function loadDoadores() {
    try {
      const response = await api.get('/donors/');
      setDoadores(response.data);
    } catch {
      error('Não foi possível carregar os doadores.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDoadores(); }, []);

  // Depois de um envio com erro, leva a tela até o primeiro campo com problema —
  // o botão "Cadastrar" fica no fim do formulário e o erro pode estar fora da vista.
  useEffect(() => {
    if (submitAttempt === 0) return;
    const first = DONOR_FORM_FIELD_ORDER.find(f => errors[f]);
    if (!first) return;
    formRef.current?.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [submitAttempt]);

  const handleEdit = (doador: Doador) => {
    setFormData({
      nome: doador.nome_completo, documento: 'RG', cpf: doador.cpf,
      tipo_sanguineo: doador.tipo_sanguineo || '', idade: doador.idade ? doador.idade.toString() : '',
      sexo: doador.sexo || '', email: doador.email || '', telefone: doador.telefone || '',
      cep: '', endereco: doador.endereco || '', condicao_1: true, condicao_2: true, condicao_3: true,
      consentimento_lgpd: true
    });
    setErrors({});
    setEditingId(doador.id_doador);
    setShowForm(true);
  };

  const handleDelete = async (doador: Doador) => {
    if (!await confirm(`Excluir o doador "${doador.nome_completo}"? Esta ação não pode ser desfeita. Doadores com doações registradas não podem ser excluídos — nesse caso, use a anonimização.`)) return;
    try {
      await api.delete(`/donors/${doador.id_doador}`);
      success(`Doador "${doador.nome_completo}" excluído.`);
      loadDoadores();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao excluir.';
      error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleAnonymize = async (doador: Doador) => {
    if (!await confirm(`Anonimizar "${doador.nome_completo}"? Nome, CPF, e-mail, telefone e endereço serão removidos permanentemente e não poderão ser recuperados. O histórico de doações é mantido por exigência regulatória (LGPD art. 18, VI).`)) return;
    try {
      await api.patch(`/donors/${doador.id_doador}/anonymize`);
      success('Doador anonimizado com sucesso.');
      loadDoadores();
    } catch (err: any) {
      const msg = err.response?.data?.detail;
      error(typeof msg === 'string' ? msg : 'Erro ao anonimizar doador.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setErrors({});
    setFormData(initialFormState);
    setCepStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const found = validateDonorForm(formData, { editing: !!editingId });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setSubmitAttempt(n => n + 1);
      return;
    }

    try {
      const payload = {
        nome: formData.nome, documento: formData.documento, cpf: formData.cpf,
        tipo_sanguineo: formData.tipo_sanguineo, idade: parseInt(formData.idade), sexo: formData.sexo,
        email: formData.email, telefone: formData.telefone, endereco: formData.endereco,
        condicao_1: formData.condicao_1, condicao_2: formData.condicao_2, condicao_3: formData.condicao_3,
        consentimento_lgpd: formData.consentimento_lgpd
      };

      if (editingId) {
        await api.put(`/donors/${editingId}`, payload);
        success(`Dados de "${formData.nome}" atualizados.`);
      } else {
        await api.post('/donors/', payload);
        success(`Doador "${formData.nome}" cadastrado com sucesso.`);
      }

      handleCancel();
      loadDoadores();
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : 'Erro ao salvar dados.';
      // Erro do servidor que pertence a um campo aparece junto dele (ex.: "CPF já cadastrado").
      const field = fieldForApiError(message);
      if (field) {
        setErrors({ [field]: message });
        setSubmitAttempt(n => n + 1);
      } else {
        error(message);
      }
    }
  };

  const clearError = (field: keyof DonorFormErrors) => {
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError(name as keyof DonorFormErrors);
    if (name === 'cep') setCepStatus('idle');
  };

  const handleCepBlur = async () => {
    const cepDigits = formData.cep.replace(/\D/g, '');
    if (cepDigits.length !== 8) return;

    setCepStatus('loading');
    try {
      const response = await api.get(`/cep/${cepDigits}`);
      const { logradouro, bairro, cidade, uf } = response.data;
      const enderecoFormatado = [logradouro, bairro, cidade && uf ? `${cidade} - ${uf}` : cidade || uf]
        .filter(Boolean)
        .join(', ');
      setFormData(prev => ({ ...prev, endereco: enderecoFormatado }));
      setCepStatus('success');
    } catch {
      setCepStatus('error');
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
    clearError(name === 'consentimento_lgpd' ? 'consentimento_lgpd' : 'triagem');
  };

  const fieldClass = (field: keyof DonorFormErrors) => `input-field${errors[field] ? ' input-error' : ''}`;
  const FieldError = ({ field }: { field: keyof DonorFormErrors }) =>
    errors[field] ? <p className="field-error">{errors[field]}</p> : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="text-h1" style={{ marginBottom: '0.5rem' }}>Gestão de Doadores</h1>
          <p className="text-muted">Cadastre, edite e gerencie os doadores</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={20} /> Novo Doador
          </button>
        )}
      </div>

      {showForm && (
        <div className={`card form-card${editingId ? ' form-card-editing' : ''}`}>
          <div className="form-card-header">
            <h2>
              {editingId ? <UserCog size={20} /> : <UserPlus size={20} />}
              {editingId ? `Editar Doador: ${formData.nome}` : 'Novo Cadastro de Doador'}
            </h2>
            <button type="button" className="icon-btn" onClick={handleCancel} title="Fechar formulário"><X size={22} /></button>
          </div>
          <p className="field-hint" style={{ marginBottom: '1rem' }}>Campos marcados com * são obrigatórios.</p>

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="input-group" data-field="nome">
                <label>Nome Completo *</label>
                <input name="nome" value={formData.nome} onChange={handleInputChange} className={fieldClass('nome')} />
                <FieldError field="nome" />
              </div>
              <div className="input-group" data-field="cpf">
                <label>CPF *</label>
                <input name="cpf" value={formData.cpf} onChange={handleInputChange} className={fieldClass('cpf')} placeholder="000.000.000-00" inputMode="numeric" disabled={!!editingId} />
                {editingId && <p className="field-hint">O CPF não pode ser alterado após o cadastro.</p>}
                <FieldError field="cpf" />
              </div>
              <div className="input-group" data-field="idade">
                <label>Idade *</label>
                <input name="idade" type="number" min={16} max={69} value={formData.idade} onChange={handleInputChange} className={fieldClass('idade')} />
                <FieldError field="idade" />
              </div>
              <div className="input-group" data-field="sexo">
                <label>Sexo *</label>
                <select name="sexo" value={formData.sexo} onChange={handleInputChange} className={fieldClass('sexo')}>
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
                <FieldError field="sexo" />
              </div>
              <div className="input-group" data-field="tipo_sanguineo">
                <label>Tipo Sanguíneo *</label>
                <select name="tipo_sanguineo" value={formData.tipo_sanguineo} onChange={handleInputChange} className={fieldClass('tipo_sanguineo')}>
                  <option value="">Selecione</option>
                  {BLOOD_TYPES.map(t => (
                    <option key={t} value={t}>{formatBloodType(t)}</option>
                  ))}
                </select>
                <FieldError field="tipo_sanguineo" />
              </div>
              <div className="input-group" data-field="email">
                <label>E-mail</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className={fieldClass('email')} />
                <FieldError field="email" />
              </div>
              <div className="input-group">
                <label>Telefone</label>
                <input name="telefone" type="tel" value={formData.telefone} onChange={handleInputChange} className="input-field" />
              </div>
              <div className="input-group">
                <label>CEP</label>
                <input
                  name="cep" type="text" value={formData.cep} onChange={handleInputChange} onBlur={handleCepBlur}
                  className="input-field" placeholder="00000-000" inputMode="numeric" maxLength={9}
                />
                {cepStatus === 'idle' && <p className="field-hint">Ao sair do campo, o endereço é preenchido automaticamente.</p>}
                {cepStatus === 'loading' && <p className="field-hint">Buscando endereço...</p>}
                {cepStatus === 'success' && <p className="field-success">Endereço preenchido automaticamente.</p>}
                {cepStatus === 'error' && <p className="field-error">CEP não encontrado, preencha o endereço manualmente.</p>}
              </div>
              <div className="input-group">
                <label>Endereço</label>
                <input name="endereco" type="text" value={formData.endereco} onChange={handleInputChange} className="input-field" />
              </div>
            </div>

            {!editingId && (
              <div className={`form-section${errors.triagem ? ' form-section-error' : ''}`} data-field="triagem">
                <h3>Critérios de Triagem *</h3>
                {DONOR_SCREENING_CRITERIA.map(c => (
                  <label key={c.name} className="check-row">
                    <input type="checkbox" name={c.name} checked={formData[c.name]} onChange={handleCheckboxChange} />
                    {c.label}
                  </label>
                ))}
                <FieldError field="triagem" />
              </div>
            )}

            {!editingId && (
              <div className={`form-section form-section-lgpd${errors.consentimento_lgpd ? ' form-section-error' : ''}`} data-field="consentimento_lgpd">
                <h3>Privacidade e Proteção de Dados (LGPD) *</h3>
                <label className="check-row" style={{ alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    name="consentimento_lgpd"
                    checked={formData.consentimento_lgpd}
                    onChange={handleCheckboxChange}
                  />
                  <span>
                    Autorizo o tratamento dos meus dados pessoais (nome, CPF, contato e histórico de doações) pela
                    unidade de coleta, exclusivamente para fins de triagem, controle de doações e cumprimento de
                    obrigações regulatórias, conforme a Lei nº 13.709/2018 (LGPD).
                  </span>
                </label>
                <FieldError field="consentimento_lgpd" />
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">{editingId ? 'Salvar Alterações' : 'Cadastrar Doador'}</button>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th><th>CPF</th><th>Tipo</th><th>Idade</th><th>Status</th><th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Carregando doadores...</td></tr>
            ) : doadores.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum doador cadastrado.</td></tr>
            ) : (
              doadores.map((d) => {
                const anonimizado = !!d.anonimizado_em;
                const sistema = isGenericDonor(d);
                return (
                  <tr key={d.id_doador}>
                    <td style={{ fontWeight: 500, fontStyle: anonimizado ? 'italic' : 'normal', color: anonimizado ? 'var(--color-text-muted)' : 'inherit' }}>{d.nome_completo}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.95rem', color: anonimizado ? 'var(--color-text-muted)' : 'inherit' }}>{formatCpf(d.cpf)}</td>
                    <td><span className="blood-type-chip">{formatBloodType(d.tipo_sanguineo)}</span></td>
                    <td>{d.idade} anos</td>
                    <td>
                      {sistema
                        ? <span className="badge badge-neutral">Registro do sistema</span>
                        : anonimizado
                          ? <span className="badge badge-neutral">Anonimizado (LGPD)</span>
                          : <span className="badge badge-success">Ativo</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {sistema ? (
                        <span className="field-hint">Usado nas entradas de estoque</span>
                      ) : (
                        <div className="row-actions">
                          {!anonimizado && (
                            <button className="icon-btn icon-btn-edit" onClick={() => handleEdit(d)} title="Editar doador"><Pencil size={18} /></button>
                          )}
                          {!anonimizado && (
                            <button className="icon-btn icon-btn-warning" onClick={() => handleAnonymize(d)} title="Anonimizar dados (LGPD)"><ShieldOff size={18} /></button>
                          )}
                          <button className="icon-btn icon-btn-danger" onClick={() => handleDelete(d)} title="Excluir doador"><Trash2 size={18} /></button>
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
    </div>
  );
}
