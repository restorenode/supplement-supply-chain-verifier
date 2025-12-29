import enum
from datetime import date

from sqlalchemy import Date, Enum, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class BatchStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    PUBLISHED = "PUBLISHED"


class Batch(Base):
    __tablename__ = "batches"

    batch_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    supplement_type: Mapped[str] = mapped_column(String(255), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=False)
    production_date: Mapped[date] = mapped_column(Date, nullable=False)
    expires_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[BatchStatus] = mapped_column(Enum(BatchStatus), nullable=False, default=BatchStatus.DRAFT)
