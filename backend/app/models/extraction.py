from datetime import datetime

from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Extraction(Base):
    __tablename__ = "extractions"

    batch_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    extracted_fields: Mapped[dict] = mapped_column(JSON, nullable=False)
    model_info: Mapped[dict] = mapped_column(JSON, nullable=False)
    extracted_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    document_fingerprint: Mapped[str] = mapped_column(String(66), nullable=False)
