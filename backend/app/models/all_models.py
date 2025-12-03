from sqlalchemy import Column, Integer, String, Boolean, Date, Enum, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    empresa = Column(String(100), nullable=False)
    cnpj = Column(String(50), nullable=False)
    endereco = Column(String(200), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(100), nullable=False)

class Empresa(Base):
    __tablename__ = "empresas"
    id = Column(Integer, primary_key=True, index=True)
    name_empresa = Column(String(255), nullable=False)
    cnpj = Column(String(20), unique=True, nullable=False)
    endereco = Column(String(255), nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class Funcionario(Base):
    __tablename__ = "funcionarios"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cargo = Column(Enum('limpeza','balconista','estoque','outro'), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False)
    pis = Column(String(20))
    telefone = Column(String(15))
    email = Column(String(255))
    complemento = Column(String(255))
    empresa_id = Column(Integer, ForeignKey("empresas.id"))
    password = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class Doador(Base):
    __tablename__ = "doadores"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    documento = Column(Enum('rg','cnh','carteira-trabalho','carteira-conselho-prof'), nullable=False)
    tipo_sangue = Column(Enum('a+','b+','ab+','o+','a-','b-','ab-','o-'), nullable=False)
    telefone = Column(String(15))
    email = Column(String(255))
    complemento = Column(String(255))
    # Observação: seus betas estou usando como base o banco passado nos paramentros "havera uma necessidade de rever isso aqui",
    # aguardar os esquemas do banco com o responsavel pelo BD que é o Wilian 
    # No SQL original eram tinyint(1), aqui mapeamos como Boolean
    condicao_1 = Column(Boolean, nullable=False) # 16-69 anos
    condicao_2 = Column(Boolean, nullable=False) # > 50kg
    condicao_3 = Column(Boolean, nullable=False) # Sem vacina gripe 48h
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class BolsaSangue(Base):
    __tablename__ = "bolsas_sangue"
    id = Column(Integer, primary_key=True, index=True)
    tipo_sangue = Column(Enum('a+','b+','ab+','o+','a-','b-','ab-','o-'), nullable=False)
    quantidade = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))

class Insumo(Base):
    __tablename__ = "insumos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    quantidade = Column(Integer, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))