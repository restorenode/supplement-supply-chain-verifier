import logging
from typing import Any, Optional

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def error_response(code: str, message: str, details: Optional[Any] = None) -> dict:
    payload: dict = {"error": {"code": code, "message": message}}
    if details is not None:
        payload["error"]["details"] = details
    return payload


def raise_api_error(status_code: int, code: str, message: str, details: Optional[Any] = None) -> None:
    raise HTTPException(status_code=status_code, detail=error_response(code, message, details))


def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    status_map = {
        400: "INVALID_REQUEST",
        401: "UNAUTHORIZED",
        404: "NOT_FOUND",
        409: "CONFLICT",
        413: "PAYLOAD_TOO_LARGE",
        415: "UNSUPPORTED_MEDIA_TYPE",
        501: "NOT_IMPLEMENTED",
    }
    code = status_map.get(exc.status_code, "HTTP_ERROR")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return JSONResponse(status_code=exc.status_code, content=error_response(code, message))


def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        # Only expose location/message/type: raw "input"/"ctx" may be large or not JSON-serializable.
        content=error_response(
            "INVALID_REQUEST",
            "Validation error",
            [{key: err[key] for key in ("loc", "msg", "type") if key in err} for err in exc.errors()],
        ),
    )


def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url.path, exc_info=exc)
    return JSONResponse(
        status_code=500,
        content=error_response("INTERNAL_ERROR", "An internal error occurred"),
    )
