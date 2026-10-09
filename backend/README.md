# Backend FastAPI — Clinvet Cursos

Arquitetura: **Main -> Service -> Model -> BD**.

## Estrutura
- `app/main.py`: endpoints HTTP.
- `app/service/`: regras de aplicação/orquestração.
- `app/model/modelos.py`: modelos ORM.
- `app/bd/conexao.py`: conexão SQL Server.
- `bd/ClinvetCursos.sql`: DDL, domínios, views analíticas e procedures.

## Rodar localmente
1. Instale o ODBC Driver 18 for SQL Server.
2. Execute `bd/ClinvetCursos.sql`.
3. Copie `.env.example` para `.env` e ajuste credenciais.
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload --app-dir backend`

## Regras críticas no banco
- bloqueio de duas aulas práticas no mesmo dia/horário, inclusive entre especialidades;
- limite mensal padrão de 40h;
- limite excepcional modelado até 50h;
- capacidade por especialidade/período;
- check-in e check-out;
- contabilização de horas apenas após checkout;
- histórico de pré-matrícula e responsável.

## Analítico futuro
O schema `analitico` contém views e uma outbox (`tb_evento_integracao`) para carga incremental em um Data Lake/S3/Azure Data Lake. O OLTP não deve virar o Data Warehouse.
