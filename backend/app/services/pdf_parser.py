import io
from pypdf import PdfReader
from typing import List, Tuple

from .interfaces.pdf_parser_interface import IPDFParser


class PyPDFParser(IPDFParser):
    def extract_pages(self, file_content: bytes) -> List[Tuple[int, str]]:
        reader = PdfReader(io.BytesIO(file_content))
        return [
            (i + 1, (page.extract_text() or "").strip())
            for i, page in enumerate(reader.pages)
        ]
