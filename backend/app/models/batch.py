import enum
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, String
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
    chain: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tx_hash: Mapped[str | None] = mapped_column(String(66), nullable=True)
    publisher_address: Mapped[str | None] = mapped_column(String(42), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
