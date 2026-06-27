from fastapi import APIRouter

from .document_router import router as document_router
from .chat_router import router as chat_router

api_router = APIRouter()
api_router.include_router(document_router, prefix="/api/documents", tags=["Documents"])
api_router.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
