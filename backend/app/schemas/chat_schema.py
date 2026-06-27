from pydantic import BaseModel
from typing import List, Optional


class ChatRequest(BaseModel):
    query: str
    doc_ids: Optional[List[str]] = None


class ChatResponse(BaseModel):
    answer: str
    citations: List[int]
