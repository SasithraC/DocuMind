from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.document import Document, DocumentPage
from ..repositories.document_repository import DocumentRepository


class DocumentService:
    def __init__(self, db: Session):
        self.repository = DocumentRepository(db)

    def get_document(self, doc_id: str) -> Optional[Document]:
        return self.repository.get_by_id(doc_id)

    def create_document(self, doc_id: str, filename: str) -> Document:
        return self.repository.create(doc_id, filename)

    def update_document_status(self, doc_id: str, status: str, error_message: Optional[str] = None) -> Optional[Document]:
        return self.repository.update_status(doc_id, status, error_message)

    def add_document_pages(self, doc_id: str, pages: List[tuple]) -> None:
        self.repository.add_pages(doc_id, pages)

    def get_all_documents(self) -> List[Document]:
        return self.repository.get_all()

    def delete_document(self, doc_id: str) -> bool:
        return self.repository.delete(doc_id)

    def get_ready_pages(self, doc_ids: Optional[List[str]] = None) -> List[DocumentPage]:
        return self.repository.get_ready_pages(doc_ids)
