from datetime import date, datetime, time
from decimal import Decimal
from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Integer, Numeric, SmallInteger, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.bd.conexao import Base

class Pessoa(Base):
    __tablename__ = "tb_pessoa"
    __table_args__ = {"schema": "transacional"}
    pessoa_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    nome_completo: Mapped[str] = mapped_column(String(180))
    email: Mapped[str | None] = mapped_column(String(254))
    telefone_celular: Mapped[str | None] = mapped_column(String(25))
    criado_em: Mapped[datetime] = mapped_column(DateTime)

class Usuario(Base):
    __tablename__ = "tb_usuario"
    __table_args__ = {"schema": "transacional"}
    usuario_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    pessoa_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_pessoa.pessoa_id"))
    login: Mapped[str] = mapped_column(String(120))
    hash_senha: Mapped[str] = mapped_column(String(255))
    algoritmo_hash: Mapped[str] = mapped_column(String(30))
    ativo: Mapped[bool] = mapped_column(Boolean)

class Curso(Base):
    __tablename__ = "tb_curso"
    __table_args__ = {"schema": "transacional"}
    curso_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    codigo: Mapped[str] = mapped_column(String(40))
    nome: Mapped[str] = mapped_column(String(160))
    minutos_minimos_aulas_praticas: Mapped[int] = mapped_column(Integer)
    minutos_maximos_aulas_praticas: Mapped[int] = mapped_column(Integer)
    limite_minutos_mes_padrao: Mapped[int] = mapped_column(Integer)
    limite_minutos_mes_maximo: Mapped[int] = mapped_column(Integer)

class Turma(Base):
    __tablename__ = "tb_turma"
    __table_args__ = {"schema": "transacional"}
    turma_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    curso_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_curso.curso_id"))
    codigo: Mapped[str] = mapped_column(String(40))
    nome: Mapped[str] = mapped_column(String(160))
    data_inicio: Mapped[date] = mapped_column(Date)
    data_termino: Mapped[date] = mapped_column(Date)
    status_turma_id: Mapped[int] = mapped_column(SmallInteger)

class PreMatricula(Base):
    __tablename__ = "tb_pre_matricula"
    __table_args__ = {"schema": "transacional"}
    pre_matricula_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    pessoa_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_pessoa.pessoa_id"))
    curso_id: Mapped[int | None] = mapped_column(ForeignKey("transacional.tb_curso.curso_id"))
    status_pre_matricula_id: Mapped[int] = mapped_column(SmallInteger)
    responsavel_usuario_id: Mapped[int | None] = mapped_column(BigInteger)
    mensagem: Mapped[str | None] = mapped_column(Text)
    proximo_followup_em: Mapped[datetime | None] = mapped_column(DateTime)
    ultimo_contato_em: Mapped[datetime | None] = mapped_column(DateTime)
    criado_em: Mapped[datetime] = mapped_column(DateTime)

class Aluno(Base):
    __tablename__ = "tb_aluno"
    __table_args__ = {"schema": "transacional"}
    aluno_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    pessoa_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_pessoa.pessoa_id"))
    numero_matricula: Mapped[str] = mapped_column(String(20))

class Matricula(Base):
    __tablename__ = "tb_matricula"
    __table_args__ = {"schema": "transacional"}
    matricula_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    aluno_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_aluno.aluno_id"))
    turma_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_turma.turma_id"))
    ativa: Mapped[bool] = mapped_column(Boolean)
    limite_minutos_mes_excecao: Mapped[int | None] = mapped_column(Integer)

class TurnoEspecialidade(Base):
    __tablename__ = "tb_turno_especialidade"
    __table_args__ = {"schema": "transacional"}
    turno_especialidade_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    especialidade_id: Mapped[int] = mapped_column(SmallInteger)
    dia_semana: Mapped[int] = mapped_column(SmallInteger)
    hora_inicio: Mapped[time] = mapped_column(Time)
    hora_termino: Mapped[time] = mapped_column(Time)
    capacidade: Mapped[int] = mapped_column(SmallInteger)
    ativo: Mapped[bool] = mapped_column(Boolean)

class Agendamento(Base):
    __tablename__ = "tb_agendamento"
    __table_args__ = {"schema": "transacional"}
    agendamento_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    aluno_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_aluno.aluno_id"))
    turno_especialidade_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_turno_especialidade.turno_especialidade_id"))
    data_aula_pratica: Mapped[date] = mapped_column(Date)
    status_agendamento_id: Mapped[int] = mapped_column(SmallInteger)
    solicitado_em: Mapped[datetime] = mapped_column(DateTime)

class CheckinCheckout(Base):
    __tablename__ = "tb_checkin_checkout"
    __table_args__ = {"schema": "transacional"}
    checkin_checkout_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    agendamento_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_agendamento.agendamento_id"))
    checkin_em: Mapped[datetime] = mapped_column(DateTime)
    checkout_em: Mapped[datetime | None] = mapped_column(DateTime)
    minutos_contabilizados: Mapped[int | None] = mapped_column(Integer)

class Aula(Base):
    __tablename__ = "tb_aula"
    __table_args__ = {"schema": "transacional"}
    aula_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    turma_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_turma.turma_id"))
    data_aula: Mapped[date] = mapped_column(Date)
    titulo: Mapped[str] = mapped_column(String(180))

class PresencaAula(Base):
    __tablename__ = "tb_presenca_aula"
    __table_args__ = {"schema": "transacional"}
    presenca_aula_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    aula_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_aula.aula_id"))
    aluno_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_aluno.aluno_id"))
    status_presenca_aula_id: Mapped[int] = mapped_column(SmallInteger)

class Atividade(Base):
    __tablename__ = "tb_atividade"
    __table_args__ = {"schema": "transacional"}
    atividade_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    turma_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_turma.turma_id"))
    nome: Mapped[str] = mapped_column(String(180))
    nota_maxima: Mapped[Decimal] = mapped_column(Numeric(6,2))

class Nota(Base):
    __tablename__ = "tb_nota"
    __table_args__ = {"schema": "transacional"}
    nota_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    atividade_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_atividade.atividade_id"))
    aluno_id: Mapped[int] = mapped_column(ForeignKey("transacional.tb_aluno.aluno_id"))
    valor: Mapped[Decimal] = mapped_column(Numeric(6,2))
