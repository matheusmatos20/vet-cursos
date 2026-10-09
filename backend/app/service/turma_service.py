from sqlalchemy import select
from sqlalchemy.orm import Session
from app.model.modelos import Turma
from app.schemas.entradas import TurmaEntrada

def listar(sessao: Session):
    return sessao.scalars(select(Turma).order_by(Turma.data_inicio.desc())).all()

def criar(sessao: Session, dados: TurmaEntrada):
    turma=Turma(**dados.model_dump())
    sessao.add(turma);sessao.commit();sessao.refresh(turma)
    return turma
