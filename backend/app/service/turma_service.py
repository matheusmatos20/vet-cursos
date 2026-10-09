from sqlalchemy import select
from sqlalchemy.orm import Session
from app.model.modelos import Turma
from app.schemas.entradas import TurmaEntrada

def listar(sessao: Session):
    itens=sessao.scalars(select(Turma).order_by(Turma.data_inicio.desc())).all()
    return [{"turma_id":t.turma_id,"curso_id":t.curso_id,"codigo":t.codigo,"nome":t.nome,"data_inicio":t.data_inicio,"data_termino":t.data_termino,"status_turma_id":t.status_turma_id} for t in itens]

def criar(sessao: Session, dados: TurmaEntrada):
    turma=Turma(**dados.model_dump())
    sessao.add(turma);sessao.commit();sessao.refresh(turma)
    return {"turma_id":turma.turma_id,"curso_id":turma.curso_id,"codigo":turma.codigo,"nome":turma.nome,"data_inicio":turma.data_inicio,"data_termino":turma.data_termino,"status_turma_id":turma.status_turma_id}
