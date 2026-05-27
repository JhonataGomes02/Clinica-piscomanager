-- =============================================================
--  PsicoManager — Script de Criação do Banco de Dados MySQL
--  Execute este arquivo no MySQL Workbench antes de iniciar
-- =============================================================

CREATE DATABASE IF NOT EXISTS psicomanager
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE psicomanager;

-- -------------------------------------------------------------
-- Tabela: usuarios
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nome        VARCHAR(150)  NOT NULL,
  email       VARCHAR(200)  NOT NULL UNIQUE,
  senha_hash  VARCHAR(255)  NOT NULL,
  perfil      ENUM('psicologo','administrador','paciente') NOT NULL DEFAULT 'paciente',
  crp         VARCHAR(30)   DEFAULT NULL,
  ativo       TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: pacientes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pacientes (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id           INT           DEFAULT NULL,
  nome                 VARCHAR(150)  NOT NULL,
  cpf                  VARCHAR(14)   DEFAULT NULL,
  data_nascimento      DATE          DEFAULT NULL,
  telefone             VARCHAR(20)   DEFAULT NULL,
  email                VARCHAR(200)  DEFAULT NULL,
  endereco             TEXT          DEFAULT NULL,
  contato_emergencia   VARCHAR(200)  DEFAULT NULL,
  psicologo_id         INT           DEFAULT NULL,
  plano                ENUM('mensal','pacote_5','pacote_10','convenio') DEFAULT 'mensal',
  sessoes_no_plano     INT           DEFAULT 0,
  sessoes_utilizadas   INT           DEFAULT 0,
  status               ENUM('ativo','inativo','cancelou') DEFAULT 'ativo',
  criado_em            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id)   REFERENCES usuarios(id) ON DELETE SET NULL,
  FOREIGN KEY (psicologo_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: salas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS salas (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  descricao  VARCHAR(255) DEFAULT NULL,
  ativa      TINYINT(1)   NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: sessoes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessoes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id       INT           NOT NULL,
  psicologo_id      INT           NOT NULL,
  sala_id           INT           DEFAULT NULL,
  data_hora_inicio  DATETIME      NOT NULL,
  data_hora_fim     DATETIME      NOT NULL,
  modalidade        ENUM('presencial','online','grupo') DEFAULT 'presencial',
  status            ENUM('agendada','confirmada','cancelada','realizada') DEFAULT 'agendada',
  observacoes       TEXT          DEFAULT NULL,
  lembrete_enviado  TINYINT(1)   NOT NULL DEFAULT 0,
  criado_em         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id)  REFERENCES pacientes(id) ON DELETE CASCADE,
  FOREIGN KEY (psicologo_id) REFERENCES usuarios(id)  ON DELETE CASCADE,
  FOREIGN KEY (sala_id)      REFERENCES salas(id)     ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: prontuarios
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prontuarios (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id           INT  NOT NULL UNIQUE,
  queixa_principal      TEXT DEFAULT NULL,
  historico_familiar    TEXT DEFAULT NULL,
  historico_clinico     TEXT DEFAULT NULL,
  medicamentos          TEXT DEFAULT NULL,
  hipotese_diagnostica  VARCHAR(200) DEFAULT NULL,
  criado_em             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: evolucoes
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evolucoes (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  sessao_id              INT  NOT NULL,
  prontuario_id          INT  NOT NULL,
  observacoes_clinicas   TEXT DEFAULT NULL,
  status_preenchimento   ENUM('completo','pendente','incompleto') DEFAULT 'pendente',
  psicologo_id           INT  NOT NULL,
  criado_em              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessao_id)     REFERENCES sessoes(id)     ON DELETE CASCADE,
  FOREIGN KEY (prontuario_id) REFERENCES prontuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (psicologo_id)  REFERENCES usuarios(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: pagamentos
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagamentos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  sessao_id        INT            DEFAULT NULL,
  paciente_id      INT            NOT NULL,
  valor            DECIMAL(10,2)  NOT NULL,
  forma_pagamento  ENUM('pix','cartao_debito','cartao_credito','transferencia','dinheiro','convenio') DEFAULT 'pix',
  status           ENUM('pendente','pago','cancelado','estornado') DEFAULT 'pendente',
  data_pagamento   DATE           DEFAULT NULL,
  observacoes      TEXT           DEFAULT NULL,
  criado_em        DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessao_id)   REFERENCES sessoes(id)   ON DELETE SET NULL,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: despesas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS despesas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  descricao   VARCHAR(255) NOT NULL,
  valor       DECIMAL(10,2) NOT NULL,
  categoria   ENUM('aluguel','insumos','software','manutencao','salarios','outros') DEFAULT 'outros',
  data        DATE         NOT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: documentos
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documentos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  paciente_id  INT          NOT NULL,
  tipo         ENUM('recibo','declaracao','laudo','relatorio','contrato') NOT NULL,
  descricao    VARCHAR(255) DEFAULT NULL,
  conteudo     LONGTEXT     DEFAULT NULL,
  criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: tarefas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tarefas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  descricao      TEXT         NOT NULL,
  paciente_id    INT          DEFAULT NULL,
  responsavel_id INT          DEFAULT NULL,
  prazo          DATE         DEFAULT NULL,
  status         ENUM('pendente','concluida','atrasada') DEFAULT 'pendente',
  criado_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (paciente_id)    REFERENCES pacientes(id) ON DELETE SET NULL,
  FOREIGN KEY (responsavel_id) REFERENCES usuarios(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Tabela: logs_auditoria
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT          DEFAULT NULL,
  acao        VARCHAR(100) NOT NULL,
  tabela      VARCHAR(100) DEFAULT NULL,
  registro_id INT          DEFAULT NULL,
  detalhes    TEXT         DEFAULT NULL,
  ip          VARCHAR(50)  DEFAULT NULL,
  criado_em   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =============================================================
--  DADOS DE EXEMPLO (seed)
-- =============================================================

-- Senha de todos os usuários de exemplo: 123456
-- Hash bcrypt gerado com custo 10

INSERT INTO usuarios (nome, email, senha_hash, perfil, crp) VALUES
('Dra. Ana Lima',    'ana@clinica.com',    '$2b$10$X9h7kQzWvNpLmR3sT1uYOu8eJdKfGbHcIaVwMnPqRtSxUyZo2ABCD', 'psicologo',    '03/12345'),
('Dr. Carlos Mendes','carlos@clinica.com', '$2b$10$X9h7kQzWvNpLmR3sT1uYOu8eJdKfGbHcIaVwMnPqRtSxUyZo2ABCD', 'psicologo',    '03/54321'),
('Admin Clinica',    'admin@clinica.com',  '$2b$10$X9h7kQzWvNpLmR3sT1uYOu8eJdKfGbHcIaVwMnPqRtSxUyZo2ABCD', 'administrador', NULL);

INSERT INTO salas (nome, descricao) VALUES
('Sala 01', 'Consultório individual — ar-condicionado'),
('Sala 02', 'Sala de grupo — capacidade 8 pessoas'),
('Sala Virtual', 'Atendimento online via Google Meet');

INSERT INTO pacientes (nome, cpf, data_nascimento, telefone, email, psicologo_id, plano, sessoes_no_plano, sessoes_utilizadas, status) VALUES
('Maria Fernanda Costa', '123.456.789-00', '1992-08-14', '(71) 99123-4567', 'mf.costa@email.com',  1, 'pacote_10', 10, 8, 'ativo'),
('João Pedro Alves',     '234.567.890-11', '1988-03-22', '(71) 98765-1234', 'jp.alves@email.com',  1, 'mensal',    0,  24,'ativo'),
('Carla Mendes',         '345.678.901-22', '1995-11-05', '(71) 91234-5678', 'c.mendes@email.com',  2, 'convenio',  0,  12,'ativo'),
('Roberto Silva',        '456.789.012-33', '1980-07-18', '(71) 99876-5432', 'r.silva@email.com',   1, 'mensal',    0,  31,'ativo'),
('Ana Paula Sousa',      '567.890.123-44', '2000-01-30', '(71) 92345-6789', 'ap.sousa@email.com',  2, 'pacote_5',  5,  3, 'ativo');

INSERT INTO sessoes (paciente_id, psicologo_id, sala_id, data_hora_inicio, data_hora_fim, modalidade, status) VALUES
(1, 1, 1, '2025-06-11 09:00:00', '2025-06-11 09:50:00', 'presencial', 'realizada'),
(2, 1, 1, '2025-06-10 10:00:00', '2025-06-10 10:50:00', 'presencial', 'realizada'),
(3, 2, 3, '2025-06-09 11:00:00', '2025-06-09 11:50:00', 'online',     'realizada'),
(4, 1, 2, '2025-06-11 14:00:00', '2025-06-11 14:50:00', 'presencial', 'confirmada'),
(5, 2, 1, '2025-06-05 15:00:00', '2025-06-05 15:50:00', 'presencial', 'cancelada'),
(1, 1, 1, '2025-06-18 09:00:00', '2025-06-18 09:50:00', 'presencial', 'agendada');

INSERT INTO prontuarios (paciente_id, queixa_principal, historico_familiar, historico_clinico, medicamentos, hipotese_diagnostica) VALUES
(1, 'Ansiedade generalizada, dificuldades no ambiente de trabalho e insônia recorrente.',
   'Mãe com histórico de depressão. Pai ausente desde infância. Dois irmãos.',
   'Sem diagnósticos formais anteriores. Relata episódio de burnout em 2022.',
   'Nenhum no momento. Uso anterior de escitalopram (descontinuado em 2023).',
   'F41.1 — Transtorno de ansiedade generalizada (CID-10)'),
(2, 'Dificuldades de relacionamento interpessoal e baixa autoestima.',
   'Família estruturada. Relação distante com o pai. Filho único.',
   'Tratamento anterior com outro profissional por 1 ano (2020-2021).',
   'Sem medicamentos.',
   'F60.6 — Transtorno ansioso (anancástico) da personalidade');

INSERT INTO evolucoes (sessao_id, prontuario_id, observacoes_clinicas, status_preenchimento, psicologo_id) VALUES
(1, 1, 'Paciente relata melhora no padrão de sono. Técnica de respiração diafragmática praticada com sucesso em situação de estresse. Proposto diário de emoções para próxima semana.', 'completo', 1),
(2, 2, 'Discussão sobre padrões de pensamento catastrófico. Introdução à reestruturação cognitiva. Paciente demonstrou boa compreensão e abertura.', 'completo', 1);

INSERT INTO pagamentos (sessao_id, paciente_id, valor, forma_pagamento, status, data_pagamento) VALUES
(1, 1, 180.00, 'pix',          'pago',     '2025-06-11'),
(2, 2, 180.00, 'cartao_debito','pago',     '2025-06-10'),
(3, 3, 126.00, 'convenio',     'pendente',  NULL),
(4, 4, 180.00, 'transferencia','pago',     '2025-06-11');

INSERT INTO despesas (descricao, valor, categoria, data) VALUES
('Aluguel das salas — junho', 2000.00, 'aluguel',  '2025-06-01'),
('Material de escritório',     350.00, 'insumos',  '2025-06-03'),
('Assinatura PsicoManager',    150.00, 'software', '2025-06-01'),
('Manutenção ar-condicionado', 700.00, 'manutencao','2025-06-08');

INSERT INTO tarefas (descricao, paciente_id, responsavel_id, prazo, status) VALUES
('Maria F. — responder formulário de avaliação antes da sessão de 18/06', 1, 1, '2025-06-17', 'pendente'),
('Preencher prontuário da sessão de 09/06 — Carla Mendes',               3, 2, '2025-06-13', 'atrasada'),
('Enviar recibo João P. — sessão 10/06',                                  2, 1, '2025-06-11', 'concluida');
