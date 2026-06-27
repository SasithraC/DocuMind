from typing import List

from ..models.document import DocumentPage
from .interfaces.search_interface import ISearchService

STOP_WORDS = {
    "tell", "me", "about", "the", "a", "an", "is", "are", "was", "were",
    "what", "who", "where", "when", "how", "why", "which", "this", "that",
    "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "do", "does", "did", "can", "could", "will", "would", "please", "give",
    "find", "show", "list", "get", "from", "my", "your", "his", "her", "their"
}


class LexicalSearchService(ISearchService):
    def search(self, pages: List[DocumentPage], query: str, top_n: int = 6) -> List[DocumentPage]:

        # step 1 - split query into words and remove stop words
        all_terms = query.lower().split()
        terms = [t for t in all_terms if t not in STOP_WORDS]

        # step 2 - if all words were stop words, fall back to original terms
        if not terms:
            terms = all_terms

        # step 3 - if still empty, return first N pages
        if not terms:
            return pages[:top_n]

        # step 4 - score each page by counting how many query words appear
        scored_pages = []
        for page in pages:
            score = 0
            filename = page.document.filename.lower() if page.document else ""
            for term in terms:
                # content match
                score += page.content.lower().count(term)
                # filename match — boost pages from docs whose name matches the query
                if term in filename:
                    score += 20
            scored_pages.append((score, page))

        # step 5 - sort by score, highest first
        scored_pages.sort(key=lambda x: x[0], reverse=True)

        # step 6 - keep only pages that had at least one match
        matched = []
        for score, page in scored_pages:
            if score > 0:
                matched.append(page)

        # step 7 - if nothing matched, fall back to all pages
        if not matched:
            matched = pages

        # step 8 - return top N pages
        return matched[:top_n]
