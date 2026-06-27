from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models import all_models
from backend.app.schemas import all_schemas
from backend.app.core.security import get_password_hash
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=all_schemas.FuncionarioResponse)
def create_employee(
    emp: all_schemas.FuncionarioCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user) # Apenas admin deveria criar? Adicionar check aqui se desejar
):
    # Verifica CPF duplicado
    if db.query(all_models.Usuario).filter(all_models.Usuario.cpf == emp.cpf).first():
        raise HTTPException(status_code=400, detail="CPF já cadastrado")

    # Hash da senha e mapeia campos do schema para o modelo
    db_emp = all_models.Usuario(
        nome_completo=emp.name,
        email=emp.email,
        senha_hash=get_password_hash(emp.password),
        cpf=emp.cpf,
        pis=emp.pis,
        cargo=emp.cargo,
        telefone=emp.telefone,
        tipo=all_models.TipoUsuario.FUNCIONARIO
    )
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@router.get("/", response_model=List[all_schemas.FuncionarioResponse])
def get_employees(query: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    q = db.query(all_models.Usuario)
    if query:
        q = q.filter(
            (all_models.Usuario.nome_completo.like(f"%{query}%")) |
            (all_models.Usuario.cargo.like(f"%{query}%"))
        )
    return q.all()