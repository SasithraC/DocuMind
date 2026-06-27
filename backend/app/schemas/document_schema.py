from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
