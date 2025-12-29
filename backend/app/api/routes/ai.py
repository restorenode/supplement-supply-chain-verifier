from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.errors import error_response
from app.core.security import require_api_key

router = APIRouter()


@router.post("/batches/{batchId}/extract", dependencies=[Depends(require_api_key)])
def extract_data(batchId: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=error_response("NOT_IMPLEMENTED", "Extraction not implemented"),
    )
