from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import uuid
from backend.app.core.database import get_db
from backend.app.models import all_models
from backend.app.schemas import all_schemas
from backend.app.api.deps import get_current_user

router = APIRouter()

# ===========================
#  BOLSAS DE SANGUE (DOACOES)
# ===========================

@router.get("/bolsas")
def get_bolsas(
    tipo_sangue: Optional[str] = None, 
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    # Retorna doações que estão EM_ESTOQUE
    query = db.query(all_models.Doacao).filter(
        all_models.Doacao.status == all_models.StatusDoacao.EM_ESTOQUE
    )
    if tipo_sangue:
        query = query.filter(all_models.Doacao.tipo_sanguineo_coletado == tipo_sangue)
    
    resultados = query.all()
    
    # Formata resposta simplificada para a tabela de estoque
    return [
        {
            "id": item.id_doacao, 
            "tipo_sangue": item.tipo_sanguineo_coletado,
            "quantidade": int(item.volume_ml), 
            "created_at": item.data_doacao
        }
        for item in resultados
    ]

@router.post("/bolsas")
def add_bolsa(
    bolsa: all_schemas.BolsaCreate, 
    db: Session = Depends(get_db), 
    user_token: dict = Depends(get_current_user)
):
    """
    Registra entrada manual de bolsas no estoque.
    Automaticamente vincula ao usuário logado e ao primeiro doador/unidade encontrados.
    """
    # 1. Identificar Usuário Registrador
    usuario_db = db.query(all_models.Usuario).filter(all_models.Usuario.email == user_token["email"]).first()
    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuário logado não encontrado.")

    # 2. Identificar Unidade de Coleta (Pega a primeira do sistema)
    unidade = db.query(all_models.UnidadeColeta).first()
    if not unidade:
        raise HTTPException(status_code=400, detail="Nenhuma Unidade de Coleta cadastrada. Rode o script seed_data.py.")

    # 3. Identificar um Doador para vínculo (Pega o primeiro do sistema - Geralmente o Genérico)
    doador = db.query(all_models.Doador).first()
    if not doador:
        raise HTTPException(status_code=400, detail="Cadastre ao menos um doador antes de lançar estoque.")

    # 4. Criar as doações (Loop pela quantidade informada)
    # Se o usuário informou quantidade 5, criamos 5 registros de doação de 450ml -> revisar essa regra aqui fiz da minha cabeça foda-se
    try:
        for _ in range(bolsa.quantidade):
            nova_doacao = all_models.Doacao(
                id_doacao=str(uuid.uuid4()),
                volume_ml=450.0, # Volume padrão de uma bolsa
                observacoes="Entrada Manual via Estoque",
                status=all_models.StatusDoacao.EM_ESTOQUE,
                tipo_sanguineo_coletado=bolsa.tipo_sangue,
                id_doador=doador.id_doador,
                id_registrador=usuario_db.id_usuario,
                id_unidade=unidade.id_unidade
            )
            db.add(nova_doacao)
        
        db.commit()
        return {"message": f"{bolsa.quantidade} bolsas registradas com sucesso"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao registrar estoque: {str(e)}")

@router.delete("/bolsas/{id_doacao}")
def delete_bolsa(
    id_doacao: str, 
    db: Session = Depends(get_db), 
    user: dict = Depends(get_current_user)
):
    # Busca a doação/bolsa
    db_bolsa = db.query(all_models.Doacao).filter(all_models.Doacao.id_doacao == id_doacao).first()
    if not db_bolsa:
        raise HTTPException(status_code=404, detail="Bolsa não encontrada")
    
    try:
        db.delete(db_bolsa)
        db.commit()
        return {"message": "Registro removido com sucesso"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao remover bolsa: {str(e)}")


# ===========================
#  INSUMOS
# ===========================

@router.get("/insumos", response_model=List[all_schemas.InsumoResponse])
def get_insumos(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    if not hasattr(all_models, 'Insumo'):
        return []
    return db.query(all_models.Insumo).all()

@router.post("/insumos", response_model=all_schemas.InsumoResponse)
def add_insumo(insumo: all_schemas.InsumoCreate, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    if not hasattr(all_models, 'Insumo'):
         raise HTTPException(status_code=500, detail="Tabela de Insumos não existe no banco.")
         
    db_insumo = all_models.Insumo(
        nome=insumo.nome,
        quantidade=insumo.quantidade
    )
    db.add(db_insumo)
    db.commit()
    db.refresh(db_insumo)
    return db_insumo

@router.put("/insumos/{id_insumo}", response_model=all_schemas.InsumoResponse)
def update_insumo(
    id_insumo: int, 
    insumo: all_schemas.InsumoCreate, 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if not hasattr(all_models, 'Insumo'):
         raise HTTPException(status_code=500, detail="Tabela Insumos inexistente")

    db_item = db.query(all_models.Insumo).filter(all_models.Insumo.id == id_insumo).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
    
    db_item.nome = insumo.nome
    db_item.quantidade = insumo.quantidade
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/insumos/{id_insumo}")
def delete_insumo(
    id_insumo: int, 
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if not hasattr(all_models, 'Insumo'):
         raise HTTPException(status_code=500, detail="Tabela Insumos inexistente")

    db_item = db.query(all_models.Insumo).filter(all_models.Insumo.id == id_insumo).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
        
    db.delete(db_item)
    db.commit()
    return {"message": "Insumo removido"}