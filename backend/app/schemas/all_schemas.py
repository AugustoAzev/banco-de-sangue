from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Auth ---
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str  # 'admin' ou 'funcionario'
    name: str

# --- Doador ---
class DoadorBase(BaseModel):
    name: str
    documento: str
    tipo_sangue: str
    telefone: Optional[str] = None
    email: Optional[str] = None
    complemento: Optional[str] = None
    condicao_1: bool
    condicao_2: bool
    condicao_3: bool

class DoadorCreate(DoadorBase):
    pass

class DoadorResponse(DoadorBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

# --- Estoque (Bolsa e Insumo) ---
class BolsaCreate(BaseModel):
    tipo_sangue: str
    quantidade: int

class BolsaResponse(BolsaCreate):
    id: int
    class Config:
        from_attributes = True

class InsumoCreate(BaseModel):
    nome: str
    quantidade: int

class InsumoResponse(InsumoCreate):
    id: int
    class Config:
        from_attributes = True

# --- Funcionario ---
class FuncionarioCreate(BaseModel):
    name: str
    cargo: str
    cpf: str
    pis: Optional[str] = None
    telefone: Optional[str] = None
    email: str
    password: str
    complemento: Optional[str] = None

class FuncionarioResponse(BaseModel):
    id: int
    name: str
    cargo: str
    email: str
    class Config:
        from_attributes = True