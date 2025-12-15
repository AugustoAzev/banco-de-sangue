import sys
import os
from sqlalchemy.orm import Session
import uuid

# Garante que o Python encontre a pasta backend
sys.path.append(os.getcwd())

from backend.app.core.database import SessionLocal
from backend.app.models.all_models import Usuario, TipoUsuario, UnidadeColeta, Doador, TipoSanguineo
from backend.app.core.security import get_password_hash

def seed_database():
    db: Session = SessionLocal()
    try:
        print("💉 Iniciando população do Banco de Sangue...")
        
        # 1. Criar Unidade de Coleta (Essencial para o Estoque funcionar)
        unidade = db.query(UnidadeColeta).first()
        if not unidade:
            print("🏥 Criando Unidade de Coleta Padrão...")
            unidade = UnidadeColeta(
                id_unidade=str(uuid.uuid4()),
                nome_fantasia="Hemocentro Central - Matriz",
                cnpj="12.345.678/0001-99",
                endereco="Av. Paulista, 1000, São Paulo - SP",
                email_unidade="contato@hemocentro.com.br"
            )
            db.add(unidade)
            db.commit()
            db.refresh(unidade)
        else:
            print(f"✅ Unidade já existente: {unidade.nome_fantasia}")

        # 2. Criar Usuário Admin (Se não existir)
        user = db.query(Usuario).filter(Usuario.email == "admin@pulse.com").first()
        if not user:
            print("👤 Criando Usuário Admin...")
            user = Usuario(
                id_usuario=str(uuid.uuid4()),
                nome_completo="Administrador do Sistema",
                email="admin@pulse.com",
                senha_hash=get_password_hash("12345678"),
                tipo=TipoUsuario.ADMINISTRADOR,
                cargo="Diretor Técnico",
                cpf="111.111.111-11"
            )
            db.add(user)
            db.commit()
        else:
            print("✅ Usuário Admin já existe.")

        # 3. Criar um Doador Genérico (Essencial para entrada manual de estoque)
        doador = db.query(Doador).filter(Doador.cpf == "000.000.000-00").first()
        if not doador:
            print("🩸 Criando Doador Genérico para Entradas Manuais...")
            doador = Doador(
                id_doador=str(uuid.uuid4()),
                nome_completo="Doador Anônimo / Entrada Manual",
                cpf="000.000.000-00",
                idade=30,
                sexo="Indefinido",
                tipo_sanguineo=TipoSanguineo.O_POSITIVO,
                email="anonimo@pulse.com",
                telefone="000000000",
                endereco="Sistema Interno"
            )
            db.add(doador)
            db.commit()
        else:
            print("✅ Doador Genérico já existe.")

        print("\n✨ Banco de dados populado com sucesso! Agora o estoque funcionará.")

    except Exception as e:
        print(f"❌ Erro ao popular banco: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()