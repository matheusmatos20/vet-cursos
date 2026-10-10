from datetime import date
from sqlalchemy import text
from sqlalchemy.orm import Session

def criar_aula(sessao: Session, turma_id: int, titulo: str, data_aula: date, professor_usuario_id: int | None=None):
    row=sessao.execute(text("""INSERT INTO transacional.tb_aula(turma_id,professor_usuario_id,data_aula,titulo)
                              OUTPUT INSERTED.aula_id VALUES(:t,:p,:d,:n)"""),
                       {"t":turma_id,"p":professor_usuario_id,"d":data_aula,"n":titulo}).mappings().first()
    sessao.commit(); return dict(row)

def carregar_chamada(sessao: Session, aula_id: int):
    sql=text("""SELECT a.aluno_id,a.numero_matricula,p.nome_completo,
               COALESCE(pa.status_presenca_aula_id,1) status_presenca_aula_id,pa.observacao,pa.justificativa_falta
               FROM transacional.tb_aula au
               JOIN transacional.tb_matricula m ON m.turma_id=au.turma_id AND m.ativa=1
               JOIN transacional.tb_aluno a ON a.aluno_id=m.aluno_id
               JOIN transacional.tb_pessoa p ON p.pessoa_id=a.pessoa_id
               LEFT JOIN transacional.tb_presenca_aula pa ON pa.aula_id=au.aula_id AND pa.aluno_id=a.aluno_id
               WHERE au.aula_id=:a ORDER BY p.nome_completo""")
    return [dict(r._mapping) for r in sessao.execute(sql,{"a":aula_id})]

def salvar_chamada(sessao: Session, aula_id: int, registros: list[dict], usuario_id: int | None=None):
    sql=text("""MERGE transacional.tb_presenca_aula AS alvo
               USING (SELECT :aula aula_id,:aluno aluno_id) origem
               ON alvo.aula_id=origem.aula_id AND alvo.aluno_id=origem.aluno_id
               WHEN MATCHED THEN UPDATE SET status_presenca_aula_id=:status,observacao=:obs,justificativa_falta=:just,registrado_por_usuario_id=:u,atualizado_em=SYSUTCDATETIME()
               WHEN NOT MATCHED THEN INSERT(aula_id,aluno_id,status_presenca_aula_id,observacao,justificativa_falta,registrado_por_usuario_id)
               VALUES(:aula,:aluno,:status,:obs,:just,:u);""")
    for r in registros:
        justificativa=(r.get("justificativa_falta") or "").strip() or None
        sessao.execute(sql,{"aula":aula_id,"aluno":r["aluno_id"],"status":r["status_presenca_aula_id"],"obs":r.get("observacao"),"just":justificativa,"u":usuario_id})
    sessao.commit(); return {"ok":True,"registros":len(registros)}
