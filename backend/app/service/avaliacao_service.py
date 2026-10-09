from sqlalchemy import text
from sqlalchemy.orm import Session

def registrar(sessao: Session, agendamento_id: int, nome_avaliador: str, funcao_avaliador: str | None, tipo: str, comentario: str | None, notas: dict[int,int]):
    row=sessao.execute(text("""INSERT INTO transacional.tb_avaliacao(agendamento_id,nome_avaliador,funcao_avaliador,tipo,comentario)
                              OUTPUT INSERTED.avaliacao_id VALUES(:a,:n,:f,:t,:c)"""),
                       {"a":agendamento_id,"n":nome_avaliador,"f":funcao_avaliador,"t":tipo,"c":comentario}).mappings().first()
    avaliacao_id=row["avaliacao_id"]
    for criterio_id,nota in notas.items():
        sessao.execute(text("""INSERT INTO transacional.tb_nota_criterio_avaliacao(avaliacao_id,criterio_avaliacao_id,nota)
                              VALUES(:a,:c,:n)"""),{"a":avaliacao_id,"c":criterio_id,"n":nota})
    sessao.commit(); return {"avaliacao_id":avaliacao_id}

def listar(sessao: Session):
    sql=text("""SELECT av.avaliacao_id,av.agendamento_id,av.nome_avaliador,av.funcao_avaliador,av.tipo,av.comentario,av.criado_em,
               p.nome_completo aluno,e.nome especialidade,CAST(AVG(CAST(n.nota AS DECIMAL(10,2))) AS DECIMAL(10,2)) media
               FROM transacional.tb_avaliacao av
               JOIN transacional.tb_agendamento ag ON ag.agendamento_id=av.agendamento_id
               JOIN transacional.tb_aluno a ON a.aluno_id=ag.aluno_id
               JOIN transacional.tb_pessoa p ON p.pessoa_id=a.pessoa_id
               JOIN transacional.tb_turno_especialidade te ON te.turno_especialidade_id=ag.turno_especialidade_id
               JOIN dominio.tb_especialidade e ON e.especialidade_id=te.especialidade_id
               LEFT JOIN transacional.tb_nota_criterio_avaliacao n ON n.avaliacao_id=av.avaliacao_id
               GROUP BY av.avaliacao_id,av.agendamento_id,av.nome_avaliador,av.funcao_avaliador,av.tipo,av.comentario,av.criado_em,p.nome_completo,e.nome
               ORDER BY av.criado_em DESC""")
    return [dict(r._mapping) for r in sessao.execute(sql)]
