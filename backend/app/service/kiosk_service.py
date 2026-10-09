from datetime import date
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.service.seguranca_service import autenticar_aluno

def _agendamento_hoje(sessao: Session, aluno_id: int):
    row=sessao.execute(text("""SELECT TOP 1 ag.agendamento_id
        FROM transacional.tb_agendamento ag
        JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id
        WHERE ag.aluno_id=:a AND ag.data_aula_pratica=CONVERT(date,SYSDATETIME()) AND s.codigo='APROVADO'
        ORDER BY ag.solicitado_em"""),{"a":aluno_id}).mappings().first()
    return row["agendamento_id"] if row else None

def checkin(sessao: Session, matricula: str, senha: str):
    auth=autenticar_aluno(sessao,matricula,senha)
    if not auth: raise ValueError("Matrícula ou senha inválida.")
    ag=_agendamento_hoje(sessao,auth["aluno_id"])
    if not ag: raise ValueError("Não há aula prática aprovada para hoje.")
    sessao.execute(text("EXEC transacional.sp_registrar_checkin @agendamento_id=:a"),{"a":ag});sessao.commit()
    return {"ok":True,"agendamento_id":ag}

def checkout(sessao: Session, matricula: str, senha: str):
    auth=autenticar_aluno(sessao,matricula,senha)
    if not auth: raise ValueError("Matrícula ou senha inválida.")
    ag=_agendamento_hoje(sessao,auth["aluno_id"])
    if not ag: raise ValueError("Não há aula prática aprovada para hoje.")
    sessao.execute(text("EXEC transacional.sp_registrar_checkout @agendamento_id=:a"),{"a":ag});sessao.commit()
    row=sessao.execute(text("SELECT minutos_contabilizados FROM transacional.tb_checkin_checkout WHERE agendamento_id=:a"),{"a":ag}).mappings().first()
    return {"ok":True,"agendamento_id":ag,"horas_realizadas":round((row["minutos_contabilizados"] or 0)/60,2)}
