import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.app.main import app
from backend.app.core.database import Base, get_db
from backend.app.models.all_models import (
    Usuario, TipoUsuario, Doador, TipoSanguineo, Doacao, StatusDoacao,
    Insumo, UnidadeColeta
)
from backend.app.core.security import get_password_hash
import uuid

# In-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()

    # Seed minimal data
    unidade = UnidadeColeta(
        id_unidade=str(uuid.uuid4()),
        nome_fantasia="Hemocentro Teste",
        cnpj="00.000.000/0001-00",
        endereco="Rua Teste, 1"
    )
    session.add(unidade)

    admin = Usuario(
        id_usuario=str(uuid.uuid4()),
        nome_completo="Admin Teste",
        email="admin@teste.com",
        senha_hash=get_password_hash("12345678"),
        tipo=TipoUsuario.ADMINISTRADOR,
        cpf="000.000.000-00"
    )
    session.add(admin)

    atendente = Usuario(
        id_usuario=str(uuid.uuid4()),
        nome_completo="Atendente Teste",
        email="atendente@teste.com",
        senha_hash=get_password_hash("12345678"),
        tipo=TipoUsuario.ATENDENTE,
        cpf="111.111.111-11"
    )
    session.add(atendente)

    doador = Doador(
        id_doador=str(uuid.uuid4()),
        nome_completo="Doador Teste",
        cpf="222.222.222-22",
        idade=30,
        sexo="Masculino",
        tipo_sanguineo=TipoSanguineo.O_POSITIVO
    )
    session.add(doador)
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def admin_token(client):
    response = client.post("/api/auth/login", json={"email": "admin@teste.com", "password": "12345678"})
    assert response.status_code == 200
    return response.json()["access_token"]

@pytest.fixture(scope="function")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
