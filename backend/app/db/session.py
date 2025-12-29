from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = None
SessionLocal = None


def init_engine() -> None:
    database_url = settings.database_url
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    new_engine = create_engine(database_url, connect_args=connect_args)

    global engine, SessionLocal
    engine = new_engine
    SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


init_engine()
