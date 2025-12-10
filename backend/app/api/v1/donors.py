from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.core.database import get_db
from backend.app.models import all_models
from backend.app.schemas import all_schemas
from backend.app.api.deps import get_current_user

router = APIRouter()

# --- CRIAR (POST) ---
@router.post("/", response_model=all_schemas.DoadorResponse)
def create_donor(
    donor: all_schemas.DoadorCreate, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Verifica CPF
    if db.query(all_models.Doador).filter(all_models.Doador.cpf == donor.cpf).first():
        raise HTTPException(status_code=400, detail="CPF já cadastrado.")

    db_donor = all_models.Doador(
        # CORREÇÃO: Usar .nome em vez de .name
        nome_completo=donor.nome,
        # CORREÇÃO: Removemos documento pois não existe no model -> merda do caralho estava 2 horas twntando arrumar essa porra
        cpf=donor.cpf,
        idade=donor.idade,
        sexo=donor.sexo,
        tipo_sanguineo=donor.tipo_sanguineo,
        email=donor.email,
        telefone=donor.telefone,
        endereco=donor.endereco
    )
    
    try:
        db.add(db_donor)
        db.commit()
        db.refresh(db_donor)
        return db_donor
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=422, detail=str(e))

# --- LISTAR (GET) ---
@router.get("/", response_model=List[all_schemas.DoadorResponse])
def read_donors(
    query: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    q = db.query(all_models.Doador)
    if query:
        q = q.filter(
            (all_models.Doador.nome_completo.like(f"%{query}%")) | 
            (all_models.Doador.cpf.like(f"%{query}%"))
        )
    return q.all()

# --- ATUALIZAR (PUT) ---
@router.put("/{id_doador}", response_model=all_schemas.DoadorResponse)
def update_donor(
    id_doador: str,
    donor: all_schemas.DoadorCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_donor = db.query(all_models.Doador).filter(all_models.Doador.id_doador == id_doador).first()
    if not db_donor:
        raise HTTPException(status_code=404, detail="Doador não encontrado")

    # CORREÇÃO: Usar .nome em vez de .name
    db_donor.nome_completo = donor.nome
    # O campo documento não existe no model, então removemos a linha -> caralhoooooooooooooo
    db_donor.idade = donor.idade
    db_donor.sexo = donor.sexo
    db_donor.tipo_sanguineo = donor.tipo_sanguineo
    db_donor.email = donor.email
    db_donor.telefone = donor.telefone
    db_donor.endereco = donor.endereco
    
    try:
        db.commit()
        db.refresh(db_donor)
        return db_donor
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erro ao atualizar dados.")

# --- DELETAR (DELETE) ---
@router.delete("/{id_doador}")
def delete_donor(
    id_doador: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_donor = db.query(all_models.Doador).filter(all_models.Doador.id_doador == id_doador).first()
    if not db_donor:
        raise HTTPException(status_code=404, detail="Doador não encontrado")

    try:
        db.delete(db_donor)
        db.commit()
        return {"message": "Doador removido com sucesso"}
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=400, 
            detail="Não é possível excluir este doador pois existem doações vinculadas a ele."
        )