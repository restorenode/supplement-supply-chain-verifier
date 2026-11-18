from fastapi import APIRouter, Depends

from app.core.security import require_api_key

router = APIRouter()


@router.get("/auth/check", dependencies=[Depends(require_api_key)])
def check_api_key() -> dict:
    """Lets the admin console confirm an API key is valid before running the pipeline."""
    return {"ok": True}
