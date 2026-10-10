SET NOCOUNT ON;
GO

IF DB_ID(N'ClinvetCursos') IS NULL EXEC(N'CREATE DATABASE ClinvetCursos');
GO
USE ClinvetCursos;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name=N'dominio') EXEC(N'CREATE SCHEMA dominio');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name=N'transacional') EXEC(N'CREATE SCHEMA transacional');
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name=N'analitico') EXEC(N'CREATE SCHEMA analitico');
GO

/* ========================= DOMÍNIOS ========================= */
CREATE TABLE dominio.tb_status_pre_matricula(
 status_pre_matricula_id TINYINT NOT NULL PRIMARY KEY,
 codigo VARCHAR(30) NOT NULL UNIQUE,
 nome NVARCHAR(80) NOT NULL,
 encerrado BIT NOT NULL DEFAULT 0,
 ordem TINYINT NOT NULL
);
CREATE TABLE dominio.tb_canal_contato(
 canal_contato_id TINYINT NOT NULL PRIMARY KEY,
 codigo VARCHAR(20) NOT NULL UNIQUE,
 nome NVARCHAR(50) NOT NULL
);
CREATE TABLE dominio.tb_resultado_contato(
 resultado_contato_id TINYINT NOT NULL PRIMARY KEY,
 codigo VARCHAR(30) NOT NULL UNIQUE,
 nome NVARCHAR(80) NOT NULL
);
CREATE TABLE dominio.tb_status_turma(
 status_turma_id TINYINT NOT NULL PRIMARY KEY,
 codigo VARCHAR(20) NOT NULL UNIQUE,
 nome NVARCHAR(50) NOT NULL
);
CREATE TABLE dominio.tb_status_presenca_aula(
 status_presenca_aula_id TINYINT NOT NULL PRIMARY KEY,
 codigo VARCHAR(20) NOT NULL UNIQUE,
 nome NVARCHAR(50) NOT NULL,
 conta_como_presenca BIT NOT NULL
);
CREATE TABLE dominio.tb_status_agendamento(
 status_agendamento_id TINYINT NOT NULL PRIMARY KEY,
 codigo VARCHAR(20) NOT NULL UNIQUE,
 nome NVARCHAR(50) NOT NULL,
 ocupa_vaga BIT NOT NULL,
 encerrado BIT NOT NULL
);
CREATE TABLE dominio.tb_perfil(
 perfil_id SMALLINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 codigo VARCHAR(30) NOT NULL UNIQUE,
 nome NVARCHAR(80) NOT NULL
);
GO

INSERT INTO dominio.tb_status_pre_matricula VALUES
(1,'NOVO',N'Novo',0,1),(2,'EM_CONTATO',N'Em contato',0,2),(3,'AGUARDANDO',N'Aguardando retorno',0,3),
(4,'INTERESSADO',N'Interessado',0,4),(5,'MATRICULADO',N'Matriculado',1,5),(6,'PERDIDO',N'Perdido',1,6);
INSERT INTO dominio.tb_canal_contato VALUES
(1,'WHATSAPP',N'WhatsApp'),(2,'EMAIL',N'E-mail'),(3,'LIGACAO',N'Ligação'),(4,'PRESENCIAL',N'Presencial'),(5,'OUTRO',N'Outro');
INSERT INTO dominio.tb_resultado_contato VALUES
(1,'CONTATO_REALIZADO',N'Contato realizado'),(2,'AGUARDANDO_RETORNO',N'Aguardando retorno'),
(3,'INTERESSADO',N'Interessado'),(4,'SEM_INTERESSE',N'Sem interesse');
INSERT INTO dominio.tb_status_turma VALUES (1,'PLANEJADA',N'Planejada'),(2,'ATIVA',N'Ativa'),(3,'ENCERRADA',N'Encerrada');
INSERT INTO dominio.tb_status_presenca_aula VALUES (1,'PRESENTE',N'Presente',1),(2,'FALTA',N'Falta',0),(3,'JUSTIFICADA',N'Justificada',1);
INSERT INTO dominio.tb_status_agendamento VALUES
(1,'PENDENTE',N'Pendente',1,0),(2,'APROVADO',N'Aprovado',1,0),(3,'CANCELADO',N'Cancelado',0,1),(4,'REMOVIDO',N'Removido',0,1);
INSERT INTO dominio.tb_perfil(codigo,nome) VALUES
('ADMINISTRADOR',N'Administrador'),('COORDENADOR',N'Coordenador'),('PROFESSOR',N'Professor'),('RECEPCAO',N'Recepção'),('ALUNO',N'Aluno');
GO

/* ========================= NÚCLEO ========================= */
CREATE TABLE transacional.tb_pessoa(
 pessoa_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 identificador_publico UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() UNIQUE,
 nome_completo NVARCHAR(180) NOT NULL,
 email NVARCHAR(254) NULL,
 telefone_celular VARCHAR(25) NULL,
 data_nascimento DATE NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 versao ROWVERSION NOT NULL
);
CREATE INDEX ix_tb_pessoa_email ON transacional.tb_pessoa(email) WHERE email IS NOT NULL;
CREATE INDEX ix_tb_pessoa_telefone ON transacional.tb_pessoa(telefone_celular) WHERE telefone_celular IS NOT NULL;

CREATE TABLE transacional.tb_usuario(
 usuario_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 pessoa_id BIGINT NOT NULL UNIQUE,
 login NVARCHAR(120) NOT NULL UNIQUE,
 hash_senha NVARCHAR(255) NOT NULL,
 algoritmo_hash VARCHAR(30) NOT NULL,
 trocar_senha_proximo_acesso BIT NOT NULL DEFAULT 1,
 ativo BIT NOT NULL DEFAULT 1,
 ultimo_acesso_em DATETIME2(0) NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 versao ROWVERSION NOT NULL,
 CONSTRAINT fk_usuario_pessoa FOREIGN KEY(pessoa_id) REFERENCES transacional.tb_pessoa(pessoa_id)
);
CREATE TABLE transacional.tb_usuario_perfil(
 usuario_id BIGINT NOT NULL,
 perfil_id SMALLINT NOT NULL,
 concedido_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT pk_usuario_perfil PRIMARY KEY(usuario_id,perfil_id),
 CONSTRAINT fk_usuario_perfil_usuario FOREIGN KEY(usuario_id) REFERENCES transacional.tb_usuario(usuario_id),
 CONSTRAINT fk_usuario_perfil_perfil FOREIGN KEY(perfil_id) REFERENCES dominio.tb_perfil(perfil_id)
);
GO

/* ========================= ACADÊMICO ========================= */
CREATE TABLE transacional.tb_curso(
 curso_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 codigo VARCHAR(40) NOT NULL UNIQUE,
 nome NVARCHAR(160) NOT NULL,
 descricao NVARCHAR(1000) NULL,
 minutos_minimos_aulas_praticas INT NOT NULL,
 minutos_maximos_aulas_praticas INT NOT NULL,
 limite_minutos_mes_padrao INT NOT NULL,
 limite_minutos_mes_maximo INT NOT NULL,
 ativo BIT NOT NULL DEFAULT 1,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT ck_curso_carga CHECK(minutos_minimos_aulas_praticas>=0 AND minutos_maximos_aulas_praticas>=minutos_minimos_aulas_praticas),
 CONSTRAINT ck_curso_limite_mes CHECK(limite_minutos_mes_padrao>0 AND limite_minutos_mes_maximo>=limite_minutos_mes_padrao)
);
INSERT INTO transacional.tb_curso(codigo,nome,descricao,minutos_minimos_aulas_praticas,minutos_maximos_aulas_praticas,limite_minutos_mes_padrao,limite_minutos_mes_maximo)
VALUES('AUX_VET',N'Auxiliar Veterinário',N'Curso profissionalizante de Auxiliar Veterinário.',5400,7200,2400,3000);

CREATE TABLE transacional.tb_turma(
 turma_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 curso_id INT NOT NULL,
 codigo VARCHAR(40) NOT NULL UNIQUE,
 nome NVARCHAR(160) NOT NULL,
 data_inicio DATE NOT NULL,
 data_termino DATE NOT NULL,
 status_turma_id TINYINT NOT NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 versao ROWVERSION NOT NULL,
 CONSTRAINT fk_turma_curso FOREIGN KEY(curso_id) REFERENCES transacional.tb_curso(curso_id),
 CONSTRAINT fk_turma_status FOREIGN KEY(status_turma_id) REFERENCES dominio.tb_status_turma(status_turma_id),
 CONSTRAINT ck_turma_datas CHECK(data_termino>=data_inicio)
);
CREATE INDEX ix_tb_turma_curso_status ON transacional.tb_turma(curso_id,status_turma_id,data_inicio);

CREATE TABLE transacional.tb_docente(
 docente_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 pessoa_id BIGINT NOT NULL UNIQUE,
 resumo NVARCHAR(500) NULL,
 foto_url NVARCHAR(1000) NULL,
 ativo BIT NOT NULL DEFAULT 1,
 CONSTRAINT fk_docente_pessoa FOREIGN KEY(pessoa_id) REFERENCES transacional.tb_pessoa(pessoa_id)
);
CREATE TABLE transacional.tb_turma_docente(
 turma_id BIGINT NOT NULL,
 docente_id BIGINT NOT NULL,
 CONSTRAINT pk_turma_docente PRIMARY KEY(turma_id,docente_id),
 CONSTRAINT fk_turma_docente_turma FOREIGN KEY(turma_id) REFERENCES transacional.tb_turma(turma_id),
 CONSTRAINT fk_turma_docente_docente FOREIGN KEY(docente_id) REFERENCES transacional.tb_docente(docente_id)
);

CREATE SEQUENCE transacional.sq_numero_matricula AS BIGINT START WITH 1 INCREMENT BY 1 CACHE 50;
CREATE TABLE transacional.tb_aluno(
 aluno_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 pessoa_id BIGINT NOT NULL UNIQUE,
 numero_matricula VARCHAR(20) NOT NULL UNIQUE,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT fk_aluno_pessoa FOREIGN KEY(pessoa_id) REFERENCES transacional.tb_pessoa(pessoa_id)
);
CREATE TABLE transacional.tb_matricula(
 matricula_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 aluno_id BIGINT NOT NULL,
 turma_id BIGINT NOT NULL,
 pre_matricula_origem_id BIGINT NULL,
 ativa BIT NOT NULL DEFAULT 1,
 limite_minutos_mes_excecao INT NULL,
 matriculado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 encerrado_em DATETIME2(0) NULL,
 motivo_encerramento NVARCHAR(300) NULL,
 criado_por_usuario_id BIGINT NULL,
 versao ROWVERSION NOT NULL,
 CONSTRAINT uq_matricula_aluno_turma UNIQUE(aluno_id,turma_id),
 CONSTRAINT fk_matricula_aluno FOREIGN KEY(aluno_id) REFERENCES transacional.tb_aluno(aluno_id),
 CONSTRAINT fk_matricula_turma FOREIGN KEY(turma_id) REFERENCES transacional.tb_turma(turma_id),
 CONSTRAINT fk_matricula_usuario FOREIGN KEY(criado_por_usuario_id) REFERENCES transacional.tb_usuario(usuario_id)
);
GO

/* ========================= CRM ========================= */
CREATE TABLE transacional.tb_pre_matricula(
 pre_matricula_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 identificador_publico UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() UNIQUE,
 pessoa_id BIGINT NOT NULL,
 curso_id INT NULL,
 status_pre_matricula_id TINYINT NOT NULL,
 responsavel_usuario_id BIGINT NULL,
 mensagem NVARCHAR(2000) NULL,
 origem NVARCHAR(100) NULL,
 utm_source NVARCHAR(100) NULL,
 utm_medium NVARCHAR(100) NULL,
 utm_campaign NVARCHAR(150) NULL,
 proximo_followup_em DATETIME2(0) NULL,
 ultimo_contato_em DATETIME2(0) NULL,
 motivo_perda NVARCHAR(300) NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 encerrado_em DATETIME2(0) NULL,
 versao ROWVERSION NOT NULL,
 CONSTRAINT fk_pre_pessoa FOREIGN KEY(pessoa_id) REFERENCES transacional.tb_pessoa(pessoa_id),
 CONSTRAINT fk_pre_curso FOREIGN KEY(curso_id) REFERENCES transacional.tb_curso(curso_id),
 CONSTRAINT fk_pre_status FOREIGN KEY(status_pre_matricula_id) REFERENCES dominio.tb_status_pre_matricula(status_pre_matricula_id),
 CONSTRAINT fk_pre_responsavel FOREIGN KEY(responsavel_usuario_id) REFERENCES transacional.tb_usuario(usuario_id)
);
CREATE INDEX ix_tb_pre_fila ON transacional.tb_pre_matricula(status_pre_matricula_id,responsavel_usuario_id,proximo_followup_em,criado_em)
INCLUDE(pessoa_id,curso_id,ultimo_contato_em);

CREATE TABLE transacional.tb_historico_status_pre_matricula(
 historico_status_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 pre_matricula_id BIGINT NOT NULL,
 status_pre_matricula_id TINYINT NOT NULL,
 alterado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 alterado_por_usuario_id BIGINT NULL,
 observacao NVARCHAR(500) NULL,
 CONSTRAINT fk_hist_status_pre FOREIGN KEY(pre_matricula_id) REFERENCES transacional.tb_pre_matricula(pre_matricula_id),
 CONSTRAINT fk_hist_status_dominio FOREIGN KEY(status_pre_matricula_id) REFERENCES dominio.tb_status_pre_matricula(status_pre_matricula_id)
);
CREATE TABLE transacional.tb_historico_responsavel_pre_matricula(
 historico_responsavel_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 pre_matricula_id BIGINT NOT NULL,
 responsavel_usuario_id BIGINT NOT NULL,
 atribuido_por_usuario_id BIGINT NULL,
 atribuido_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 liberado_em DATETIME2(0) NULL,
 CONSTRAINT fk_hist_resp_pre FOREIGN KEY(pre_matricula_id) REFERENCES transacional.tb_pre_matricula(pre_matricula_id)
);
CREATE TABLE transacional.tb_historico_contato(
 historico_contato_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 pre_matricula_id BIGINT NOT NULL,
 usuario_id BIGINT NOT NULL,
 canal_contato_id TINYINT NOT NULL,
 resultado_contato_id TINYINT NOT NULL,
 contatado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 proximo_followup_em DATETIME2(0) NULL,
 observacao NVARCHAR(2000) NULL,
 identificador_mensagem_provedor NVARCHAR(200) NULL,
 CONSTRAINT fk_contato_pre FOREIGN KEY(pre_matricula_id) REFERENCES transacional.tb_pre_matricula(pre_matricula_id),
 CONSTRAINT fk_contato_usuario FOREIGN KEY(usuario_id) REFERENCES transacional.tb_usuario(usuario_id),
 CONSTRAINT fk_contato_canal FOREIGN KEY(canal_contato_id) REFERENCES dominio.tb_canal_contato(canal_contato_id),
 CONSTRAINT fk_contato_resultado FOREIGN KEY(resultado_contato_id) REFERENCES dominio.tb_resultado_contato(resultado_contato_id)
);
CREATE INDEX ix_tb_contato_pre_data ON transacional.tb_historico_contato(pre_matricula_id,contatado_em DESC);

ALTER TABLE transacional.tb_matricula ADD CONSTRAINT fk_matricula_pre_origem FOREIGN KEY(pre_matricula_origem_id) REFERENCES transacional.tb_pre_matricula(pre_matricula_id);
CREATE UNIQUE INDEX ux_tb_matricula_pre_origem ON transacional.tb_matricula(pre_matricula_origem_id) WHERE pre_matricula_origem_id IS NOT NULL;
GO

/* ========================= AULAS / NOTAS ========================= */
CREATE TABLE transacional.tb_aula(
 aula_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 turma_id BIGINT NOT NULL,
 professor_usuario_id BIGINT NULL,
 data_aula DATE NOT NULL,
 hora_inicio TIME(0) NULL,
 hora_termino TIME(0) NULL,
 titulo NVARCHAR(180) NOT NULL,
 observacao NVARCHAR(1000) NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT fk_aula_turma FOREIGN KEY(turma_id) REFERENCES transacional.tb_turma(turma_id)
);
CREATE INDEX ix_tb_aula_turma_data ON transacional.tb_aula(turma_id,data_aula);
CREATE TABLE transacional.tb_presenca_aula(
 presenca_aula_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 aula_id BIGINT NOT NULL,
 aluno_id BIGINT NOT NULL,
 status_presenca_aula_id TINYINT NOT NULL,
 observacao NVARCHAR(500) NULL,
 justificativa_falta NVARCHAR(1000) NULL,
 registrado_por_usuario_id BIGINT NULL,
 registrado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT uq_presenca_aula UNIQUE(aula_id,aluno_id),
 CONSTRAINT fk_presenca_aula FOREIGN KEY(aula_id) REFERENCES transacional.tb_aula(aula_id),
 CONSTRAINT fk_presenca_aluno FOREIGN KEY(aluno_id) REFERENCES transacional.tb_aluno(aluno_id),
 CONSTRAINT fk_presenca_status FOREIGN KEY(status_presenca_aula_id) REFERENCES dominio.tb_status_presenca_aula(status_presenca_aula_id)
);
CREATE TABLE transacional.tb_atividade(
 atividade_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 turma_id BIGINT NOT NULL,
 nome NVARCHAR(180) NOT NULL,
 nota_maxima DECIMAL(6,2) NOT NULL DEFAULT 10,
 data_atividade DATE NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT fk_atividade_turma FOREIGN KEY(turma_id) REFERENCES transacional.tb_turma(turma_id)
);
CREATE TABLE transacional.tb_nota(
 nota_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 atividade_id BIGINT NOT NULL,
 aluno_id BIGINT NOT NULL,
 valor DECIMAL(6,2) NOT NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT uq_nota UNIQUE(atividade_id,aluno_id),
 CONSTRAINT fk_nota_atividade FOREIGN KEY(atividade_id) REFERENCES transacional.tb_atividade(atividade_id),
 CONSTRAINT fk_nota_aluno FOREIGN KEY(aluno_id) REFERENCES transacional.tb_aluno(aluno_id),
 CONSTRAINT ck_nota_valor CHECK(valor>=0)
);
CREATE TABLE transacional.tb_material(
 material_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 turma_id BIGINT NOT NULL,
 titulo NVARCHAR(180) NOT NULL,
 url_recurso NVARCHAR(1000) NOT NULL,
 ativo BIT NOT NULL DEFAULT 1,
 ordem SMALLINT NOT NULL DEFAULT 0,
 CONSTRAINT fk_material_turma FOREIGN KEY(turma_id) REFERENCES transacional.tb_turma(turma_id)
);
GO

/* ========================= AULAS PRÁTICAS ========================= */
CREATE TABLE dominio.tb_especialidade(
 especialidade_id SMALLINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 codigo VARCHAR(40) NOT NULL UNIQUE,
 nome NVARCHAR(100) NOT NULL,
 ativa BIT NOT NULL DEFAULT 1
);
INSERT INTO dominio.tb_especialidade(codigo,nome) VALUES
('INTERNACAO',N'Internação'),('CLINICA',N'Clínica'),('IMAGEM',N'Imagem'),('REABILITA',N'Reabilita'),('CIRURGIA',N'Cirurgia');

CREATE TABLE transacional.tb_turno_especialidade(
 turno_especialidade_id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 especialidade_id SMALLINT NOT NULL,
 dia_semana TINYINT NOT NULL,
 hora_inicio TIME(0) NOT NULL,
 hora_termino TIME(0) NOT NULL,
 capacidade SMALLINT NOT NULL DEFAULT 2,
 ativo BIT NOT NULL DEFAULT 1,
 CONSTRAINT fk_turno_especialidade FOREIGN KEY(especialidade_id) REFERENCES dominio.tb_especialidade(especialidade_id),
 CONSTRAINT uq_turno_especialidade UNIQUE(especialidade_id,dia_semana,hora_inicio,hora_termino),
 CONSTRAINT ck_turno_dia CHECK(dia_semana BETWEEN 1 AND 7),
 CONSTRAINT ck_turno_hora CHECK(hora_termino>hora_inicio)
);

DECLARE @i SMALLINT=(SELECT especialidade_id FROM dominio.tb_especialidade WHERE codigo='INTERNACAO');
DECLARE @c SMALLINT=(SELECT especialidade_id FROM dominio.tb_especialidade WHERE codigo='CLINICA');
DECLARE @m SMALLINT=(SELECT especialidade_id FROM dominio.tb_especialidade WHERE codigo='IMAGEM');
DECLARE @r SMALLINT=(SELECT especialidade_id FROM dominio.tb_especialidade WHERE codigo='REABILITA');
DECLARE @s SMALLINT=(SELECT especialidade_id FROM dominio.tb_especialidade WHERE codigo='CIRURGIA');
INSERT INTO transacional.tb_turno_especialidade(especialidade_id,dia_semana,hora_inicio,hora_termino)
SELECT @i,d.d,h.hi,h.hf FROM(VALUES(1),(2),(3),(4),(5),(6),(7))d(d) CROSS JOIN(VALUES(CAST('08:00' AS TIME),CAST('13:00' AS TIME)),(CAST('13:00' AS TIME),CAST('18:00' AS TIME)),(CAST('18:00' AS TIME),CAST('23:00' AS TIME)))h(hi,hf);
INSERT INTO transacional.tb_turno_especialidade(especialidade_id,dia_semana,hora_inicio,hora_termino)
SELECT @c,d.d,h.hi,h.hf FROM(VALUES(1),(2),(3),(4),(5),(6),(7))d(d) CROSS JOIN(VALUES(CAST('08:00' AS TIME),CAST('13:00' AS TIME)),(CAST('13:00' AS TIME),CAST('18:00' AS TIME)),(CAST('18:00' AS TIME),CAST('23:00' AS TIME)))h(hi,hf);
INSERT INTO transacional.tb_turno_especialidade(especialidade_id,dia_semana,hora_inicio,hora_termino)
SELECT @m,d.d,h.hi,h.hf FROM(VALUES(1),(2),(3),(4),(5),(6))d(d) CROSS JOIN(VALUES(CAST('08:00' AS TIME),CAST('13:00' AS TIME)),(CAST('14:00' AS TIME),CAST('19:00' AS TIME)))h(hi,hf);
INSERT INTO transacional.tb_turno_especialidade(especialidade_id,dia_semana,hora_inicio,hora_termino)
SELECT @r,d.d,CAST('14:00' AS TIME),CAST('19:00' AS TIME) FROM(VALUES(1),(2),(3),(4),(5))d(d);
INSERT INTO transacional.tb_turno_especialidade(especialidade_id,dia_semana,hora_inicio,hora_termino)
SELECT @s,d.d,h.hi,h.hf FROM(VALUES(1),(2),(3),(4),(5))d(d) CROSS JOIN(VALUES(CAST('08:00' AS TIME),CAST('13:00' AS TIME)),(CAST('13:00' AS TIME),CAST('18:00' AS TIME)))h(hi,hf);
GO

CREATE TABLE transacional.tb_data_bloqueada(
 data_bloqueada_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 data DATE NOT NULL,
 especialidade_id SMALLINT NULL,
 turno_especialidade_id INT NULL,
 motivo NVARCHAR(300) NOT NULL,
 ativa BIT NOT NULL DEFAULT 1
);
CREATE TABLE transacional.tb_agendamento(
 agendamento_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
 aluno_id BIGINT NOT NULL,
 turno_especialidade_id INT NOT NULL,
 data_aula_pratica DATE NOT NULL,
 status_agendamento_id TINYINT NOT NULL,
 solicitado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 aprovado_em DATETIME2(0) NULL,
 aprovado_por_usuario_id BIGINT NULL,
 cancelado_em DATETIME2(0) NULL,
 antecedencia_cancelamento_minutos INT NULL,
 removido_em DATETIME2(0) NULL,
 removido_por_usuario_id BIGINT NULL,
 atualizado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 versao ROWVERSION NOT NULL,
 CONSTRAINT fk_agendamento_aluno FOREIGN KEY(aluno_id) REFERENCES transacional.tb_aluno(aluno_id),
 CONSTRAINT fk_agendamento_turno FOREIGN KEY(turno_especialidade_id) REFERENCES transacional.tb_turno_especialidade(turno_especialidade_id),
 CONSTRAINT fk_agendamento_status FOREIGN KEY(status_agendamento_id) REFERENCES dominio.tb_status_agendamento(status_agendamento_id)
);
CREATE INDEX ix_tb_agendamento_capacidade ON transacional.tb_agendamento(data_aula_pratica,turno_especialidade_id,status_agendamento_id) INCLUDE(aluno_id);
CREATE INDEX ix_tb_agendamento_aluno_data ON transacional.tb_agendamento(aluno_id,data_aula_pratica DESC);

CREATE TABLE transacional.tb_checkin_checkout(
 checkin_checkout_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 agendamento_id BIGINT NOT NULL UNIQUE,
 checkin_em DATETIME2(0) NOT NULL,
 checkout_em DATETIME2(0) NULL,
 minutos_contabilizados INT NULL,
 registrado_por_usuario_id BIGINT NULL,
 observacao NVARCHAR(500) NULL,
 CONSTRAINT fk_check_agendamento FOREIGN KEY(agendamento_id) REFERENCES transacional.tb_agendamento(agendamento_id),
 CONSTRAINT ck_check_minutos CHECK(minutos_contabilizados IS NULL OR minutos_contabilizados>=0)
);
GO

/* ========================= ANALÍTICO / OUTBOX ========================= */
CREATE TABLE analitico.tb_evento_integracao(
 evento_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 tipo_evento VARCHAR(80) NOT NULL,
 entidade VARCHAR(80) NOT NULL,
 entidade_id BIGINT NOT NULL,
 ocorrido_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 payload_json NVARCHAR(MAX) NULL,
 exportado_em DATETIME2(0) NULL,
 tentativa SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX ix_tb_evento_integracao_pendente ON analitico.tb_evento_integracao(exportado_em,ocorrido_em) WHERE exportado_em IS NULL;
GO

CREATE VIEW analitico.vw_funil_pre_matricula AS
SELECT pm.pre_matricula_id,pm.criado_em,pm.encerrado_em,s.codigo status,p.nome_completo,p.email,p.telefone_celular,pm.origem,pm.utm_source,pm.utm_medium,pm.utm_campaign
FROM transacional.tb_pre_matricula pm
JOIN dominio.tb_status_pre_matricula s ON s.status_pre_matricula_id=pm.status_pre_matricula_id
JOIN transacional.tb_pessoa p ON p.pessoa_id=pm.pessoa_id;
GO

CREATE VIEW analitico.vw_progresso_aulas_praticas AS
SELECT a.aluno_id,a.numero_matricula,p.nome_completo,m.matricula_id,t.turma_id,t.codigo codigo_turma,
 c.minutos_minimos_aulas_praticas,c.minutos_maximos_aulas_praticas,
 ISNULL(SUM(cc.minutos_contabilizados),0) minutos_realizados,
 CAST(ISNULL(SUM(cc.minutos_contabilizados),0)/60.0 AS DECIMAL(10,2)) horas_realizadas,
 CAST(CASE WHEN c.minutos_minimos_aulas_praticas=0 THEN 100
           WHEN ISNULL(SUM(cc.minutos_contabilizados),0)>=c.minutos_minimos_aulas_praticas THEN 100
           ELSE ISNULL(SUM(cc.minutos_contabilizados),0)*100.0/c.minutos_minimos_aulas_praticas END AS DECIMAL(5,2)) percentual_minimo
FROM transacional.tb_aluno a
JOIN transacional.tb_pessoa p ON p.pessoa_id=a.pessoa_id
JOIN transacional.tb_matricula m ON m.aluno_id=a.aluno_id AND m.ativa=1
JOIN transacional.tb_turma t ON t.turma_id=m.turma_id
JOIN transacional.tb_curso c ON c.curso_id=t.curso_id
LEFT JOIN transacional.tb_agendamento ag ON ag.aluno_id=a.aluno_id
LEFT JOIN transacional.tb_checkin_checkout cc ON cc.agendamento_id=ag.agendamento_id AND cc.checkout_em IS NOT NULL
GROUP BY a.aluno_id,a.numero_matricula,p.nome_completo,m.matricula_id,t.turma_id,t.codigo,c.minutos_minimos_aulas_praticas,c.minutos_maximos_aulas_praticas;
GO

CREATE VIEW analitico.vw_frequencia_aulas AS
SELECT m.turma_id,a.aluno_id,a.numero_matricula,p.nome_completo,
 COUNT(pa.presenca_aula_id) total_registros,
 SUM(CASE WHEN spa.conta_como_presenca=1 THEN 1 ELSE 0 END) presencas,
 SUM(CASE WHEN spa.codigo='FALTA' THEN 1 ELSE 0 END) faltas,
 CAST(CASE WHEN COUNT(pa.presenca_aula_id)=0 THEN 0 ELSE SUM(CASE WHEN spa.conta_como_presenca=1 THEN 1 ELSE 0 END)*100.0/COUNT(pa.presenca_aula_id) END AS DECIMAL(5,2)) percentual_frequencia
FROM transacional.tb_matricula m
JOIN transacional.tb_aluno a ON a.aluno_id=m.aluno_id
JOIN transacional.tb_pessoa p ON p.pessoa_id=a.pessoa_id
LEFT JOIN transacional.tb_aula au ON au.turma_id=m.turma_id
LEFT JOIN transacional.tb_presenca_aula pa ON pa.aula_id=au.aula_id AND pa.aluno_id=a.aluno_id
LEFT JOIN dominio.tb_status_presenca_aula spa ON spa.status_presenca_aula_id=pa.status_presenca_aula_id
GROUP BY m.turma_id,a.aluno_id,a.numero_matricula,p.nome_completo;
GO

/* ========================= PROCEDURES ========================= */
CREATE OR ALTER PROCEDURE transacional.sp_assumir_pre_matricula @pre_matricula_id BIGINT,@usuario_id BIGINT AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRAN;
 DECLARE @resp BIGINT,@status TINYINT;
 SELECT @resp=responsavel_usuario_id,@status=status_pre_matricula_id FROM transacional.tb_pre_matricula WITH(UPDLOCK,HOLDLOCK) WHERE pre_matricula_id=@pre_matricula_id;
 IF @status IS NULL THROW 50001,'Pré-matrícula não encontrada.',1;
 IF EXISTS(SELECT 1 FROM dominio.tb_status_pre_matricula WHERE status_pre_matricula_id=@status AND encerrado=1) THROW 50002,'Pré-matrícula encerrada.',1;
 IF @resp IS NOT NULL AND @resp<>@usuario_id THROW 50003,'Pré-matrícula já atribuída a outro responsável.',1;
 IF @resp IS NULL BEGIN
  UPDATE transacional.tb_pre_matricula SET responsavel_usuario_id=@usuario_id,status_pre_matricula_id=2,atualizado_em=SYSUTCDATETIME() WHERE pre_matricula_id=@pre_matricula_id;
  INSERT transacional.tb_historico_responsavel_pre_matricula(pre_matricula_id,responsavel_usuario_id,atribuido_por_usuario_id) VALUES(@pre_matricula_id,@usuario_id,@usuario_id);
  INSERT transacional.tb_historico_status_pre_matricula(pre_matricula_id,status_pre_matricula_id,alterado_por_usuario_id,observacao) VALUES(@pre_matricula_id,2,@usuario_id,N'Atendimento assumido.');
 END
 COMMIT;
END;
GO

CREATE OR ALTER PROCEDURE transacional.sp_solicitar_agendamento @aluno_id BIGINT,@turno_especialidade_id INT,@data DATE AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; BEGIN TRAN;
 DECLARE @inicio TIME,@fim TIME,@capacidade SMALLINT,@ocupadas INT,@minutos_turno INT,@limite_mes INT,@minutos_mes INT,@curso_id INT;
 SELECT @inicio=hora_inicio,@fim=hora_termino,@capacidade=capacidade FROM transacional.tb_turno_especialidade WITH(UPDLOCK,HOLDLOCK) WHERE turno_especialidade_id=@turno_especialidade_id AND ativo=1;
 IF @inicio IS NULL THROW 50100,'Turno indisponível.',1;
 IF EXISTS(
  SELECT 1 FROM transacional.tb_agendamento ag
  JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
  JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id AND s.ocupa_vaga=1
  WHERE ag.aluno_id=@aluno_id AND ag.data_aula_pratica=@data AND te.hora_inicio<@fim AND @inicio<te.hora_termino
 ) THROW 50101,'Aluno já possui aula prática agendada neste dia/horário.',1;
 SELECT @ocupadas=COUNT(*) FROM transacional.tb_agendamento ag WITH(UPDLOCK,HOLDLOCK)
 JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id
 WHERE ag.turno_especialidade_id=@turno_especialidade_id AND ag.data_aula_pratica=@data AND s.ocupa_vaga=1;
 IF @ocupadas>=@capacidade THROW 50102,'Período lotado.',1;
 SELECT TOP 1 @curso_id=t.curso_id,@limite_mes=COALESCE(m.limite_minutos_mes_excecao,c.limite_minutos_mes_padrao)
 FROM transacional.tb_matricula m JOIN transacional.tb_turma t ON t.turma_id=m.turma_id JOIN transacional.tb_curso c ON c.curso_id=t.curso_id
 WHERE m.aluno_id=@aluno_id AND m.ativa=1 ORDER BY m.matriculado_em DESC;
 IF @limite_mes IS NULL THROW 50103,'Matrícula ativa não encontrada.',1;
 IF @limite_mes>(SELECT limite_minutos_mes_maximo FROM transacional.tb_curso WHERE curso_id=@curso_id) THROW 50104,'Limite mensal excede o máximo permitido.',1;
 SET @minutos_turno=DATEDIFF(MINUTE,@inicio,@fim);
 SELECT @minutos_mes=ISNULL(SUM(DATEDIFF(MINUTE,te.hora_inicio,te.hora_termino)),0)
 FROM transacional.tb_agendamento ag JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
 JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id AND s.ocupa_vaga=1
 WHERE ag.aluno_id=@aluno_id AND YEAR(ag.data_aula_pratica)=YEAR(@data) AND MONTH(ag.data_aula_pratica)=MONTH(@data);
 IF @minutos_mes+@minutos_turno>@limite_mes THROW 50105,'Limite mensal de aulas práticas atingido.',1;
 INSERT transacional.tb_agendamento(aluno_id,turno_especialidade_id,data_aula_pratica,status_agendamento_id) VALUES(@aluno_id,@turno_especialidade_id,@data,1);
 DECLARE @id BIGINT=SCOPE_IDENTITY();
 INSERT analitico.tb_evento_integracao(tipo_evento,entidade,entidade_id,payload_json) VALUES('AGENDAMENTO_SOLICITADO','tb_agendamento',@id,NULL);
 COMMIT; SELECT @id agendamento_id;
END;
GO

CREATE OR ALTER PROCEDURE transacional.sp_registrar_checkin @agendamento_id BIGINT,@usuario_id BIGINT=NULL AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRAN;
 IF NOT EXISTS(SELECT 1 FROM transacional.tb_agendamento ag JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id WHERE ag.agendamento_id=@agendamento_id AND s.codigo='APROVADO' AND ag.data_aula_pratica=CONVERT(DATE,SYSDATETIME()))
  THROW 50200,'Agendamento aprovado para hoje não encontrado.',1;
 IF EXISTS(SELECT 1 FROM transacional.tb_checkin_checkout WHERE agendamento_id=@agendamento_id) THROW 50201,'Check-in já registrado.',1;
 INSERT transacional.tb_checkin_checkout(agendamento_id,checkin_em,registrado_por_usuario_id) VALUES(@agendamento_id,SYSUTCDATETIME(),@usuario_id);
 COMMIT;
END;
GO

CREATE OR ALTER PROCEDURE transacional.sp_registrar_checkout @agendamento_id BIGINT AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRAN;
 DECLARE @checkin DATETIME2,@max_min INT,@agora DATETIME2=SYSUTCDATETIME();
 SELECT @checkin=cc.checkin_em,@max_min=DATEDIFF(MINUTE,te.hora_inicio,te.hora_termino)
 FROM transacional.tb_checkin_checkout cc JOIN transacional.tb_agendamento ag ON ag.agendamento_id=cc.agendamento_id JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
 WHERE cc.agendamento_id=@agendamento_id AND cc.checkout_em IS NULL;
 IF @checkin IS NULL THROW 50210,'Check-in em aberto não encontrado.',1;
 UPDATE transacional.tb_checkin_checkout SET checkout_em=@agora,minutos_contabilizados=CASE WHEN DATEDIFF(MINUTE,@checkin,@agora)>@max_min THEN @max_min ELSE DATEDIFF(MINUTE,@checkin,@agora) END WHERE agendamento_id=@agendamento_id;
 INSERT analitico.tb_evento_integracao(tipo_evento,entidade,entidade_id,payload_json) VALUES('AULA_PRATICA_CONCLUIDA','tb_agendamento',@agendamento_id,NULL);
 COMMIT;
END;
GO


CREATE OR ALTER PROCEDURE transacional.sp_registrar_contato
 @pre_matricula_id BIGINT,
 @usuario_id BIGINT,
 @canal_contato_id TINYINT,
 @resultado_contato_id TINYINT,
 @observacao NVARCHAR(2000)=NULL,
 @proximo_followup_em DATETIME2(0)=NULL
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRAN;
 DECLARE @responsavel BIGINT,@novo_status TINYINT;
 SELECT @responsavel=responsavel_usuario_id FROM transacional.tb_pre_matricula WITH(UPDLOCK,HOLDLOCK) WHERE pre_matricula_id=@pre_matricula_id;
 IF @responsavel IS NULL THROW 50010,'Pré-matrícula deve ser assumida antes do contato.',1;
 IF @responsavel<>@usuario_id THROW 50011,'Pré-matrícula atribuída a outro responsável.',1;
 SELECT @novo_status=CASE codigo WHEN 'AGUARDANDO_RETORNO' THEN 3 WHEN 'INTERESSADO' THEN 4 WHEN 'SEM_INTERESSE' THEN 6 ELSE 2 END
 FROM dominio.tb_resultado_contato WHERE resultado_contato_id=@resultado_contato_id;
 IF @novo_status IS NULL THROW 50012,'Resultado de contato inválido.',1;
 INSERT transacional.tb_historico_contato(pre_matricula_id,usuario_id,canal_contato_id,resultado_contato_id,proximo_followup_em,observacao)
 VALUES(@pre_matricula_id,@usuario_id,@canal_contato_id,@resultado_contato_id,@proximo_followup_em,@observacao);
 UPDATE transacional.tb_pre_matricula SET status_pre_matricula_id=@novo_status,ultimo_contato_em=SYSUTCDATETIME(),
 proximo_followup_em=@proximo_followup_em,motivo_perda=CASE WHEN @novo_status=6 THEN @observacao ELSE motivo_perda END,
 encerrado_em=CASE WHEN @novo_status=6 THEN SYSUTCDATETIME() ELSE NULL END,atualizado_em=SYSUTCDATETIME()
 WHERE pre_matricula_id=@pre_matricula_id;
 INSERT transacional.tb_historico_status_pre_matricula(pre_matricula_id,status_pre_matricula_id,alterado_por_usuario_id,observacao)
 VALUES(@pre_matricula_id,@novo_status,@usuario_id,@observacao);
 COMMIT;
END;
GO

CREATE OR ALTER PROCEDURE transacional.sp_converter_pre_matricula
 @pre_matricula_id BIGINT,
 @turma_id BIGINT,
 @usuario_id BIGINT,
 @hash_senha NVARCHAR(255),
 @algoritmo_hash VARCHAR(30)
AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRAN;
 DECLARE @pessoa_id BIGINT,@responsavel BIGINT,@aluno_id BIGINT,@numero VARCHAR(20),@seq BIGINT,@perfil SMALLINT,@novo_usuario BIGINT;
 SELECT @pessoa_id=pessoa_id,@responsavel=responsavel_usuario_id FROM transacional.tb_pre_matricula WITH(UPDLOCK,HOLDLOCK) WHERE pre_matricula_id=@pre_matricula_id;
 IF @pessoa_id IS NULL THROW 50020,'Pré-matrícula não encontrada.',1;
 IF @responsavel IS NOT NULL AND @responsavel<>@usuario_id THROW 50021,'Pré-matrícula atribuída a outro responsável.',1;
 IF EXISTS(SELECT 1 FROM transacional.tb_matricula WHERE pre_matricula_origem_id=@pre_matricula_id) THROW 50022,'Pré-matrícula já convertida.',1;
 IF NOT EXISTS(SELECT 1 FROM transacional.tb_turma t JOIN dominio.tb_status_turma s ON s.status_turma_id=t.status_turma_id WHERE t.turma_id=@turma_id AND s.codigo IN('PLANEJADA','ATIVA')) THROW 50023,'Turma inválida.',1;
 SELECT @aluno_id=aluno_id,@numero=numero_matricula FROM transacional.tb_aluno WHERE pessoa_id=@pessoa_id;
 IF @aluno_id IS NULL BEGIN
   SET @seq=NEXT VALUE FOR transacional.sq_numero_matricula;
   SET @numero=CONVERT(VARCHAR(4),YEAR(SYSDATETIME()))+RIGHT('000000'+CONVERT(VARCHAR(6),@seq),6);
   INSERT transacional.tb_aluno(pessoa_id,numero_matricula) VALUES(@pessoa_id,@numero);
   SET @aluno_id=SCOPE_IDENTITY();
 END
 IF NOT EXISTS(SELECT 1 FROM transacional.tb_usuario WHERE pessoa_id=@pessoa_id) BEGIN
   INSERT transacional.tb_usuario(pessoa_id,login,hash_senha,algoritmo_hash,trocar_senha_proximo_acesso,ativo)
   VALUES(@pessoa_id,@numero,@hash_senha,@algoritmo_hash,1,1);
   SET @novo_usuario=SCOPE_IDENTITY();
   SELECT @perfil=perfil_id FROM dominio.tb_perfil WHERE codigo='ALUNO';
   INSERT transacional.tb_usuario_perfil(usuario_id,perfil_id) VALUES(@novo_usuario,@perfil);
 END
 INSERT transacional.tb_matricula(aluno_id,turma_id,pre_matricula_origem_id,criado_por_usuario_id)
 VALUES(@aluno_id,@turma_id,@pre_matricula_id,@usuario_id);
 UPDATE transacional.tb_pre_matricula SET status_pre_matricula_id=5,encerrado_em=SYSUTCDATETIME(),atualizado_em=SYSUTCDATETIME(),
 responsavel_usuario_id=COALESCE(responsavel_usuario_id,@usuario_id) WHERE pre_matricula_id=@pre_matricula_id;
 INSERT transacional.tb_historico_status_pre_matricula(pre_matricula_id,status_pre_matricula_id,alterado_por_usuario_id,observacao)
 VALUES(@pre_matricula_id,5,@usuario_id,N'Pré-matrícula convertida em matrícula.');
 DECLARE @matricula_id BIGINT=SCOPE_IDENTITY();
 INSERT analitico.tb_evento_integracao(tipo_evento,entidade,entidade_id,payload_json)
 VALUES('MATRICULA_EFETIVADA','tb_pre_matricula',@pre_matricula_id,NULL);
 COMMIT;
 SELECT @aluno_id aluno_id,@numero numero_matricula;
END;
GO


/* ========================= FEEDBACK / AVALIAÇÃO ========================= */
CREATE TABLE dominio.tb_criterio_avaliacao(
 criterio_avaliacao_id SMALLINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 codigo VARCHAR(40) NOT NULL UNIQUE,
 nome NVARCHAR(100) NOT NULL,
 ordem TINYINT NOT NULL,
 ativo BIT NOT NULL DEFAULT 1
);
INSERT INTO dominio.tb_criterio_avaliacao(codigo,nome,ordem) VALUES
('ATITUDE_COLABORACAO',N'Atitude / colaboração',1),
('PROATIVIDADE',N'Proatividade',2),
('CONHECIMENTO',N'Conhecimento',3),
('POSTURA_PROFISSIONAL',N'Postura profissional',4);

CREATE TABLE transacional.tb_avaliacao(
 avaliacao_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 agendamento_id BIGINT NOT NULL,
 avaliador_usuario_id BIGINT NULL,
 nome_avaliador NVARCHAR(180) NULL,
 funcao_avaliador NVARCHAR(100) NULL,
 tipo VARCHAR(20) NOT NULL,
 comentario NVARCHAR(2000) NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT fk_avaliacao_agendamento FOREIGN KEY(agendamento_id) REFERENCES transacional.tb_agendamento(agendamento_id),
 CONSTRAINT fk_avaliacao_usuario FOREIGN KEY(avaliador_usuario_id) REFERENCES transacional.tb_usuario(usuario_id),
 CONSTRAINT ck_avaliacao_tipo CHECK(tipo IN('RECONHECIMENTO','DESENVOLVIMENTO'))
);
CREATE INDEX ix_tb_avaliacao_agendamento ON transacional.tb_avaliacao(agendamento_id,criado_em DESC);

CREATE TABLE transacional.tb_nota_criterio_avaliacao(
 avaliacao_id BIGINT NOT NULL,
 criterio_avaliacao_id SMALLINT NOT NULL,
 nota TINYINT NOT NULL,
 CONSTRAINT pk_nota_criterio_avaliacao PRIMARY KEY(avaliacao_id,criterio_avaliacao_id),
 CONSTRAINT fk_nota_criterio_avaliacao FOREIGN KEY(avaliacao_id) REFERENCES transacional.tb_avaliacao(avaliacao_id),
 CONSTRAINT fk_nota_criterio_dominio FOREIGN KEY(criterio_avaliacao_id) REFERENCES dominio.tb_criterio_avaliacao(criterio_avaliacao_id),
 CONSTRAINT ck_nota_criterio CHECK(nota BETWEEN 1 AND 5)
);
GO

/* ========================= COMUNICAÇÃO ========================= */
CREATE TABLE dominio.tb_canal_mensagem(
 canal_mensagem_id TINYINT NOT NULL PRIMARY KEY,
 codigo VARCHAR(20) NOT NULL UNIQUE,
 nome NVARCHAR(50) NOT NULL
);
INSERT INTO dominio.tb_canal_mensagem VALUES(1,'EMAIL',N'E-mail'),(2,'WHATSAPP',N'WhatsApp');

CREATE TABLE transacional.tb_mensagem(
 mensagem_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 canal_mensagem_id TINYINT NOT NULL,
 assunto NVARCHAR(250) NULL,
 corpo NVARCHAR(MAX) NOT NULL,
 criado_por_usuario_id BIGINT NULL,
 criado_em DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT fk_mensagem_canal FOREIGN KEY(canal_mensagem_id) REFERENCES dominio.tb_canal_mensagem(canal_mensagem_id),
 CONSTRAINT fk_mensagem_usuario FOREIGN KEY(criado_por_usuario_id) REFERENCES transacional.tb_usuario(usuario_id)
);
CREATE TABLE transacional.tb_destinatario_mensagem(
 destinatario_mensagem_id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
 mensagem_id BIGINT NOT NULL,
 pessoa_id BIGINT NOT NULL,
 identificador_provedor NVARCHAR(200) NULL,
 status_provedor NVARCHAR(50) NULL,
 enviado_em DATETIME2(0) NULL,
 entregue_em DATETIME2(0) NULL,
 falhou_em DATETIME2(0) NULL,
 mensagem_erro NVARCHAR(1000) NULL,
 CONSTRAINT fk_destinatario_mensagem FOREIGN KEY(mensagem_id) REFERENCES transacional.tb_mensagem(mensagem_id),
 CONSTRAINT fk_destinatario_pessoa FOREIGN KEY(pessoa_id) REFERENCES transacional.tb_pessoa(pessoa_id),
 CONSTRAINT uq_destinatario_mensagem UNIQUE(mensagem_id,pessoa_id)
);
CREATE INDEX ix_tb_destinatario_pessoa ON transacional.tb_destinatario_mensagem(pessoa_id,destinatario_mensagem_id DESC);
GO

/* ========================= VIEWS OPERACIONAIS ADICIONAIS ========================= */
CREATE VIEW transacional.vw_agenda_aulas_praticas AS
SELECT ag.agendamento_id,ag.aluno_id,a.numero_matricula,p.nome_completo,ag.data_aula_pratica,
 e.nome especialidade,te.hora_inicio,te.hora_termino,s.codigo status,s.ocupa_vaga,
 cc.checkin_em,cc.checkout_em,cc.minutos_contabilizados
FROM transacional.tb_agendamento ag
JOIN transacional.tb_aluno a ON a.aluno_id=ag.aluno_id
JOIN transacional.tb_pessoa p ON p.pessoa_id=a.pessoa_id
JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
JOIN dominio.tb_especialidade e ON e.especialidade_id=te.especialidade_id
JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id
LEFT JOIN transacional.tb_checkin_checkout cc ON cc.agendamento_id=ag.agendamento_id;
GO

CREATE VIEW transacional.vw_notas_aluno AS
SELECT n.aluno_id,a.numero_matricula,p.nome_completo,atv.turma_id,atv.atividade_id,atv.nome atividade,n.valor,atv.nota_maxima,n.atualizado_em
FROM transacional.tb_nota n
JOIN transacional.tb_atividade atv ON atv.atividade_id=n.atividade_id
JOIN transacional.tb_aluno a ON a.aluno_id=n.aluno_id
JOIN transacional.tb_pessoa p ON p.pessoa_id=a.pessoa_id;
GO

CREATE VIEW analitico.vw_desempenho_academico AS
SELECT m.turma_id,n.aluno_id,COUNT(n.nota_id) quantidade_notas,
 CAST(AVG(CAST(n.valor AS DECIMAL(10,2))) AS DECIMAL(10,2)) media_notas
FROM transacional.tb_matricula m
JOIN transacional.tb_nota n ON n.aluno_id=m.aluno_id
WHERE m.ativa=1
GROUP BY m.turma_id,n.aluno_id;
GO

CREATE VIEW analitico.vw_ocupacao_aulas_praticas AS
SELECT ag.data_aula_pratica,te.especialidade_id,e.nome especialidade,te.hora_inicio,te.hora_termino,
 COUNT(CASE WHEN s.ocupa_vaga=1 THEN 1 END) vagas_ocupadas,MAX(te.capacidade) capacidade
FROM transacional.tb_agendamento ag
JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
JOIN dominio.tb_especialidade e ON e.especialidade_id=te.especialidade_id
JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id
GROUP BY ag.data_aula_pratica,te.especialidade_id,e.nome,te.hora_inicio,te.hora_termino;
GO

/* ========================= PROCEDURES OPERACIONAIS ADICIONAIS ========================= */
CREATE OR ALTER PROCEDURE transacional.sp_aprovar_agendamento @agendamento_id BIGINT,@usuario_id BIGINT AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRAN;
 DECLARE @data DATE,@turno INT,@status VARCHAR(20),@cap SMALLINT,@ocupadas INT;
 SELECT @data=ag.data_aula_pratica,@turno=ag.turno_especialidade_id,@status=s.codigo,@cap=te.capacidade
 FROM transacional.tb_agendamento ag WITH(UPDLOCK,HOLDLOCK)
 JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id
 JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
 WHERE ag.agendamento_id=@agendamento_id;
 IF @data IS NULL THROW 50300,'Agendamento não encontrado.',1;
 IF @status<>'PENDENTE' THROW 50301,'Somente solicitações pendentes podem ser aprovadas.',1;
 SELECT @ocupadas=COUNT(*) FROM transacional.tb_agendamento a WITH(UPDLOCK,HOLDLOCK)
 JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=a.status_agendamento_id
 WHERE a.data_aula_pratica=@data AND a.turno_especialidade_id=@turno AND s.ocupa_vaga=1 AND a.agendamento_id<>@agendamento_id;
 IF @ocupadas>=@cap THROW 50302,'Período lotado.',1;
 UPDATE transacional.tb_agendamento SET status_agendamento_id=2,aprovado_em=SYSUTCDATETIME(),aprovado_por_usuario_id=@usuario_id,atualizado_em=SYSUTCDATETIME() WHERE agendamento_id=@agendamento_id;
 INSERT analitico.tb_evento_integracao(tipo_evento,entidade,entidade_id) VALUES('AGENDAMENTO_APROVADO','tb_agendamento',@agendamento_id);
 COMMIT;
END;
GO

CREATE OR ALTER PROCEDURE transacional.sp_cancelar_agendamento @agendamento_id BIGINT,@aluno_id BIGINT AS
BEGIN
 SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRAN;
 DECLARE @data DATE,@inicio TIME,@dono BIGINT;
 SELECT @data=ag.data_aula_pratica,@inicio=te.hora_inicio,@dono=ag.aluno_id
 FROM transacional.tb_agendamento ag WITH(UPDLOCK,HOLDLOCK)
 JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
 WHERE ag.agendamento_id=@agendamento_id;
 IF @data IS NULL THROW 50310,'Agendamento não encontrado.',1;
 IF @dono<>@aluno_id THROW 50311,'O aluno só pode cancelar o próprio agendamento.',1;
 DECLARE @inicio_dt DATETIME2=DATEADD(SECOND,DATEDIFF(SECOND,CAST('00:00' AS TIME),@inicio),CAST(@data AS DATETIME2));
 DECLARE @antecedencia INT=CASE WHEN DATEDIFF(MINUTE,SYSDATETIME(),@inicio_dt)<0 THEN 0 ELSE DATEDIFF(MINUTE,SYSDATETIME(),@inicio_dt) END;
 UPDATE transacional.tb_agendamento SET status_agendamento_id=3,cancelado_em=SYSUTCDATETIME(),antecedencia_cancelamento_minutos=@antecedencia,atualizado_em=SYSUTCDATETIME() WHERE agendamento_id=@agendamento_id;
 COMMIT;
END;
GO

CREATE OR ALTER PROCEDURE transacional.sp_remover_agendamento @agendamento_id BIGINT,@usuario_id BIGINT AS
BEGIN
 SET NOCOUNT ON;
 UPDATE transacional.tb_agendamento SET status_agendamento_id=4,removido_em=SYSUTCDATETIME(),removido_por_usuario_id=@usuario_id,atualizado_em=SYSUTCDATETIME()
 WHERE agendamento_id=@agendamento_id;
 IF @@ROWCOUNT=0 THROW 50320,'Agendamento não encontrado.',1;
END;
GO


/* Ajuste: justificativa de faltas e edição de chamadas */
IF COL_LENGTH('transacional.tb_presenca_aula','justificativa_falta') IS NULL
    ALTER TABLE transacional.tb_presenca_aula ADD justificativa_falta NVARCHAR(1000) NULL;
GO
