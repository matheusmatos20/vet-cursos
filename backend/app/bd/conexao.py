from urllib.parse import quote_plus
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from pydantic_settings import BaseSettings, SettingsConfigDict

class Configuracoes(BaseSettings):
    app_nome: str = "Clinvet Cursos API"
    ambiente: str = "desenvolvimento"
    sqlserver_host: str
    sqlserver_port: int = 1433
    sqlserver_database: str
    sqlserver_user: str
    sqlserver_password: str
    sqlserver_driver: str = "ODBC Driver 18 for SQL Server"
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiracao_minutos: int = 360
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

config = Configuracoes()

odbc = quote_plus(
    f"DRIVER={{{config.sqlserver_driver}}};"
    f"SERVER={config.sqlserver_host},{config.sqlserver_port};"
    f"DATABASE={config.sqlserver_database};"
    f"UID={config.sqlserver_user};PWD={config.sqlserver_password};"
    "Encrypt=yes;TrustServerCertificate=yes;"
)

engine = create_engine(
    f"mssql+pyodbc:///?odbc_connect={odbc}",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    future=True,
)

SessaoLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

def obter_sessao():
    sessao = SessaoLocal()
    try:
        yield sessao
    finally:
        sessao.close()
