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
    if db.query(all_models.Funcionario).filter(all_models.Funcionario.cpf == emp.cpf).first():
        raise HTTPException(status_code=400, detail="CPF já cadastrado")
    
    # Hash da senha
    emp_data = emp.dict()
    emp_data['password'] = get_password_hash(emp_data['password'])
    
    db_emp = all_models.Funcionario(**emp_data)
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp

@router.get("/", response_model=List[all_schemas.FuncionarioResponse])
def get_employees(query: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    q = db.query(all_models.Funcionario)
    if query:
        q = q.filter(
            (all_models.Funcionario.name.like(f"%{query}%")) | 
            (all_models.Funcionario.cargo.like(f"%{query}%"))
        )
    return q.all()