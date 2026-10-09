from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.bd.conexao import obter_sessao, config
from app.schemas.entradas import PreMatriculaEntrada, AssumirPreMatriculaEntrada, ContatoEntrada, TurmaEntrada, AgendamentoEntrada, CredencialKioskEntrada, ConverterPreMatriculaEntrada, LoginAlunoEntrada, UsuarioOperacaoEntrada, CancelarAgendamentoEntrada, AulaEntrada, ChamadaEntrada, AvaliacaoEntrada
from app.service import crm_service, turma_service, agendamento_service, kiosk_service, seguranca_service, aluno_service, coordenacao_service, aula_service, avaliacao_service

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


@app.post("/api/login/aluno")
def login_aluno(dados:LoginAlunoEntrada,sessao:Session=Depends(obter_sessao)):
    retorno=seguranca_service.autenticar_aluno(sessao,dados.matricula,dados.senha)
    if not retorno: raise HTTPException(401,"Matrícula ou senha inválida.")
    return retorno

@app.get("/api/alunos/{aluno_id}/notas")
def notas_aluno(aluno_id:int,sessao:Session=Depends(obter_sessao)):
    return aluno_service.notas(sessao,aluno_id)

@app.get("/api/alunos/{aluno_id}/materiais")
def materiais_aluno(aluno_id:int,sessao:Session=Depends(obter_sessao)):
    return aluno_service.materiais(sessao,aluno_id)

@app.get("/api/alunos/{aluno_id}/frequencia")
def frequencia_aluno(aluno_id:int,sessao:Session=Depends(obter_sessao)):
    return aluno_service.frequencia(sessao,aluno_id)

@app.post("/api/agendamentos/{agendamento_id}/aprovar")
def aprovar_agendamento(agendamento_id:int,dados:UsuarioOperacaoEntrada,sessao:Session=Depends(obter_sessao)):
    try:return coordenacao_service.aprovar_agendamento(sessao,agendamento_id,dados.usuario_id)
    except Exception as e:sessao.rollback();raise HTTPException(409,str(e))

@app.post("/api/agendamentos/{agendamento_id}/remover")
def remover_agendamento(agendamento_id:int,dados:UsuarioOperacaoEntrada,sessao:Session=Depends(obter_sessao)):
    try:return coordenacao_service.remover_agendamento(sessao,agendamento_id,dados.usuario_id)
    except Exception as e:sessao.rollback();raise HTTPException(409,str(e))

@app.post("/api/agendamentos/{agendamento_id}/cancelar")
def cancelar_agendamento(agendamento_id:int,dados:CancelarAgendamentoEntrada,sessao:Session=Depends(obter_sessao)):
    try:return coordenacao_service.cancelar_agendamento(sessao,agendamento_id,dados.aluno_id)
    except Exception as e:sessao.rollback();raise HTTPException(409,str(e))

@app.get("/api/turmas/{turma_id}/frequencia")
def frequencia_turma(turma_id:int,sessao:Session=Depends(obter_sessao)):
    return coordenacao_service.frequencia_turma(sessao,turma_id)

@app.get("/api/painel/hoje")
def painel_hoje(sessao:Session=Depends(obter_sessao)):
    return coordenacao_service.painel_dia(sessao)

@app.post("/api/aulas",status_code=201)
def criar_aula(dados:AulaEntrada,sessao:Session=Depends(obter_sessao)):
    return aula_service.criar_aula(sessao,dados.turma_id,dados.titulo,dados.data_aula,dados.professor_usuario_id)

@app.get("/api/aulas/{aula_id}/chamada")
def carregar_chamada(aula_id:int,sessao:Session=Depends(obter_sessao)):
    return aula_service.carregar_chamada(sessao,aula_id)

@app.put("/api/aulas/{aula_id}/chamada")
def salvar_chamada(aula_id:int,dados:ChamadaEntrada,sessao:Session=Depends(obter_sessao)):
    return aula_service.salvar_chamada(sessao,aula_id,[r.model_dump() for r in dados.registros],dados.usuario_id)

@app.post("/api/avaliacoes",status_code=201)
def registrar_avaliacao(dados:AvaliacaoEntrada,sessao:Session=Depends(obter_sessao)):
    try:return avaliacao_service.registrar(sessao,dados.agendamento_id,dados.nome_avaliador,dados.funcao_avaliador,dados.tipo,dados.comentario,dados.notas)
    except Exception as e:sessao.rollback();raise HTTPException(400,str(e))

@app.get("/api/avaliacoes")
def listar_avaliacoes(sessao:Session=Depends(obter_sessao)):
    return avaliacao_service.listar(sessao)
