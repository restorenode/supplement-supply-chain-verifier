from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.errors import error_response

router = APIRouter()


@router.get("/batches/{batchId}/verify")
def verify_batch(batchId: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=error_response("NOT_IMPLEMENTED", "Verify not implemented"),
    )
