from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str

# --- Doador ---

# Schema APENAS para receber dados do Frontend (Input)
class DoadorCreate(BaseModel):
    # Aceita 'nome' do frontend (via alias) ou 'name'
    nome: str
    documento: str = "RG" # Valor padrão se não vier
    cpf: str
    tipo_sanguineo: str
    idade: int
    sexo: str
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    
    # Validações apenas de entrada (usadas na lógica, não no banco Doador)
    condicao_1: bool
    condicao_2: bool
    condicao_3: bool

# Schema APENAS para devolver dados do Banco (Output)
class DoadorResponse(BaseModel):
    id_doador: str
    # Mapeia o campo 'nome_completo' do banco para 'nome_completo' no JSON
    # Se quiser retornar como 'nome', poderia usar alias, mas aqui mantemos o nome da coluna
    nome_completo: str 
    cpf: str
    tipo_sanguineo: Optional[str] = None
    idade: Optional[int] = None
    sexo: Optional[str] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    endereco: Optional[str] = None
    
    # Campos de data
    created_at: Optional[datetime] = Field(None, alias="criado_em") # Mapeia se o banco usar 'criado_em'
    
    class Config:
        from_attributes = True
        populate_by_name = True

# --- Estoque (Bolsas) ---
class BolsaCreate(BaseModel):
    tipo_sangue: str
    quantidade: int

class BolsaResponse(BaseModel):
    id: int 
    tipo_sangue: str
    quantidade: int

    class Config:
        from_attributes = True

# --- Insumos ---
class InsumoCreate(BaseModel):
    nome: str
    quantidade: int

class InsumoResponse(InsumoCreate):
    id: int 
    
    class Config:
        from_attributes = True

# --- Funcionario ---
class FuncionarioBase(BaseModel):
    name: str = Field(..., alias="nome_completo")
    cargo: str
    cpf: str
    pis: Optional[str] = None
    telefone: Optional[str] = None
    email: str
    complemento: Optional[str] = None

    class Config:
        populate_by_name = True

class FuncionarioCreate(FuncionarioBase):
    password: str

class FuncionarioResponse(FuncionarioBase):
    id_usuario: str 
    tipo: str 
    
    class Config:
        from_attributes = True