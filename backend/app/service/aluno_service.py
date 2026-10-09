from sqlalchemy import text
from sqlalchemy.orm import Session

def notas(sessao: Session, aluno_id: int):
    sql=text("""SELECT atividade,valor,nota_maxima,atualizado_em
                FROM transacional.vw_notas_aluno
                WHERE aluno_id=:a ORDER BY atualizado_em DESC""")
    return [dict(r._mapping) for r in sessao.execute(sql,{"a":aluno_id})]

def materiais(sessao: Session, aluno_id: int):
    sql=text("""SELECT mat.material_id,mat.titulo,mat.url_recurso,mat.ordem
                FROM transacional.tb_material mat
                JOIN transacional.tb_matricula m ON m.turma_id=mat.turma_id AND m.ativa=1
                WHERE m.aluno_id=:a AND mat.ativo=1
                ORDER BY mat.ordem,mat.material_id""")
    return [dict(r._mapping) for r in sessao.execute(sql,{"a":aluno_id})]

def frequencia(sessao: Session, aluno_id: int):
    aula=sessao.execute(text("""SELECT TOP 1 * FROM analitico.vw_frequencia_aulas WHERE aluno_id=:a"""),{"a":aluno_id}).mappings().first()
    pratica=sessao.execute(text("""SELECT TOP 1 * FROM analitico.vw_progresso_aulas_praticas WHERE aluno_id=:a"""),{"a":aluno_id}).mappings().first()
    return {"aulas":dict(aula) if aula else None,"aulas_praticas":dict(pratica) if pratica else None}
