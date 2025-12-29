from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class VerificationResult(BaseModel):
    verified: bool
    batch_id: str = Field(..., alias="batchId")
    offchain_hash: str = Field(..., alias="offchainHash")
    onchain_hash: Optional[str] = Field(default=None, alias="onchainHash")
    tx_hash: Optional[str] = Field(default=None, alias="txHash")
    mismatch_reason: Optional[str] = Field(default=None, alias="mismatchReason")

    model_config = ConfigDict(populate_by_name=True)
