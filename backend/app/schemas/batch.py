from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.batch import BatchStatus


class BatchCreate(BaseModel):
    batch_id: str = Field(..., alias="batchId")
    product_name: str = Field(..., alias="productName")
    supplement_type: str = Field(..., alias="supplementType")
    manufacturer: str
    production_date: date = Field(..., alias="productionDate")
    expires_date: Optional[date] = Field(default=None, alias="expiresDate")

    model_config = ConfigDict(populate_by_name=True)


class Batch(BaseModel):
    batch_id: str = Field(..., alias="batchId")
    product_name: str = Field(..., alias="productName")
    supplement_type: str = Field(..., alias="supplementType")
    manufacturer: str
    production_date: date = Field(..., alias="productionDate")
    expires_date: Optional[date] = Field(default=None, alias="expiresDate")
    status: BatchStatus

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
