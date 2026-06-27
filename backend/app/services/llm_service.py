import re
import logging
from groq import Groq
from typing import List, Dict, Any

from ..models.document import DocumentPage
from ..config import settings
from .interfaces.llm_interface import ILLMService

logger = logging.getLogger(__name__)


class GroqLLMService(ILLMService):
    def __init__(self):
        self.model_name = settings.groq_model
        self.client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None

    def ask_grounded(self, query: str, relevant_pages: List[DocumentPage]) -> Dict[str, Any]:
        if not self.client:
            return {"answer": "GROQ_API_KEY is not configured.", "citations": []}

        if not relevant_pages:
            return {"answer": "No context pages found.", "citations": []}

        context = "\n\n".join(
            f"--- SOURCE {i + 1} ---\n"
            f"Document: {p.document.filename if p.document else 'Unknown'}\n"
            f"Page: {p.page_number}\n"
            f"Content:\n{p.content}\n"
            f"--- END SOURCE {i + 1} ---"
            for i, p in enumerate(relevant_pages)
        )

        prompt = f"""You are a Q&A system. Answer the question using ONLY the sources below.
If the answer is not in the sources, say: "I cannot find the answer in the uploaded documents."
Cite every claim as [Page X] or [Page X, Y].

SOURCES:
{context}

QUESTION:
{query}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
            )
            answer = (response.choices[0].message.content or "").strip()
            matches = re.findall(r'\[Page\s*(\d+(?:\s*,\s*\d+)*)\]', answer)
            citations = sorted({int(p.strip()) for m in matches for p in m.split(",")})
            return {"answer": answer, "citations": citations}

        except Exception as e:
            logger.error(f"Groq error: {str(e)}")
            error_str = str(e)
            if "invalid_api_key" in error_str or "401" in error_str:
                message = "Invalid API key. Please check your GROQ_API_KEY in the .env file."
            elif "rate_limit" in error_str or "429" in error_str:
                message = "Groq rate limit exceeded. Please try again in a moment."
            elif "model_not_found" in error_str or "404" in error_str:
                message = "Model not found. Please check your GROQ_MODEL in the .env file."
            else:
                message = "Something went wrong while contacting the AI. Please try again."
            return {"answer": message, "citations": []}
