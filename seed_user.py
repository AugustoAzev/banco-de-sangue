import sys
import os
from sqlalchemy.orm import Session

# Garante que o Python encontre a pasta backend
sys.path.append(os.getcwd())

from backend.app.core.database import SessionLocal
from backend.app.models.all_models import Usuario, TipoUsuario
from backend.app.core.security import get_password_hash

def create_user():
    db: Session = SessionLocal()
    try:
        print("🔌 Conectando ao banco de dados...")
        
        email = "teste@gmail.com"
        senha_raw = "12345678"
        
        # Verifica se já existe
        user_existente = db.query(Usuario).filter(Usuario.email == email).first()
        if user_existente:
            print(f"⚠️  O usuário {email} já existe no banco.")
            return

        print(f"🔑 Gerando hash para a senha...")
        
        novo_usuario = Usuario(
            nome_completo="Usuário de Teste",
            email=email,
            senha_hash=get_password_hash(senha_raw), # Hash seguro
            tipo=TipoUsuario.ADMINISTRADOR,
            cargo="Tester",
            cpf="000.000.000-00" # CPF Fictício para passar na constraint unique
        )

        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        
        print("-" * 30)
        print("✅ Usuário criado com sucesso!")
        print(f"👤 Nome: {novo_usuario.nome_completo}")
        print(f"📧 Email: {novo_usuario.email}")
        print(f"🔑 Senha: {senha_raw}")
        print(f"🆔 ID: {novo_usuario.id_usuario}")
        print("-" * 30)

    except Exception as e:
        print(f"❌ Erro ao criar usuário: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_user()