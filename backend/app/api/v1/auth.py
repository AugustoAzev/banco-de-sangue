from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import all_models
from backend.app.schemas import all_schemas
from backend.app.core.security import verify_password, create_access_token

router = APIRouter()

@router.post("/login", response_model=all_schemas.Token)
def login(form_data: all_schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. tenta achar como Admin (User)
    user = db.query(all_models.User).filter(all_models.User.email == form_data.email).first()
    role = "admin"
    db_obj = user

    # 2. se não achar, tenta como Funcionario
    if not user:
        user = db.query(all_models.Funcionario).filter(all_models.Funcionario.email == form_data.email).first()
        role = "funcionario"
        db_obj = user

    # 3. se não achou ninguém ou senha errada
    if not db_obj or not verify_password(form_data.password, db_obj.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
        )

    access_token = create_access_token(data={"sub": db_obj.email, "role": role})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "role": role,
        "name": db_obj.name
    }