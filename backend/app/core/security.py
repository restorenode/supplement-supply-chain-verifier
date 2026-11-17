import hmac

from fastapi import Header

from app.core.config import settings
from app.core.errors import raise_api_error


def require_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    expected = settings.admin_api_key
    # Fail closed when no key is configured, and compare in constant time.
    if not expected or not x_api_key or not hmac.compare_digest(x_api_key.encode(), expected.encode()):
        raise_api_error(401, "UNAUTHORIZED", "Missing or invalid X-API-Key header")
