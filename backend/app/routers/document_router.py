import uuid
import logging
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import SessionLocal
from ..services.interfaces.pdf_parser_interface import IPDFParser
from ..services.document_service import DocumentService
from ..schemas.document_schema import DocumentResponse
from ..dependencies import get_pdf_parser, get_document_service

logger = logging.getLogger(__name__)

router = APIRouter()


def process_pdf_background(doc_id: str, file_content: bytes, db_session_factory, parser: IPDFParser):
    db: Session = db_session_factory()
    doc_service = DocumentService(db)
    try:
        doc = doc_service.get_document(doc_id)
        if not doc:
            logger.error(f"Document {doc_id} not found during processing.")
            return

        doc_service.update_document_status(doc_id, "processing")
        logger.info(f"Processing {doc.filename} ({doc_id})...")

        pages = parser.extract_pages(file_content)
        doc_service.add_document_pages(doc_id, pages)
        doc_service.update_document_status(doc_id, "ready")
        logger.info(f"{doc.filename} is ready.")

    except Exception as e:
        logger.exception(f"Failed to process document {doc_id}")
        db.rollback()
        doc_service.update_document_status(doc_id, "failed", error_message=str(e))
    finally:
        db.close()


@router.post("/upload")
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    doc_service: DocumentService = Depends(get_document_service),
    pdf_parser: IPDFParser = Depends(get_pdf_parser)
):
    uploaded = []
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF.")

        doc_id = str(uuid.uuid4())
        content = await file.read()
        doc = doc_service.create_document(doc_id, file.filename)

        background_tasks.add_task(process_pdf_background, doc_id, content, SessionLocal, pdf_parser)
        uploaded.append(DocumentResponse.model_validate(doc))

    return {"message": "Upload started.", "documents": uploaded}


@router.get("/", response_model=List[DocumentResponse])
def get_documents(doc_service: DocumentService = Depends(get_document_service)):
    return doc_service.get_all_documents()


@router.delete("/{doc_id}")
def delete_document(doc_id: str, doc_service: DocumentService = Depends(get_document_service)):
    if not doc_service.delete_document(doc_id):
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"message": "Document deleted successfully."}
