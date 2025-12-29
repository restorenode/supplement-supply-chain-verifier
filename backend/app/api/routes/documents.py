from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.errors import error_response
from app.core.security import require_api_key

router = APIRouter()


@router.post("/batches/{batchId}/documents", dependencies=[Depends(require_api_key)])
def upload_document(batchId: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=error_response("NOT_IMPLEMENTED", "Upload document not implemented"),
    )
