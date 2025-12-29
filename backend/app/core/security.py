from fastapi import Header

from app.core.config import settings
from app.core.errors import raise_api_error


def require_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    if not x_api_key or x_api_key != settings.admin_api_key:
        raise_api_error(401, "UNAUTHORIZED", "Missing or invalid X-API-Key header")
