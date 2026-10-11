from datetime import date
from sqlalchemy import text
from sqlalchemy.orm import Session

def solicitar(sessao: Session, aluno_id: int, turno_especialidade_id: int, data: date):
    row=sessao.execute(text("EXEC transacional.sp_solicitar_agendamento @aluno_id=:a,@turno_especialidade_id=:t,@data=:d"),
                       {"a":aluno_id,"t":turno_especialidade_id,"d":data}).mappings().first()
    sessao.commit()
    return dict(row) if row else {"ok": True}

def agenda_aluno(sessao: Session, aluno_id: int):
    sql=text("""SELECT ag.agendamento_id,ag.data_aula_pratica,e.nome especialidade,te.hora_inicio,te.hora_termino,s.codigo status
                FROM transacional.tb_agendamento ag
                JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
                JOIN dominio.tb_especialidade e ON e.especialidade_id=te.especialidade_id
                JOIN dominio.tb_status_agendamento s ON s.status_agendamento_id=ag.status_agendamento_id
                WHERE ag.aluno_id=:a ORDER BY ag.data_aula_pratica DESC""")
    return [dict(r._mapping) for r in sessao.execute(sql,{"a":aluno_id})]
