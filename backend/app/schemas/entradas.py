from datetime import date, datetime
from pydantic import BaseModel, EmailStr, Field

class PreMatriculaEntrada(BaseModel):
    nome_completo: str = Field(min_length=3,max_length=180)
    email: EmailStr
    telefone_celular: str
    curso_id: int | None = None
    mensagem: str | None = None
    origem: str | None = "SITE"
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None

class AssumirPreMatriculaEntrada(BaseModel):
    usuario_id: int

class ContatoEntrada(BaseModel):
    usuario_id: int
    canal_contato_id: int
    resultado_contato_id: int
    observacao: str | None = None
    proximo_followup_em: datetime | None = None

class TurmaEntrada(BaseModel):
    curso_id: int
    codigo: str
    nome: str
    data_inicio: date
    data_termino: date
    status_turma_id: int = 1

class AgendamentoEntrada(BaseModel):
    aluno_id: int
    turno_especialidade_id: int
    data: date

class CredencialKioskEntrada(BaseModel):
    matricula: str
    senha: str

class ConverterPreMatriculaEntrada(BaseModel):
    turma_id: int
    usuario_id: int
    senha_temporaria: str = Field(min_length=8,max_length=72)

class LoginAlunoEntrada(BaseModel):
    matricula: str
    senha: str

class UsuarioOperacaoEntrada(BaseModel):
    usuario_id: int

class CancelarAgendamentoEntrada(BaseModel):
    aluno_id: int

class AulaEntrada(BaseModel):
    turma_id: int
    titulo: str
    data_aula: date
    professor_usuario_id: int | None = None

class RegistroPresencaEntrada(BaseModel):
    aluno_id: int
    status_presenca_aula_id: int
    observacao: str | None = None

class ChamadaEntrada(BaseModel):
    usuario_id: int | None = None
    registros: list[RegistroPresencaEntrada]

class AvaliacaoEntrada(BaseModel):
    agendamento_id: int
    nome_avaliador: str
    funcao_avaliador: str | None = None
    tipo: str
    comentario: str | None = None
    notas: dict[int,int]
