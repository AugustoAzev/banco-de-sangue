import uuid
import enum
from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum, DateTime, Text, func
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

# =======================================================
# ENUMS (Baseados no Prisma)
# =======================================================

class TipoUsuario(str, enum.Enum):
    ADMINISTRADOR = "ADMINISTRADOR"
    ATENDENTE = "ATENDENTE"

class TipoSanguineo(str, enum.Enum):
    A_POSITIVO = "A_POSITIVO"
    A_NEGATIVO = "A_NEGATIVO"
    B_POSITIVO = "B_POSITIVO"
    B_NEGATIVO = "B_NEGATIVO"
    AB_POSITIVO = "AB_POSITIVO"
    AB_NEGATIVO = "AB_NEGATIVO"
    O_POSITIVO = "O_POSITIVO"
    O_NEGATIVO = "O_NEGATIVO"

class StatusDoacao(str, enum.Enum):
    EM_ESTOQUE = "EM_ESTOQUE"
    DESPACHADA = "DESPACHADA"
    DESCARTADA = "DESCARTADA"

# =======================================================
# MODELOS (Tabelas)
# =======================================================

class UnidadeColeta(Base):
    __tablename__ = "unidades_coleta"

    id_unidade = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_fantasia = Column(String(255), nullable=False)
    cnpj = Column(String(20), unique=True, index=True)
    endereco = Column(String(255), nullable=False)
    email_unidade = Column(String(255))
    
    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    usuarios_associados = relationship("UsuarioUnidade", back_populates="unidade")
    doacoes = relationship("Doacao", back_populates="unidade")


class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_completo = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    senha_hash = Column(String(255), nullable=False)
    
    # Dados Profissionais / Pessoais
    cpf = Column(String(14), unique=True, index=True)
    pis = Column(String(20), unique=True)
    cargo = Column(String(100))
    telefone = Column(String(20))
    
    # Enum de Tipo
    tipo = Column(Enum(TipoUsuario), nullable=False)

    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    unidades_trabalho = relationship("UsuarioUnidade", back_populates="usuario")
    doacoes_registradas = relationship("Doacao", back_populates="registrador")


class UsuarioUnidade(Base):
    """ Tabela associativa N:M entre Usuários e Unidades """
    __tablename__ = "usuarios_unidades"

    id_usuario = Column(String(36), ForeignKey("usuarios.id_usuario"), primary_key=True)
    id_unidade = Column(String(36), ForeignKey("unidades_coleta.id_unidade"), primary_key=True)
    ativo = Column(Boolean, default=True)

    # Relacionamentos
    usuario = relationship("Usuario", back_populates="unidades_trabalho")
    unidade = relationship("UnidadeColeta", back_populates="usuarios_associados")


class Doador(Base):
    __tablename__ = "doadores"

    id_doador = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    nome_completo = Column(String(255), nullable=False)
    cpf = Column(String(14), unique=True, nullable=False, index=True)
    
    idade = Column(Integer)
    sexo = Column(String(20))
    tipo_sanguineo = Column(Enum(TipoSanguineo))
    email = Column(String(255))
    telefone = Column(String(20))
    endereco = Column(String(255))

    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    historico_doacoes = relationship("Doacao", back_populates="doador")


class Doacao(Base):
    __tablename__ = "doacoes"

    id_doacao = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    data_doacao = Column(DateTime, server_default=func.now())
    volume_ml = Column(Float, nullable=False)
    observacoes = Column(Text)
    
    status = Column(Enum(StatusDoacao), default=StatusDoacao.EM_ESTOQUE, nullable=False)
    tipo_sanguineo_coletado = Column(Enum(TipoSanguineo), nullable=False)

    # Chaves Estrangeiras
    id_doador = Column(String(36), ForeignKey("doadores.id_doador"), nullable=False)
    id_registrador = Column(String(36), ForeignKey("usuarios.id_usuario"), nullable=False)
    id_unidade = Column(String(36), ForeignKey("unidades_coleta.id_unidade"), nullable=False, index=True)

    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relacionamentos
    doador = relationship("Doador", back_populates="historico_doacoes")
    registrador = relationship("Usuario", back_populates="doacoes_registradas")
    unidade = relationship("UnidadeColeta", back_populates="doacoes")


class Insumo(Base):
    """ Tabela para controle de Materiais e Insumos """
    __tablename__ = "insumos"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nome = Column(String(255), nullable=False)
    quantidade = Column(Integer, default=0, nullable=False)
    
    criado_em = Column(DateTime, server_default=func.now())
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now())