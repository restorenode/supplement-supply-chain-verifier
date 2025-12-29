from app import models  # noqa: F401
from app.db import session
from app.db.base import Base


def init_db() -> None:
    Base.metadata.create_all(bind=session.engine)
