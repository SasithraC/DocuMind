from abc import ABC, abstractmethod
from typing import List
from ...models.document import DocumentPage


class ISearchService(ABC):
    @abstractmethod
    def search(self, pages: List[DocumentPage], query: str, top_n: int = 6) -> List[DocumentPage]:
        pass
