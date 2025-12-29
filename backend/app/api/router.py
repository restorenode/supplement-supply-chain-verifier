from fastapi import APIRouter

from app.api.routes import ai, batches, chain, documents, health, verify

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(batches.router, tags=["batches"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(ai.router, tags=["ai"])
api_router.include_router(chain.router, tags=["chain"])
api_router.include_router(verify.router, tags=["verify"])
