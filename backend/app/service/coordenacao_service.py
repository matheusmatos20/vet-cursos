from sqlalchemy import text
from sqlalchemy.orm import Session

def aprovar_agendamento(sessao: Session, agendamento_id: int, usuario_id: int):
    sessao.execute(text("EXEC transacional.sp_aprovar_agendamento @agendamento_id=:a,@usuario_id=:u"),{"a":agendamento_id,"u":usuario_id})
    sessao.commit(); return {"ok":True}

def remover_agendamento(sessao: Session, agendamento_id: int, usuario_id: int):
    sessao.execute(text("EXEC transacional.sp_remover_agendamento @agendamento_id=:a,@usuario_id=:u"),{"a":agendamento_id,"u":usuario_id})
    sessao.commit(); return {"ok":True}

def cancelar_agendamento(sessao: Session, agendamento_id: int, aluno_id: int):
    sessao.execute(text("EXEC transacional.sp_cancelar_agendamento @agendamento_id=:a,@aluno_id=:u"),{"a":agendamento_id,"u":aluno_id})
    sessao.commit(); return {"ok":True}

def frequencia_turma(sessao: Session, turma_id: int):
    sql=text("""SELECT f.*,p.horas_realizadas,p.percentual_minimo
                FROM analitico.vw_frequencia_aulas f
                LEFT JOIN analitico.vw_progresso_aulas_praticas p ON p.aluno_id=f.aluno_id AND p.turma_id=f.turma_id
                WHERE f.turma_id=:t ORDER BY f.nome_completo""")
    return [dict(r._mapping) for r in sessao.execute(sql,{"t":turma_id})]

def painel_dia(sessao: Session):
    sql=text("""SELECT * FROM transacional.vw_agenda_aulas_praticas
                WHERE data_aula_pratica=CONVERT(date,SYSDATETIME()) AND status IN('PENDENTE','APROVADO')
                ORDER BY hora_inicio,especialidade,nome_completo""")
    return [dict(r._mapping) for r in sessao.execute(sql)]
