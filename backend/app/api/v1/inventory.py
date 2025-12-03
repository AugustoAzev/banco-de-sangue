from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models import all_models
from backend.app.schemas import all_schemas
from backend.app.api.deps import get_current_user

router = APIRouter()

# --- Bolsas ---
@router.post("/bolsas", response_model=all_schemas.BolsaResponse)
def add_bolsa(bolsa: all_schemas.BolsaCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    db_bolsa = all_models.BolsaSangue(**bolsa.dict())
    db.add(db_bolsa)
    db.commit()
    db.refresh(db_bolsa)
    return db_bolsa

@router.get("/bolsas", response_model=List[all_schemas.BolsaResponse])
def get_bolsas(tipo_sangue: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    q = db.query(all_models.BolsaSangue)
    if tipo_sangue:
        q = q.filter(all_models.BolsaSangue.tipo_sangue == tipo_sangue)
    return q.all()

# --- Insumos ---
@router.post("/insumos", response_model=all_schemas.InsumoResponse)
def add_insumo(insumo: all_schemas.InsumoCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    db_insumo = all_models.Insumo(**insumo.dict())
    db.add(db_insumo)
    db.commit()
    db.refresh(db_insumo)
    return db_insumo

@router.get("/insumos", response_model=List[all_schemas.InsumoResponse])
def get_insumos(nome: Optional[str] = None, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    q = db.query(all_models.Insumo)
    if nome:
        q = q.filter(all_models.Insumo.nome.like(f"%{nome}%"))
    return q.all()