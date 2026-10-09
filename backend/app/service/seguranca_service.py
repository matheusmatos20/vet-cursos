from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.bd.conexao import config
from app.model.modelos import Usuario, Aluno

_senhas = CryptContext(schemes=["bcrypt"], deprecated="auto")

def gerar_hash(senha: str) -> str:
    return _senhas.hash(senha)

def validar_hash(senha: str, hash_senha: str) -> bool:
    return _senhas.verify(senha, hash_senha)

def autenticar_aluno(sessao: Session, matricula: str, senha: str):
    aluno = sessao.scalar(select(Aluno).where(Aluno.numero_matricula == matricula))
    if not aluno:
        return None
    usuario = sessao.scalar(select(Usuario).where(Usuario.pessoa_id == aluno.pessoa_id, Usuario.ativo == True))
    if not usuario or not validar_hash(senha, usuario.hash_senha):
        return None
    exp = datetime.now(timezone.utc) + timedelta(minutes=config.jwt_expiracao_minutos)
    token = jwt.encode({"sub": str(usuario.usuario_id), "aluno_id": aluno.aluno_id, "exp": exp}, config.jwt_secret, algorithm=config.jwt_algorithm)
    return {"token": token, "aluno_id": aluno.aluno_id, "matricula": aluno.numero_matricula}
