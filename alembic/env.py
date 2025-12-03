import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# --- [CORREÇÃO 1] Adicionar raiz do projeto ao PATH ---
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# --- [CORREÇÃO 2] Importar seus Models e Configurações ---
from backend.app.core.database import Base, SQLALCHEMY_DATABASE_URL
from backend.app.models import all_models 

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- [CORREÇÃO 3] Definir o Metadata (Resolve o seu erro principal) ---
target_metadata = Base.metadata

# --- [CORREÇÃO 4] Forçar uso da URL do .env (MySQL) em vez do alembic.ini ---
config.set_main_option("sqlalchemy.url", SQLALCHEMY_DATABASE_URL)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    
    # Cria a engine usando a configuração injetada do .env
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
    