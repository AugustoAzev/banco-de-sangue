from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models import all_models
from backend.app.schemas import all_schemas
from backend.app.api.deps import get_current_user

router = APIRouter()

@router.post("/", response_model=all_schemas.DoadorResponse)
def create_donor(
    donor: all_schemas.DoadorCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_donor = all_models.Doador(**donor.dict())
    db.add(db_donor)
    db.commit()
    db.refresh(db_donor)
    return db_donor

@router.get("/", response_model=List[all_schemas.DoadorResponse])
def read_donors(
    query: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Lógica legado: busca por nome (LIKE) OU tipo sanguíneo
    if query:
        return db.query(all_models.Doador).filter(
            (all_models.Doador.name.like(f"%{query}%")) | 
            (all_models.Doador.tipo_sangue == query)
        ).all()
    return db.query(all_models.Doador).all()