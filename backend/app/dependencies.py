from fastapi import Depends
from sqlalchemy.orm import Session

from .database import get_db
from .services.interfaces.pdf_parser_interface import IPDFParser
from .services.interfaces.search_interface import ISearchService
from .services.interfaces.llm_interface import ILLMService
from .services.pdf_parser import PyPDFParser
from .services.search_service import LexicalSearchService
from .services.llm_service import GroqLLMService
from .services.document_service import DocumentService


def get_pdf_parser() -> IPDFParser:
    return PyPDFParser()


def get_search_service() -> ISearchService:
    return LexicalSearchService()


def get_llm_service() -> ILLMService:
    return GroqLLMService()


def get_document_service(db: Session = Depends(get_db)) -> DocumentService:
    return DocumentService(db)
