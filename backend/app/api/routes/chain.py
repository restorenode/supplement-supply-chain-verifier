from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.core.errors import error_response
from app.core.security import require_api_key

router = APIRouter()


@router.get("/batches/{batchId}/attestation", dependencies=[Depends(require_api_key)])
def get_attestation(batchId: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=error_response("NOT_IMPLEMENTED", "Attestation not implemented"),
    )


@router.post("/batches/{batchId}/publish", dependencies=[Depends(require_api_key)])
def publish_attestation(batchId: str) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content=error_response("NOT_IMPLEMENTED", "Publish not implemented"),
    )
