from datetime import date, datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.extraction import Analyte


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    MISMATCH = "mismatch"
    UNPUBLISHED = "unpublished"


class VerifiedProduct(BaseModel):
    product_name: str = Field(..., alias="productName")
    manufacturer: str
    supplement_type: str = Field(..., alias="supplementType")
    production_date: date = Field(..., alias="productionDate")
    expires_date: Optional[date] = Field(default=None, alias="expiresDate")

    model_config = ConfigDict(populate_by_name=True)


class VerifiedLabReport(BaseModel):
    lab_name: Optional[str] = Field(default=None, alias="labName")
    report_date: Optional[date] = Field(default=None, alias="reportDate")
    analytes: List[Analyte] = Field(default_factory=list)
    contaminants: List[Analyte] = Field(default_factory=list)
    methods: List[str] = Field(default_factory=list)

    model_config = ConfigDict(populate_by_name=True)


class VerificationResult(BaseModel):
    verified: bool
    status: VerificationStatus
    batch_id: str = Field(..., alias="batchId")
    offchain_hash: Optional[str] = Field(default=None, alias="offchainHash")
    onchain_hash: Optional[str] = Field(default=None, alias="onchainHash")
    tx_hash: Optional[str] = Field(default=None, alias="txHash")
    chain: Optional[str] = None
    published_at: Optional[datetime] = Field(default=None, alias="publishedAt")
    mismatch_reason: Optional[str] = Field(default=None, alias="mismatchReason")
    product: VerifiedProduct
    lab_report: Optional[VerifiedLabReport] = Field(default=None, alias="labReport")

    model_config = ConfigDict(populate_by_name=True)
