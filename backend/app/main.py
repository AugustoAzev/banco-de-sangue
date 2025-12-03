from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

from backend.app.api.v1 import auth, donors, inventory, employees
from backend.app.core.database import engine, Base

# Cria as tabelas se não existirem (apenas para dev, em prod use Alembic seu beta)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Banco de Sangue API",
    version="2.0.0"
)

# CORS
origins = ["http://localhost:5173", "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# inclusão das Rotas
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(donors.router, prefix="/api/donors", tags=["Doadores"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Estoque"])
app.include_router(employees.router, prefix="/api/employees", tags=["Funcionários"])

@app.get("/api/health")
def health():
    return {"status": "ok"}

# servir Frontend
path_to_frontend = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dist")
if os.path.exists(path_to_frontend):
    app.mount("/", StaticFiles(directory=path_to_frontend, html=True), name="static")