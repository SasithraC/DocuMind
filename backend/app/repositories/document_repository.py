from sqlalchemy.orm import Session
from typing import List, Optional

from ..models.document import Document, DocumentPage


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, doc_id: str) -> Optional[Document]:
        return self.db.query(Document).filter(Document.id == doc_id).first()

    def create(self, doc_id: str, filename: str) -> Document:
        doc = Document(id=doc_id, filename=filename, status="queued")
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return doc

    def update_status(self, doc_id: str, status: str, error_message: Optional[str] = None) -> Optional[Document]:
        doc = self.get_by_id(doc_id)
        if doc:
            doc.status = status
            if error_message is not None:
                doc.error_message = error_message
            self.db.commit()
            self.db.refresh(doc)
        return doc

    def add_pages(self, doc_id: str, pages: List[tuple]) -> None:
        for page_num, text in pages:
            self.db.add(DocumentPage(document_id=doc_id, page_number=page_num, content=text))
        self.db.commit()

    def get_all(self) -> List[Document]:
        return self.db.query(Document).order_by(Document.created_at.desc()).all()

    def delete(self, doc_id: str) -> bool:
        doc = self.get_by_id(doc_id)
        if not doc:
            return False
        self.db.delete(doc)
        self.db.commit()
        return True

    def get_ready_pages(self, doc_ids: Optional[List[str]] = None) -> List[DocumentPage]:
        q = self.db.query(DocumentPage).join(Document).filter(Document.status == "ready")
        if doc_ids:
            q = q.filter(Document.id.in_(doc_ids))
        return q.all()
