from collections.abc import Generator

from sqlalchemy.orm import Session

from app.db import session


def get_db() -> Generator[Session, None, None]:
    db = session.SessionLocal()
    try:
        yield db
    finally:
        db.close()
