-- ============================================================
-- Banco de Sangue - Schema PostgreSQL (Supabase)
-- Executar no SQL Editor do Supabase
-- ============================================================

-- 1. ENUMS
CREATE TYPE "tiposanguineo" AS ENUM (
  'A_POSITIVO', 'A_NEGATIVO', 'B_POSITIVO', 'B_NEGATIVO',
  'AB_POSITIVO', 'AB_NEGATIVO', 'O_POSITIVO', 'O_NEGATIVO'
);

CREATE TYPE "tipousuario" AS ENUM (
  'ADMINISTRADOR', 'ATENDENTE'
);

CREATE TYPE "statusdoacao" AS ENUM (
  'EM_ESTOQUE', 'DESPACHADA', 'DESCARTADA'
);

-- 2. TABELAS

-- Unidades de Coleta
CREATE TABLE unidades_coleta (
  id_unidade    VARCHAR(36)    PRIMARY KEY,
  nome_fantasia VARCHAR(255)   NOT NULL,
  cnpj          VARCHAR(20)    UNIQUE,
  endereco      VARCHAR(255)   NOT NULL,
  email_unidade VARCHAR(255),
  criado_em     TIMESTAMPTZ    DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ    DEFAULT NOW()
);
CREATE INDEX ix_unidades_coleta_cnpj ON unidades_coleta (cnpj);

-- Doadores
CREATE TABLE doadores (
  id_doador      VARCHAR(36)    PRIMARY KEY,
  nome_completo  VARCHAR(255)   NOT NULL,
  cpf            VARCHAR(14)    NOT NULL UNIQUE,
  idade          INTEGER,
  sexo           VARCHAR(20),
  tipo_sanguineo "tiposanguineo",
  email          VARCHAR(255),
  telefone       VARCHAR(20),
  endereco       VARCHAR(255),
  criado_em      TIMESTAMPTZ    DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ    DEFAULT NOW()
);
CREATE INDEX ix_doadores_cpf ON doadores (cpf);

-- Usuarios
CREATE TABLE usuarios (
  id_usuario    VARCHAR(36)    PRIMARY KEY,
  nome_completo VARCHAR(255)   NOT NULL,
  email         VARCHAR(255)   NOT NULL UNIQUE,
  senha_hash    VARCHAR(255)   NOT NULL,
  cpf           VARCHAR(14)    UNIQUE,
  pis           VARCHAR(20)    UNIQUE,
  cargo         VARCHAR(100),
  telefone      VARCHAR(20),
  tipo          "tipousuario" NOT NULL,
  criado_em     TIMESTAMPTZ    DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ    DEFAULT NOW()
);
CREATE INDEX ix_usuarios_cpf   ON usuarios (cpf);
CREATE INDEX ix_usuarios_email ON usuarios (email);

-- Doacoes / Bolsas de Sangue
CREATE TABLE doacoes (
  id_doacao                  VARCHAR(36)    PRIMARY KEY,
  data_doacao               TIMESTAMPTZ    DEFAULT NOW(),
  volume_ml                 DOUBLE PRECISION NOT NULL,
  observacoes               TEXT,
  status                    "statusdoacao" NOT NULL DEFAULT 'EM_ESTOQUE',
  tipo_sanguineo_coletado  "tiposanguineo" NOT NULL,
  id_doador                 VARCHAR(36)    NOT NULL REFERENCES doadores(id_doador),
  id_registrador            VARCHAR(36)    NOT NULL REFERENCES usuarios(id_usuario),
  id_unidade                VARCHAR(36)    NOT NULL REFERENCES unidades_coleta(id_unidade),
  criado_em                 TIMESTAMPTZ    DEFAULT NOW(),
  atualizado_em             TIMESTAMPTZ    DEFAULT NOW()
);
CREATE INDEX ix_doacoes_id_unidade ON doacoes (id_unidade);

-- Tabela associativa N:M Usuarios x Unidades
CREATE TABLE usuarios_unidades (
  id_usuario VARCHAR(36) NOT NULL REFERENCES usuarios(id_usuario),
  id_unidade VARCHAR(36) NOT NULL REFERENCES unidades_coleta(id_unidade),
  ativo      BOOLEAN     DEFAULT TRUE,
  PRIMARY KEY (id_usuario, id_unidade)
);

-- Insumos / Materiais
CREATE TABLE insumos (
  id             SERIAL       PRIMARY KEY,
  nome           VARCHAR(255) NOT NULL,
  quantidade     INTEGER      NOT NULL DEFAULT 0,
  criado_em      TIMESTAMPTZ  DEFAULT NOW(),
  atualizado_em  TIMESTAMPTZ  DEFAULT NOW()
);

-- 3. TRIGGER para atualizar_atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com atualizado_em
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['unidades_coleta','doadores','usuarios','doacoes','insumos']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_atualizado ON %s;
       CREATE TRIGGER trg_%s_atualizado
         BEFORE UPDATE ON %s
         FOR EACH ROW EXECUTE FUNCTION atualizar_atualizado_em();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 4. DADOS SEED
-- ============================================================

-- Unidade padrao
INSERT INTO unidades_coleta (id_unidade, nome_fantasia, cnpj, endereco, email_unidade)
VALUES (
  'u0000000-0000-0000-0000-000000000001',
  'Hemocentro Central - Matriz',
  '12.345.678/0001-99',
  'Av. Paulista, 1000, Sao Paulo - SP',
  'contato@hemocentro.com.br'
) ON CONFLICT (cnpj) DO NOTHING;

-- Admin padrao (senha: 12345678)
INSERT INTO usuarios (id_usuario, nome_completo, email, senha_hash, tipo, cargo, cpf)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Administrador do Sistema',
  'admin@pulse.com',
  '$2b$12$K1MF61kgcfacFSwlBlJ/tedRbuBecLHi93xlRbldJOBkLW4Xc8l0C',
  'ADMINISTRADOR',
  'Diretor Tecnico',
  '111.111.111-11'
) ON CONFLICT (email) DO NOTHING;

-- Atendente padrao (senha: 12345678)
INSERT INTO usuarios (id_usuario, nome_completo, email, senha_hash, tipo, cargo, cpf)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Atendente Padrao',
  'atendente@pulse.com',
  '$2b$12$K1MF61kgcfacFSwlBlJ/tedRbuBecLHi93xlRbldJOBkLW4Xc8l0C',
  'ATENDENTE',
  'Recepcionista',
  '222.222.222-22'
) ON CONFLICT (email) DO NOTHING;

-- Doador generico (para entradas manuais de estoque)
INSERT INTO doadores (id_doador, nome_completo, cpf, idade, sexo, tipo_sanguineo, email, telefone, endereco)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'Doador Anonimo / Entrada Manual',
  '000.000.000-00',
  30,
  'Indefinido',
  'O_POSITIVO',
  'anonimo@pulse.com',
  '000000000',
  'Sistema Interno'
) ON CONFLICT (cpf) DO NOTHING;

-- Doadores de exemplo
INSERT INTO doadores (id_doador, nome_completo, cpf, idade, sexo, tipo_sanguineo, email, telefone, endereco) VALUES
  ('d0000000-0000-0000-0000-000000000002', 'Maria Oliveira Santos',     '111.444.777-35', 28, 'Feminino',  'A_POSITIVO',  'maria.oliveira@email.com',     '(11) 99988-1234', 'Rua das Flores, 100, Sao Paulo - SP'),
  ('d0000000-0000-0000-0000-000000000003', 'Joao Carlos Pereira',       '555.666.888-99', 35, 'Masculino', 'O_NEGATIVO',  'joao.pereira@email.com',       '(11) 99887-4321', 'Av. Brasil, 500, Campinas - SP'),
  ('d0000000-0000-0000-0000-000000000004', 'Ana Paula Ferreira',      '777.888.999-00', 42, 'Feminino',  'AB_POSITIVO', 'ana.ferreira@email.com',       '(21) 98765-4321', 'Rua Nova, 200, Rio de Janeiro - RJ'),
  ('d0000000-0000-0000-0000-000000000005', 'Carlos Eduardo Lima',     '333.222.111-44', 31, 'Masculino', 'B_POSITIVO',   'carlos.lima@email.com',        '(31) 99444-2211', 'Av. Afonso Pena, 1500, BH - MG'),
  ('d0000000-0000-0000-0000-000000000006', 'Fernanda Costa Souza',     '999.888.777-66', 25, 'Feminino',  'A_NEGATIVO',  'fernanda.souza@email.com',     '(41) 98877-6655', 'Rua XV de Novembro, 80, Curitiba - PR'),
  ('d0000000-0000-0000-0000-000000000007', 'Roberto Almeida Rocha',    '444.555.666-77', 48, 'Masculino', 'O_POSITIVO',   'roberto.rocha@email.com',     '(51) 97766-5544', 'Av. Ipiranga, 2000, Porto Alegre - RS'),
  ('d0000000-0000-0000-0000-000000000008', 'Juliana Martins Dias',    '222.333.444-88', 29, 'Feminino',  'B_NEGATIVO',  'juliana.dias@email.com',       '(19) 96655-4433', 'Rua das Acacias, 300, Piracicaba - SP'),
  ('d0000000-0000-0000-0000-000000000009', 'Paulo Roberto Nunes',     '666.777.888-99', 52, 'Masculino', 'AB_NEGATIVO', 'paulo.nunes@email.com',        '(62) 95544-3322', 'Av. T-63, 900, Goiania - GO'),
  ('d0000000-0000-0000-0000-000000000010', 'Luciana Vieira Campos',   '123.456.789-00', 38, 'Feminino',  'O_POSITIVO',   'luciana.campos@email.com',     '(48) 94433-2211', 'Rua das Palmeiras, 450, Florianopolis - SC')
ON CONFLICT (cpf) DO NOTHING;

-- Bolsas de sangue de exemplo (10 em estoque + 2 fora)
INSERT INTO doacoes (id_doacao, volume_ml, observacoes, status, tipo_sanguineo_coletado, id_doador, id_registrador, id_unidade, data_doacao) VALUES
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'A_POSITIVO',  'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '5 days'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'A_POSITIVO',  'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '4 days'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de urgencia',               'EM_ESTOQUE',  'A_POSITIVO',  'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'O_NEGATIVO', 'd0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'AB_POSITIVO', 'd0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'B_POSITIVO',  'd0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '6 days'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'A_NEGATIVO', 'd0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '7 days'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'O_POSITIVO',  'd0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'B_NEGATIVO', 'd0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 days'),
  (gen_random_uuid()::VARCHAR, 450, 'Coleta de rotina',                   'EM_ESTOQUE',  'O_POSITIVO',  'd0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '3 days'),
  -- Bolsas ja descartadas
  (gen_random_uuid()::VARCHAR, 450, 'Vencida - fora do prazo de validade', 'DESCARTADA', 'AB_NEGATIVO', 'd0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days'),
  -- Bolsas despachadas
  (gen_random_uuid()::VARCHAR, 450, 'Enviada para hospital regional',       'DESPACHADA',  'O_NEGATIVO', 'd0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days');

-- Insumos de exemplo
INSERT INTO insumos (nome, quantidade) VALUES
  ('Seringas descartaveis 5ml',          500),
  ('Agulhas hipodermicas 20G',            350),
  ('Tourniquets (garrote) de borracha',  200),
  ('Gazeesteril 10x10cm',               1000),
  ('Algodao hidrofilo',                  800),
  ('Alcool 70% (1L)',                   150),
  ('Luvas descartaveis (pares)',         2000),
  ('Kits de coleta de sangue',            300),
  ('Tubos de ensaio com EDTA',           600),
  ('Fitas microhematocrito',             400);
