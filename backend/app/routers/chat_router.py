from fastapi import APIRouter, Depends

from ..services.interfaces.search_interface import ISearchService
from ..services.interfaces.llm_interface import ILLMService
from ..services.document_service import DocumentService
from ..schemas.chat_schema import ChatRequest, ChatResponse
from ..dependencies import get_document_service, get_search_service, get_llm_service

router = APIRouter()


@router.post("/", response_model=ChatResponse)
def ask_question(
    payload: ChatRequest,
    doc_service: DocumentService = Depends(get_document_service),
    search_service: ISearchService = Depends(get_search_service),
    llm_service: ILLMService = Depends(get_llm_service)
):
    if not payload.query.strip():
        return ChatResponse(answer="Query cannot be empty.", citations=[])

    pages = doc_service.get_ready_pages(payload.doc_ids)
    if not pages:
        return ChatResponse(
            answer="No documents are ready. Please upload some PDFs first.",
            citations=[]
        )

    relevant_pages = search_service.search(pages, payload.query, top_n=8)
    result = llm_service.ask_grounded(payload.query, relevant_pages)
    return ChatResponse(**result)
