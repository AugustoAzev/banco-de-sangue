# 🩸 Pulse — Sistema de Gestão de Hemocentro

O **Pulse** é um sistema completo para gerenciamento de hemocentros e bancos de sangue, permitindo controle total do ciclo do sangue: cadastro de doadores, triagens, registro de doações, controle de bolsas e insumos, além de dashboards administrativos com métricas em tempo real.

---

## 📘 Sobre o Projeto

O objetivo do Pulse é modernizar e centralizar operações essenciais de um hemocentro com:

- Cadastro e gestão de doadores  
- Triagem e registro clínico  
- Gestão de estoque (bolsas, insumos, vencimentos)  
- Painéis com indicadores em tempo real  
- API moderna com FastAPI  
- Interface rápida e responsiva construída em React + Vite  

---

## 🛠 Tecnologias Utilizadas

### **Backend**
- Python 3.10+
- FastAPI
- SQLAlchemy
- Alembic
- JWT + Passlib
- Pydantic

### **Frontend**
- React 18
- TypeScript
- Vite
- CSS Modules
- Axios
- React Router DOM
- Lucide Icons

### **Infraestrutura / Testes**
- MySQL ou MariaDB
- Conda / Pip
- Playwright

---

## 📋 Pré-requisitos

Instale antes de começar:

- Python 3.10 ou superior  
- Node.js 18 ou superior  
- MySQL ou MariaDB  
- Git  

---

# 🚀 Instalação e Configuração

## 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/banco-de-sangue.git
cd banco-de-sangue
```

---

## 2. Backend

### Criar ambiente virtual (Conda recomendado)

```bash
conda env create -f backend/environment.yml
conda activate banco-sangue-env
```

### Ou usando Venv

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Linux/Mac
venv\Scripts\activate         # Windows

pip install -r requirements.txt
```

---

### Variáveis de Ambiente

Crie o arquivo:

```
backend/.env
```

Insira:

```env
DB_USER=root
DB_PASSWORD=sua_senha_do_banco
DB_HOST=localhost
DB_DATABASE=banco_sangue
SECRET_KEY=sua_chave_secreta_segura_aqui
```

---

## 3. Criar o Banco de Dados

```sql
CREATE DATABASE banco_sangue;
```

Aplicar migrações:

```bash
alembic upgrade head
```

---

## 4. Popular o Banco (Seed)

```bash
python seed_data.py
```

Credenciais criadas:

- Email: `admin@pulse.com`  
- Senha: `12345678`

---

## 5. Instalar dependências do Frontend

```bash
npm install
```

---

# ▶️ Executando a Aplicação

## Terminal 1 — Backend

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Acesse:

- API → http://127.0.0.1:8000  
- Swagger → http://127.0.0.1:8000/docs  

---

## Terminal 2 — Frontend

```bash
npm run dev
```

Acesse:

- Frontend → http://localhost:5173  

---

# 🧪 Testes com Playwright

Rodar testes:

```bash
npx playwright test
```

Visualizar relatório:

```bash
npx playwright show-report
```

---

# 📂 Estrutura do Projeto

```plaintext
banco-de-sangue/
├── alembic/                # Scripts de migração
├── backend/
│   ├── app/
│   │   ├── api/            # Rotas da API (v1)
│   │   ├── core/           # Configuração global (DB, segurança)
│   │   ├── models/         # Modelos SQLAlchemy
│   │   └── schemas/        # Schemas Pydantic
│   └── environment.yml
├── src/                    # Frontend (React)
│   ├── components/
│   ├── contexts/
│   ├── pages/
│   └── services/
├── seed_data.py
├── vite.config.ts
└── README.md
```

---

# 📄 Licença

Este projeto é distribuído sob a licença **MIT**.

---

Feito com ❤️ para estudos e inovação em gestão de hemocentros.
