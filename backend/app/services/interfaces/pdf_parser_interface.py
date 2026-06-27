from abc import ABC, abstractmethod
from typing import List, Tuple


class IPDFParser(ABC):
    @abstractmethod
    def extract_pages(self, file_content: bytes) -> List[Tuple[int, str]]:
        pass
