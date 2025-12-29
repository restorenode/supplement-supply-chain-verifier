from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Document(BaseModel):
    document_id: str = Field(..., alias="documentId")
    batch_id: str = Field(..., alias="batchId")
    filename: str
    content_type: str = Field(..., alias="contentType")
    uploaded_at: datetime = Field(..., alias="uploadedAt")
    storage_url: Optional[str] = Field(default=None, alias="storageUrl")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
