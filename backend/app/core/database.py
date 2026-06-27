from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

# Database type: 'mysql' or 'postgresql'
DB_TYPE = os.getenv("DB_TYPE", "mysql")

# .envs variaveis de ambiente
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306" if DB_TYPE == "mysql" else "5432")
DB_NAME = os.getenv("DB_DATABASE", "banco_sangue")

if DB_TYPE == "postgresql":
    SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# funções de interação com o banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()