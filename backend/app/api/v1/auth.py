from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import all_models
from backend.app.schemas import all_schemas
from backend.app.core.security import verify_password, create_access_token

router = APIRouter()

@router.post("/login", response_model=all_schemas.Token)
def login(form_data: all_schemas.LoginRequest, db: Session = Depends(get_db)):
    # Busca na tabela única de Usuários
    user = db.query(all_models.Usuario).filter(all_models.Usuario.email == form_data.email).first()

    # Verifica se o usuário existe e se a senha bate
    # Nota: No novo model, a senha é 'senha_hash', não 'password'
    if not user or not verify_password(form_data.password, user.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )

    # O campo 'tipo' é um Enum, pegamos o .value para a string "ADMINISTRADOR" ou "ATENDENTE"
    role = user.tipo.value if hasattr(user.tipo, 'value') else user.tipo

    access_token = create_access_token(data={"sub": user.email, "role": role})
    
    # Mapeia os campos do banco (nome_completo) para o schema de resposta (name)
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": role,
        "name": user.nome_completo
    }