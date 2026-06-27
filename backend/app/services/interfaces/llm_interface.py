from abc import ABC, abstractmethod
from typing import List, Dict, Any

from ...models.document import DocumentPage


class ILLMService(ABC):
    @abstractmethod
    def ask_grounded(self, query: str, relevant_pages: List[DocumentPage]) -> Dict[str, Any]:
        pass
