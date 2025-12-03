# Banco de Dados - Instruções de Configuração

## Pré-requisitos
1. Ter MySQL rodando (Docker ou Local).
2. Criar arquivo `.env` na raiz (copiar exemplo abaixo).

## Configuração do .env
DATABASE_URL="mysql://root:SUA_SENHA@localhost:3306/banco_de_sangue"

## Como Iniciar o Banco (Primeira vez ou Reset)
Para criar as tabelas e popular com dados de teste (Seed):

```bash
npx prisma migrate reset