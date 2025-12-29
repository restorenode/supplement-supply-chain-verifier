from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import http_exception_handler, unhandled_exception_handler, validation_exception_handler
from app.db.init_db import init_db

app = FastAPI(title="Ethical Supplement Supply Chain Verifier API")
app.include_router(api_router)

app.add_exception_handler(Exception, unhandled_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)


@app.on_event("startup")
def on_startup() -> None:
    if settings.env != "prod":
        init_db()
