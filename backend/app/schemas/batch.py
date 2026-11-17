from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.batch import BatchStatus

# Batch IDs appear in URL paths, so keep them to URL-safe characters.
BATCH_ID_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._-]*$"


class BatchCreate(BaseModel):
    batch_id: str = Field(..., alias="batchId", min_length=1, max_length=64, pattern=BATCH_ID_PATTERN)
    product_name: str = Field(..., alias="productName", min_length=1, max_length=255)
    supplement_type: str = Field(..., alias="supplementType", min_length=1, max_length=255)
    manufacturer: str = Field(..., min_length=1, max_length=255)
    production_date: date = Field(..., alias="productionDate")
    expires_date: Optional[date] = Field(default=None, alias="expiresDate")

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)

    @model_validator(mode="after")
    def _check_dates(self) -> "BatchCreate":
        if self.expires_date and self.expires_date < self.production_date:
            raise ValueError("expiresDate must be on or after productionDate")
        return self


class Batch(BaseModel):
    batch_id: str = Field(..., alias="batchId")
    product_name: str = Field(..., alias="productName")
    supplement_type: str = Field(..., alias="supplementType")
    manufacturer: str
    production_date: date = Field(..., alias="productionDate")
    expires_date: Optional[date] = Field(default=None, alias="expiresDate")
    status: BatchStatus

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
