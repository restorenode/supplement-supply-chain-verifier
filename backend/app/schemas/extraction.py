from __future__ import annotations

from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AnalyteStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    UNKNOWN = "UNKNOWN"


class Potency(BaseModel):
    name: Optional[str] = None
    amount: Optional[str] = None
    unit: Optional[str] = None


class Analyte(BaseModel):
    name: Optional[str] = None
    result: Optional[str] = None
    unit: Optional[str] = None
    limit: Optional[str] = None
    status: AnalyteStatus = AnalyteStatus.UNKNOWN


class ExtractionResult(BaseModel):
    lab_name: Optional[str] = Field(default=None, alias="labName")
    report_date: Optional[date] = Field(default=None, alias="reportDate")
    product_or_sample_name: Optional[str] = Field(default=None, alias="productOrSampleName")
    lot_or_batch_in_report: Optional[str] = Field(default=None, alias="lotOrBatchInReport")
    potency: Optional[Potency] = None
    analytes: List[Analyte] = Field(default_factory=list)
    contaminants: List[Analyte] = Field(default_factory=list)
    methods: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    confidence: float = Field(..., ge=0, le=1)

    model_config = ConfigDict(populate_by_name=True)


class ModelInfo(BaseModel):
    model_name: str = Field(..., alias="modelName")
    version: str

    model_config = ConfigDict(populate_by_name=True)


class ExtractionResponse(BaseModel):
    batch_id: str = Field(..., alias="batchId")
    extracted_fields: ExtractionResult = Field(..., alias="extractedFields")
    extracted_at: datetime = Field(..., alias="extractedAt")
    model_info: ModelInfo = Field(..., alias="modelInfo")

    model_config = ConfigDict(populate_by_name=True)
