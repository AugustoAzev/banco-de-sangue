# 🩸 Pulse — Sistema de Gestão de Hemocentro

O **Pulse** é um sistema completo para gestão de hemocentros e bancos de sangue.  
Ele integra cadastro de doadores, triagem, controle de estoque, administração de insumos, relatórios e dashboards analíticos.

Este projeto utiliza:

- **Backend:** FastAPI + SQLAlchemy + Alembic  
- **Frontend:** React + TypeScript + Vite  
- **Ambiente Python:** `environment.yml` (Conda)  
- **Migrações:** Alembic (Python) e Prisma (Service Layer)

---

## 🛠 Tecnologias Utilizadas

### **Backend**
- Python 3.10+
- FastAPI
- SQLAlchemy
- Alembic
- JWT + Passlib
- Pydantic
- Conda (`environment.yml`)

### **Frontend**
- React 18
- TypeScript
- Vite
- CSS Modules / CSS Nativo
- Axios
- React Router DOM
- Lucide Icons

### **Infraestrutura / Testes**
- MySQL/MariaDB
- Prisma
- Playwright
- Git

---

# 📋 Pré-requisitos

Instale:

- Python 3.10+
- Conda
- Node.js 18+
- MySQL ou MariaDB
- Git

---

# 🚀 Instalação & Configuração

## 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/banco-de-sangue.git
cd banco-de-sangue
```

---

## 2. Configurar o Backend (Conda)

```bash
cd backend
conda env create -f environment.yml
conda activate banco-sangue-env
```

---

## 3. Variáveis de Ambiente

Criar `backend/.env`:

```env
DB_USER=root
DB_PASSWORD=sua_senha
DB_HOST=localhost
DB_DATABASE=banco_sangue
SECRET_KEY=sua_chave_secreta
```

---

## 4. Banco de Dados

Criar banco:

```sql
CREATE DATABASE banco_sangue;
```

Rodar migrações Alembic:

```bash
alembic upgrade head
```

Se usar Prisma:

```bash
npx prisma migrate deploy
```

---

## 5. Popular dados iniciais (seed)

```bash
python seed_data.py
python seed_user.py
```

Usuário inicial:
- Email: admin@pulse.com  
- Senha: 12345678

---

## 6. Instalar o Frontend

```bash
npm install
```

---

# ▶️ Executar o Projeto

## Backend

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Acessos:
- API: http://127.0.0.1:8000  
- Swagger: http://127.0.0.1:8000/docs  

---

## Frontend

```bash
npm run dev
```

Acessar:  
http://localhost:5173

---

# 🧪 Testes Automatizados (Playwright)

Rodar testes:

```bash
npx playwright test
```

Relatório:

```bash
npx playwright show-report
```

---

# 📂 Estrutura Completa do Projeto

```plaintext
banco-de-sangue/
├── alembic
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
├── alembic.ini
├── backend
│   ├── app
│   │   ├── api (auth, donors, employees, inventory)
│   │   ├── core
│   │   ├── models
│   │   ├── schemas
│   │   └── main.py
│   └── environment.yml
├── prisma
│   ├── schema.prisma
│   └── migrations/
├── public
├── src (Frontend React)
│   ├── components
│   ├── contexts
│   ├── pages
│   ├── services
│   └── main.tsx
├── tests (Playwright)
├── seed_data.py
├── seed_user.py
├── package.json
└── vite.config.ts
```

---

# 📄 Licença

Distribuído sob licença **MIT**.
