from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.bd.conexao import obter_sessao, config
from app.schemas.entradas import PreMatriculaEntrada, AssumirPreMatriculaEntrada, ContatoEntrada, TurmaEntrada, AgendamentoEntrada, CredencialKioskEntrada, ConverterPreMatriculaEntrada
from app.service import crm_service, turma_service, agendamento_service, kiosk_service, seguranca_service

app=FastAPI(title=config.app_nome,version="0.1.0")

@app.get("/health")
def health():
    return {"status":"ok","servico":config.app_nome}

@app.post("/api/pre-matriculas",status_code=201)
def criar_pre_matricula(dados:PreMatriculaEntrada,sessao:Session=Depends(obter_sessao)):
    return crm_service.criar_pre_matricula(sessao,dados)

@app.get("/api/pre-matriculas")
def listar_pre_matriculas(sessao:Session=Depends(obter_sessao)):
    return crm_service.listar_pre_matriculas(sessao)

@app.post("/api/pre-matriculas/{pre_matricula_id}/assumir")
def assumir_pre_matricula(pre_matricula_id:int,dados:AssumirPreMatriculaEntrada,sessao:Session=Depends(obter_sessao)):
    try:return crm_service.assumir(sessao,pre_matricula_id,dados.usuario_id)
    except Exception as e:sessao.rollback();raise HTTPException(409,str(e))

@app.post("/api/pre-matriculas/{pre_matricula_id}/contatos")
def registrar_contato(pre_matricula_id:int,dados:ContatoEntrada,sessao:Session=Depends(obter_sessao)):
    try:return crm_service.registrar_contato(sessao,pre_matricula_id,dados)
    except Exception as e:sessao.rollback();raise HTTPException(409,str(e))

@app.post("/api/pre-matriculas/{pre_matricula_id}/converter")
def converter_pre_matricula(pre_matricula_id:int,dados:ConverterPreMatriculaEntrada,sessao:Session=Depends(obter_sessao)):
    try:return crm_service.converter_em_matricula(sessao,pre_matricula_id,dados.turma_id,dados.usuario_id,dados.senha_temporaria)
    except Exception as e:sessao.rollback();raise HTTPException(409,str(e))

@app.get("/api/turmas")
def listar_turmas(sessao:Session=Depends(obter_sessao)):
    return turma_service.listar(sessao)

@app.post("/api/turmas",status_code=201)
def criar_turma(dados:TurmaEntrada,sessao:Session=Depends(obter_sessao)):
    return turma_service.criar(sessao,dados)

@app.post("/api/agendamentos",status_code=201)
def solicitar_agendamento(dados:AgendamentoEntrada,sessao:Session=Depends(obter_sessao)):
    try:return agendamento_service.solicitar(sessao,dados.aluno_id,dados.turno_especialidade_id,dados.data)
    except Exception as e:sessao.rollback();raise HTTPException(409,str(e))

@app.get("/api/alunos/{aluno_id}/agendamentos")
def agenda_aluno(aluno_id:int,sessao:Session=Depends(obter_sessao)):
    return agendamento_service.agenda_aluno(sessao,aluno_id)

@app.post("/api/kiosk/checkin")
def checkin(dados:CredencialKioskEntrada,sessao:Session=Depends(obter_sessao)):
    try:return kiosk_service.checkin(sessao,dados.matricula,dados.senha)
    except ValueError as e:sessao.rollback();raise HTTPException(400,str(e))

@app.post("/api/kiosk/checkout")
def checkout(dados:CredencialKioskEntrada,sessao:Session=Depends(obter_sessao)):
    try:return kiosk_service.checkout(sessao,dados.matricula,dados.senha)
    except ValueError as e:sessao.rollback();raise HTTPException(400,str(e))
