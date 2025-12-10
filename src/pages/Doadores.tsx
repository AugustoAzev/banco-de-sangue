import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface Doador {
  id_doador: string;
  nome_completo: string; // O backend retorna 'nome_completo'
  cpf: string;
  tipo_sanguineo: string;
  idade: number;
  sexo: string;
  email: string;
  telefone: string;
  endereco: string;
}

export default function Doadores() {
  const [doadores, setDoadores] = useState<Doador[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const initialFormState = {
    nome: '', 
    documento: 'RG', 
    cpf: '', 
    tipo_sanguineo: '', 
    idade: '', 
    sexo: '',
    email: '', 
    telefone: '', 
    endereco: '', 
    condicao_1: false, 
    condicao_2: false, 
    condicao_3: false
  };

  const [formData, setFormData] = useState(initialFormState);

  // Função auxiliar para estilizar o tipo sanguíneo
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
    loadDoadores();
  }, []);

  async function loadDoadores() {
    try {
      const response = await api.get('/donors/');
      setDoadores(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // --- Ações de UI ---

  const handleEdit = (doador: Doador) => {
    setFormData({
      nome: doador.nome_completo, 
      documento: 'RG', 
      cpf: doador.cpf,
      tipo_sanguineo: doador.tipo_sanguineo || '',
      idade: doador.idade ? doador.idade.toString() : '',
      sexo: doador.sexo || '',
      email: doador.email || '',
      telefone: doador.telefone || '',
      endereco: doador.endereco || '',
      condicao_1: true, 
      condicao_2: true,
      condicao_3: true
    });
    setEditingId(doador.id_doador);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este doador?')) return;

    try {
      await api.delete(`/donors/${id}`);
      setSuccess('Doador removido com sucesso.');
      loadDoadores();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Erro ao excluir.';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(initialFormState);
    setError('');
    setSuccess('');
  };

  // --- Submit ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = {
        nome: formData.nome,         
        documento: formData.documento,
        cpf: formData.cpf,
        tipo_sanguineo: formData.tipo_sanguineo,
        idade: parseInt(formData.idade),
        sexo: formData.sexo,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        condicao_1: formData.condicao_1,
        condicao_2: formData.condicao_2,
        condicao_3: formData.condicao_3
      };

      if (editingId) {
        await api.put(`/donors/${editingId}`, payload);
        setSuccess('Doador atualizado com sucesso!');
      } else {
        if (!formData.condicao_1 || !formData.condicao_2 || !formData.condicao_3) {
            setError('O doador não atende aos critérios de elegibilidade.');
            return;
        }
        await api.post('/donors/', payload);
        setSuccess('Doador cadastrado com sucesso!');
      }
      
      handleCancel(); 
      loadDoadores(); 
      
    } catch (err: any) {
      console.error("Erro no submit:", err);
      const errorData = err.response?.data?.detail;
      let errorMsg = 'Erro ao salvar dados.';
      
      if (typeof errorData === 'string') {
        errorMsg = errorData;
      } else if (Array.isArray(errorData)) {
        errorMsg = `Erro no campo: ${errorData[0]?.loc?.join('.')} - ${errorData[0]?.msg}`;
      }
      
      setError(errorMsg);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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

      {error && <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>{error}</div>}
      {success && <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: `4px solid ${editingId ? '#f59e0b' : 'var(--color-primary)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 className="text-h2">{editingId ? 'Editar Doador' : 'Novo Cadastro'}</h2>
            <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
              <X size={24} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Nome Completo</label>
                <input name="nome" value={formData.nome} onChange={handleInputChange} className="input-field" required />
              </div>
              <div className="input-group">
                <label>CPF</label>
                <input name="cpf" value={formData.cpf} onChange={handleInputChange} className="input-field" placeholder="000.000.000-00" required disabled={!!editingId} />
              </div>
              <div className="input-group">
                <label>Idade</label>
                <input name="idade" type="number" value={formData.idade} onChange={handleInputChange} className="input-field" required />
              </div>
              <div className="input-group">
                <label>Sexo</label>
                <select name="sexo" value={formData.sexo} onChange={handleInputChange} className="input-field" required>
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>
              <div className="input-group">
                <label>Tipo Sanguíneo</label>
                <select name="tipo_sanguineo" value={formData.tipo_sanguineo} onChange={handleInputChange} className="input-field" required>
                  <option value="">Selecione</option>
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
              <div className="input-group">
                <label>Email</label>
                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="input-field" />
              </div>
              <div className="input-group">
                <label>Telefone</label>
                <input name="telefone" type="tel" value={formData.telefone} onChange={handleInputChange} className="input-field" />
              </div>
              <div className="input-group">
                <label>Endereço</label>
                <input name="endereco" type="text" value={formData.endereco} onChange={handleInputChange} className="input-field" />
              </div>
            </div>

            {!editingId && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Critérios de Triagem</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <input type="checkbox" name="condicao_1" checked={formData.condicao_1} onChange={handleCheckboxChange} />
                    Doador tem entre 16 e 69 anos
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <input type="checkbox" name="condicao_2" checked={formData.condicao_2} onChange={handleCheckboxChange} />
                    Doador pesa mais de 50kg
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <input type="checkbox" name="condicao_3" checked={formData.condicao_3} onChange={handleCheckboxChange} />
                    Não tomou vacina contra gripe nas últimas 48h
                    </label>
                </div>
                </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">
                    {editingId ? 'Salvar Alterações' : 'Cadastrar Doador'}
                </button>
                <button type="button" onClick={handleCancel} className="btn" style={{ border: '1px solid #ccc' }}>
                    Cancelar
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>Tipo</th>
              <th>Idade</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Carregando...</td></tr>
            ) : doadores.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Nenhum doador cadastrado.</td></tr>
            ) : (
              doadores.map((d) => {
                // Prepara estilo do badge
                const estilo = formatTipoSanguineo(d.tipo_sanguineo);
                
                return (
                  <tr key={d.id_doador}>
                    <td style={{ fontWeight: 500 }}>{d.nome_completo}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{d.cpf}</td>
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
                    <td>{d.idade} anos</td>
                    <td><span className="badge bg-green-50" style={{ color: '#166534' }}>Ativo</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                          <button 
                              onClick={() => handleEdit(d)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', padding: '4px' }} 
                              title="Editar"
                          >
                              <Pencil size={18} />
                          </button>
                          <button 
                              onClick={() => handleDelete(d.id_doador)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }} 
                              title="Excluir"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
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