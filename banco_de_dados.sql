-- ============================================================
--  PsicoManager — Script de Criação do Banco — PostgreSQL
--  Execute no Supabase: Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── USUÁRIOS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(150)  NOT NULL,
  email      VARCHAR(200)  NOT NULL UNIQUE,
  senha_hash VARCHAR(255)  NOT NULL,
  perfil     VARCHAR(20)   NOT NULL DEFAULT 'paciente'
               CHECK (perfil IN ('psicologo','administrador','paciente')),
  crp        VARCHAR(20)   DEFAULT NULL,
  ativo      BOOLEAN       NOT NULL DEFAULT TRUE,
  criado_em  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─── SALAS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salas (
  id         SERIAL PRIMARY KEY,
  nome       VARCHAR(60)   NOT NULL,
  capacidade INT           NOT NULL DEFAULT 2,
  descricao  VARCHAR(200)  DEFAULT NULL,
  ativa      BOOLEAN       NOT NULL DEFAULT TRUE
);

-- ─── PACIENTES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pacientes (
  id                  SERIAL PRIMARY KEY,
  usuario_id          INT           NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cpf                 VARCHAR(14)   DEFAULT NULL,
  data_nascimento     DATE          DEFAULT NULL,
  telefone            VARCHAR(20)   DEFAULT NULL,
  endereco            TEXT          DEFAULT NULL,
  contato_emergencia  VARCHAR(200)  DEFAULT NULL,
  profissao           VARCHAR(100)  DEFAULT NULL,
  psicologo_id        INT           DEFAULT NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  plano               VARCHAR(30)   NOT NULL DEFAULT 'particular_mensal'
                        CHECK (plano IN ('particular_mensal','pacote_5','pacote_10','convenio')),
  saldo_sessoes       INT           DEFAULT NULL,
  criado_em           TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ─── SESSÕES ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessoes (
  id                SERIAL PRIMARY KEY,
  paciente_id       INT         NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  psicologo_id      INT         NOT NULL REFERENCES usuarios(id)  ON DELETE RESTRICT,
  sala_id           INT         DEFAULT NULL REFERENCES salas(id) ON DELETE SET NULL,
  data_hora_inicio  TIMESTAMP   NOT NULL,
  data_hora_fim     TIMESTAMP   NOT NULL,
  modalidade        VARCHAR(20) NOT NULL DEFAULT 'presencial'
                      CHECK (modalidade IN ('presencial','online','grupo')),
  status            VARCHAR(20) NOT NULL DEFAULT 'agendada'
                      CHECK (status IN ('agendada','confirmada','cancelada','realizada')),
  observacoes       TEXT        DEFAULT NULL,
  lembrete_enviado  BOOLEAN     NOT NULL DEFAULT FALSE,
  criado_em         TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── PRONTUÁRIOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prontuarios (
  id                   SERIAL PRIMARY KEY,
  paciente_id          INT  NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
  queixa_principal     TEXT DEFAULT NULL,
  historico_familiar   TEXT DEFAULT NULL,
  historico_clinico    TEXT DEFAULT NULL,
  medicamentos         TEXT DEFAULT NULL,
  hipotese_diagnostica VARCHAR(200) DEFAULT NULL,
  criado_em            TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── EVOLUÇÕES DE SESSÃO ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS evolucoes (
  id                   SERIAL PRIMARY KEY,
  sessao_id            INT  NOT NULL REFERENCES sessoes(id)     ON DELETE CASCADE,
  prontuario_id        INT  NOT NULL REFERENCES prontuarios(id) ON DELETE CASCADE,
  observacoes_clinicas TEXT NOT NULL,
  status_preenchimento VARCHAR(20) NOT NULL DEFAULT 'completo'
                         CHECK (status_preenchimento IN ('completo','pendente','incompleto')),
  psicologo_id         INT  NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  criado_em            TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── PAGAMENTOS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagamentos (
  id               SERIAL PRIMARY KEY,
  sessao_id        INT             NOT NULL REFERENCES sessoes(id)   ON DELETE RESTRICT,
  paciente_id      INT             NOT NULL REFERENCES pacientes(id) ON DELETE RESTRICT,
  valor            NUMERIC(10,2)   NOT NULL,
  forma_pagamento  VARCHAR(30)     NOT NULL
                     CHECK (forma_pagamento IN ('pix','cartao_debito','cartao_credito','transferencia','dinheiro','convenio')),
  status           VARCHAR(20)     NOT NULL DEFAULT 'pendente'
                     CHECK (status IN ('pendente','pago','cancelado','estornado')),
  data_pagamento   DATE            DEFAULT NULL,
  observacoes      TEXT            DEFAULT NULL,
  criado_em        TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- ─── TAREFAS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tarefas (
  id             SERIAL PRIMARY KEY,
  descricao      TEXT        NOT NULL,
  paciente_id    INT         DEFAULT NULL REFERENCES pacientes(id)  ON DELETE SET NULL,
  responsavel_id INT         NOT NULL     REFERENCES usuarios(id)   ON DELETE RESTRICT,
  prazo          DATE        DEFAULT NULL,
  concluida      BOOLEAN     NOT NULL DEFAULT FALSE,
  criado_em      TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- ─── DADOS INICIAIS ──────────────────────────────────────────
-- Senha de todos os usuários: "password"
INSERT INTO usuarios (nome, email, senha_hash, perfil, crp) VALUES
  ('Dra. Ana Lima',        'ana@clinica.com',    '$2b$10$siBe1bQaY2ovKDoIJS791.JRYPvt698HRFZEVzawoAjm2utPb3K1y', 'psicologo',     '03/1234'),
  ('Dr. Carlos Mendes',    'carlos@clinica.com', '$2b$10$siBe1bQaY2ovKDoIJS791.JRYPvt698HRFZEVzawoAjm2utPb3K1y', 'psicologo',     '03/5678'),
  ('Admin Clínica',        'admin@clinica.com',  '$2b$10$siBe1bQaY2ovKDoIJS791.JRYPvt698HRFZEVzawoAjm2utPb3K1y', 'administrador', NULL),
  ('Maria Fernanda Costa', 'maria@email.com',    '$2b$10$siBe1bQaY2ovKDoIJS791.JRYPvt698HRFZEVzawoAjm2utPb3K1y', 'paciente',      NULL),
  ('João Pedro Alves',     'joao@email.com',     '$2b$10$siBe1bQaY2ovKDoIJS791.JRYPvt698HRFZEVzawoAjm2utPb3K1y', 'paciente',      NULL),
  ('Carla Mendes',         'carla@email.com',    '$2b$10$siBe1bQaY2ovKDoIJS791.JRYPvt698HRFZEVzawoAjm2utPb3K1y', 'paciente',      NULL),
  ('Roberto Silva',        'roberto@email.com',  '$2b$10$siBe1bQaY2ovKDoIJS791.JRYPvt698HRFZEVzawoAjm2utPb3K1y', 'paciente',      NULL);

INSERT INTO salas (nome, capacidade, descricao) VALUES
  ('Sala 01',      2, 'Ar-condicionado, TV'),
  ('Sala 02',      6, 'Quadro branco, projetor'),
  ('Sala Virtual', 2, 'Google Meet — link gerado automaticamente');

INSERT INTO pacientes (usuario_id, cpf, data_nascimento, telefone, endereco, psicologo_id, plano, saldo_sessoes) VALUES
  (4, '123.456.789-00', '1992-08-14', '(71) 99123-4567', 'Rua das Palmeiras, 342, Pituba, Salvador-BA',    1, 'pacote_10',        2),
  (5, '987.654.321-00', '1988-03-22', '(71) 99876-5432', 'Av. Tancredo Neves, 1000, Salvador-BA',          1, 'particular_mensal', NULL),
  (6, '111.222.333-44', '1995-11-05', '(71) 98765-4321', 'Rua da Paz, 50, Barra, Salvador-BA',             2, 'convenio',          NULL),
  (7, '555.666.777-88', '1980-07-30', '(71) 97654-3210', 'Av. ACM, 200, Iguatemi, Salvador-BA',            1, 'particular_mensal', NULL);

INSERT INTO prontuarios (paciente_id, queixa_principal, historico_familiar, hipotese_diagnostica) VALUES
  (1, 'Ansiedade generalizada, dificuldades no trabalho e insônia recorrente.',
     'Mãe com histórico de depressão. Pai ausente desde a infância.',
     'F41.1 — Transtorno de ansiedade generalizada'),
  (2, 'Dificuldades de relacionamento interpessoal e baixa autoestima.',
     'Família estruturada, sem histórico psiquiátrico relevante.',
     'F60.6 — Transtorno ansioso da personalidade');

INSERT INTO sessoes (paciente_id, psicologo_id, sala_id, data_hora_inicio, data_hora_fim, modalidade, status) VALUES
  (1, 1, 1, NOW() + INTERVAL '1 day' + INTERVAL '9 hours',  NOW() + INTERVAL '1 day' + INTERVAL '10 hours', 'presencial', 'confirmada'),
  (2, 1, 1, NOW() + INTERVAL '1 day' + INTERVAL '10 hours', NOW() + INTERVAL '1 day' + INTERVAL '11 hours', 'presencial', 'confirmada'),
  (3, 2, 3, NOW() + INTERVAL '1 day' + INTERVAL '11 hours', NOW() + INTERVAL '1 day' + INTERVAL '12 hours', 'online',     'agendada'),
  (4, 1, 2, NOW() + INTERVAL '1 day' + INTERVAL '14 hours', NOW() + INTERVAL '1 day' + INTERVAL '15 hours', 'presencial', 'confirmada');

INSERT INTO pagamentos (sessao_id, paciente_id, valor, forma_pagamento, status, data_pagamento) VALUES
  (1, 1, 180.00, 'pix',           'pago',     NOW()::date),
  (2, 2, 180.00, 'cartao_debito', 'pago',     NOW()::date),
  (3, 3, 126.00, 'convenio',      'pendente', NULL),
  (4, 4, 180.00, 'transferencia', 'pago',     NOW()::date);

INSERT INTO tarefas (descricao, paciente_id, responsavel_id, prazo) VALUES
  ('Maria F. deve responder formulário de avaliação antes da próxima sessão', 1, 1, NOW()::date + INTERVAL '7 days'),
  ('Preencher prontuário — Carla Mendes (sessão anterior)', 3, 2, NOW()::date + INTERVAL '2 days');

-- ─── CONVÊNIOS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS convenios (
  id               SERIAL PRIMARY KEY,
  nome             VARCHAR(150)   NOT NULL,
  percentual_pago  NUMERIC(5,2)   NOT NULL,
  coparticipacao   NUMERIC(5,2)   NOT NULL,
  valor_referencia NUMERIC(10,2)  DEFAULT NULL,
  observacoes      TEXT           DEFAULT NULL,
  ativo            BOOLEAN        NOT NULL DEFAULT TRUE,
  criado_em        TIMESTAMP      NOT NULL DEFAULT NOW()
);

INSERT INTO convenios (nome, percentual_pago, coparticipacao, valor_referencia, observacoes) VALUES
  ('Unimed Salvador', 70.00, 30.00, 180.00, 'Reembolso em até 30 dias'),
  ('Bradesco Saúde',  60.00, 40.00, 180.00, 'Autorização prévia necessária'),
  ('Amil',            80.00, 20.00, 180.00, 'Cobertura nacional');
