from datetime import datetime
from sqlalchemy import select, text
from sqlalchemy.orm import Session
from app.model.modelos import Pessoa, PreMatricula
from app.schemas.entradas import PreMatriculaEntrada, ContatoEntrada

def criar_pre_matricula(sessao: Session, dados: PreMatriculaEntrada):
    agora=datetime.utcnow()
    pessoa = Pessoa(nome_completo=dados.nome_completo,email=str(dados.email),telefone_celular=dados.telefone_celular,criado_em=agora,atualizado_em=agora)
    sessao.add(pessoa); sessao.flush()
    pre = PreMatricula(
        pessoa_id=pessoa.pessoa_id,curso_id=dados.curso_id,status_pre_matricula_id=1,
        mensagem=dados.mensagem,origem=dados.origem,utm_source=dados.utm_source,
        utm_medium=dados.utm_medium,utm_campaign=dados.utm_campaign,criado_em=agora
    )
    sessao.add(pre); sessao.commit(); sessao.refresh(pre)
    return {"pre_matricula_id": pre.pre_matricula_id}

def listar_pre_matriculas(sessao: Session):
    sql=text("""SELECT pm.pre_matricula_id,p.nome_completo,p.email,p.telefone_celular,s.codigo status,
               pm.responsavel_usuario_id,pm.proximo_followup_em,pm.ultimo_contato_em,pm.criado_em
               FROM transacional.tb_pre_matricula pm
               JOIN transacional.tb_pessoa p ON p.pessoa_id=pm.pessoa_id
               JOIN dominio.tb_status_pre_matricula s ON s.status_pre_matricula_id=pm.status_pre_matricula_id
               ORDER BY pm.criado_em DESC""")
    return [dict(r._mapping) for r in sessao.execute(sql)]

def assumir(sessao: Session, pre_matricula_id: int, usuario_id: int):
    sessao.execute(text("EXEC transacional.sp_assumir_pre_matricula :p,:u"),{"p":pre_matricula_id,"u":usuario_id})
    sessao.commit()
    return {"ok": True}

def registrar_contato(sessao: Session, pre_matricula_id: int, dados: ContatoEntrada):
    sessao.execute(text("""EXEC transacional.sp_registrar_contato
        @pre_matricula_id=:p,@usuario_id=:u,@canal_contato_id=:c,@resultado_contato_id=:r,
        @observacao=:o,@proximo_followup_em=:f"""),
        {"p":pre_matricula_id,"u":dados.usuario_id,"c":dados.canal_contato_id,
         "r":dados.resultado_contato_id,"o":dados.observacao,"f":dados.proximo_followup_em})
    sessao.commit()
    return {"ok": True}


def converter_em_matricula(sessao: Session, pre_matricula_id: int, dados):
    from app.service.seguranca_service import gerar_hash
    hash_senha=gerar_hash(dados.senha_temporaria)
    row=sessao.execute(text("""EXEC transacional.sp_converter_pre_matricula
        @pre_matricula_id=:p,@turma_id=:t,@usuario_id=:u,@hash_senha=:h,@algoritmo_hash=:a,
        @nome_completo=:n,@email=:e,@telefone_celular=:tel,@data_nascimento=:dn,@foto_url=:foto"""),
        {"p":pre_matricula_id,"t":dados.turma_id,"u":dados.usuario_id,"h":hash_senha,"a":"BCRYPT",
         "n":dados.nome_completo,"e":str(dados.email) if dados.email else None,"tel":dados.telefone_celular,
         "dn":dados.data_nascimento,"foto":dados.foto_url}).mappings().first()
    sessao.commit()
    return dict(row) if row else {"ok":True}

def alterar_status(sessao: Session, pre_matricula_id: int, dados):
    sessao.execute(text("""EXEC transacional.sp_alterar_status_pre_matricula
        @pre_matricula_id=:p,@codigo_status=:s,@usuario_id=:u,@observacao=:o"""),
        {"p":pre_matricula_id,"s":dados.codigo_status,"u":dados.usuario_id,"o":dados.observacao})
    sessao.commit()
    return {"ok":True}
