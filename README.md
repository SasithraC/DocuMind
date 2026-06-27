# Document Intelligence Q&A

A full-stack app to upload PDF documents, ask questions about them, and get answers grounded in the documents with exact page citations.

---

## How to Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (running locally on port `5432`)
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Setup & Run

1. **Set up PostgreSQL**:
   Make sure PostgreSQL is installed and running. Then create the database:
   ```bash
   psql -U postgres -c "CREATE DATABASE doc_qa_db;"
   ```

2. **Configure Environment Variables**:
   Create a `backend/.env` file (copy from `backend/.env.example`) and fill in your values:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/doc_qa_db
   PORT=8000
   GROQ_MODEL=llama-3.3-70b-versatile
   ```

3. **Start the Backend**:
   ```bash
   cd backend

   # Activate the virtual environment
   venv\Scripts\activate       # On Windows (Command Prompt)
   source venv/bin/activate    # On macOS/Linux

   # Install dependencies
   pip install -r ../requirements.txt

   # Start the FastAPI server
   uvicorn app.main:app --reload
   ```
   The backend runs on [http://localhost:8000](http://localhost:8000).

4. **Start the Frontend**:
   ```bash
   cd frontend

   # Install frontend dependencies
   npm install

   # Start the React/Vite development server
   npm run dev
   ```
   The frontend runs on [http://localhost:3001](http://localhost:3001).

---

## Tech Choices & Why

### Language — Python (Backend)

Python was the clear choice for the backend because the entire AI/ML ecosystem lives there. Libraries like `pypdf` for PDF parsing, `groq` for LLM access, and `SQLAlchemy` for ORM are all first-class Python packages with active maintenance. Trying to replicate this stack in Node.js or Go would have meant either worse library support or significantly more integration work. For a task where the core value is in the AI pipeline, using the language that AI tooling is built for was the obvious call.

### Web Framework — FastAPI

FastAPI over Flask or Django because:
- **Async-first**: `async def` endpoints handle concurrent uploads without blocking, which matters when PDF parsing can take several seconds per document.
- **Automatic validation**: Pydantic schemas at the API boundary mean I never have to manually validate request bodies — type errors fail fast and return clear error messages.
- **Built-in dependency injection**: Services (`LLMService`, `SearchService`) are injected per-request via `Depends()`, which makes the code testable and keeps route handlers thin.
- **Zero boilerplate OpenAPI docs**: The `/docs` endpoint is auto-generated, which is useful for debugging and API exploration.

Django would have been overkill — its ORM, admin panel, and auth middleware aren't needed here. Flask lacks async support and requires manual wiring of everything FastAPI provides out of the box.

### Database — PostgreSQL

The data model has a natural relational shape: one `Document` has many `DocumentPage` rows. A relational database handles this join efficiently with a single indexed foreign key lookup. I chose PostgreSQL specifically because:
- It's what you'd run in production — starting with SQLite and migrating later adds risk.
- `CASCADE` deletes mean removing a document automatically removes all its pages in one operation.
- PostgreSQL's `JSONB` and `pgvector` extension (a natural next step) are available if the search strategy is upgraded later.
- It's the industry standard for this class of application.

### ORM — SQLAlchemy

All database access is isolated in a `DocumentRepository` class. The rest of the codebase never writes raw SQL — it calls repository methods. This means:
- The database can be swapped (e.g. from PostgreSQL to another RDBMS) by changing the connection string, not the business logic.
- Queries are typed and composable, not string-concatenated.
- Sessions are properly scoped per-request via a `get_db` dependency.

### Async Processing — FastAPI BackgroundTasks

PDF parsing is slow — a 50-page document might take 2–3 seconds. Doing that synchronously inside the upload endpoint would block the HTTP response and leave the user waiting with no feedback. Instead:
1. The upload endpoint immediately creates the document record with `status=queued` and returns.
2. A `BackgroundTask` picks up the processing after the response is sent.
3. The frontend polls `/api/documents/` every 5 seconds to reflect the real status.

I considered Celery + Redis but ruled it out for this scope — it adds two new infrastructure dependencies (a broker and a worker process) for a problem that `BackgroundTasks` solves adequately at demo scale. I noted this as a known tradeoff.

### LLM — Groq API (LLaMA 3.3 70B)

Three reasons:
1. **Free tier**: 14,400 requests/day at no cost, with no credit card required.
2. **Speed**: Groq's inference hardware is significantly faster than OpenAI's API for equivalent model sizes — answers come back in under 2 seconds.
3. **Quality**: LLaMA 3.3 70B produces high-quality, instruction-following responses. The grounding and citation instructions in the prompt are followed reliably, which is critical for the honesty requirement.

GPT-4 and Gemini both require paid API keys with regional availability restrictions, making them unsuitable as a default for a take-home exercise that someone else needs to run.

### Search Strategy — Lexical (Keyword Matching)

Rather than setting up a vector database and embedding model, I built a simple lexical search:
- Split the query into keywords, remove stop words.
- Score each page by counting keyword occurrences in the page content.
- Boost pages from documents whose filename matches query terms.
- Return the top 8 highest-scoring pages.

This is deliberately simple. The LLM handles semantic understanding — it can recognise that "salary" and "compensation" mean the same thing when the retrieved page contains the right content. The retrieval step just needs to narrow 500 pages down to 8 relevant ones, and keyword overlap does that well for most practical queries. No Pinecone, no Chroma, no embedding API calls, no cold-start latency.

### PDF Parsing — pypdf

`pypdf` is a pure-Python PDF text extraction library with no system dependencies (no Poppler, no Ghostscript). It extracts text page-by-page, which maps directly to the citation model — every extracted chunk has a known page number. I noted a known limitation: scanned (image-only) PDFs produce empty text and would need OCR (e.g. Tesseract) as a future improvement.

### Frontend — React + TypeScript + Vite

- **React**: Component model maps well to the UI — `UploadZone`, `DocumentList`, `ChatInterface` are independent, reusable units.
- **TypeScript**: End-to-end type safety catches integration errors between the API response shape and what the UI renders. The `DocumentInfo` and `ChatMessage` types are the single source of truth.
- **Vite**: Sub-second HMR during development. No configuration needed for TypeScript or React.

### State Management — Zustand

Two stores (`useDocumentStore`, `useChatStore`) cover all application state. Zustand was chosen over Redux because:
- No boilerplate: no actions, reducers, or action creators — just functions that mutate state directly.
- No provider wrapping: stores are imported and used anywhere without a context tree.
- All API calls live inside the store functions, so React components never call `fetch` directly — they call store actions. This keeps components declarative and easy to test.

### Styling — Tailwind CSS + Custom CSS Variables

Tailwind's utility classes handle spacing, layout, and typography. Custom CSS variables (`--bg-primary`, `--accent`, etc.) power the dark/light theme toggle without duplicating class names. The glassmorphism card effects are done with `backdrop-filter: blur()` in a `glass-panel` utility class.

---

## Architecture

```
User uploads PDF(s)
  → FastAPI returns immediately with status=queued
  → BackgroundTask: pypdf extracts text page-by-page
  → Pages saved to PostgreSQL (documents + document_pages tables)
  → status updated: queued → processing → ready (or failed on error)
  → Frontend polls /api/documents/ every 5s, reflects live status

User asks a question
  → LexicalSearchService scores all ready pages against query keywords
  → Top 8 pages passed to GroqLLMService as context
  → Prompt instructs LLM to answer ONLY from sources, cite [Page X]
  → LLM response parsed by regex to extract page numbers
  → Answer + citation badges rendered in chat UI
```

This is a **RAG (Retrieval-Augmented Generation)** architecture. The LLM never answers from its training data — it can only use what the retrieval step passes in. If retrieval finds nothing relevant, the prompt instructs it to say so explicitly.

---

## Key Tradeoffs

| Decision | What I chose | What I cut | Why |
|---|---|---|---|
| Search | Lexical keyword match | Vector embeddings | Simpler stack, no vector DB needed for this scope |
| Async processing | FastAPI BackgroundTasks | Celery + Redis | Sufficient for demo; Celery adds infra complexity |
| LLM | Groq / LLaMA 3.3 70B | GPT-4, Gemini | Free, globally available, generous quota |
| Database | PostgreSQL | SQLite | Production-realistic from day one |
| PDF parsing | pypdf | Unstructured / OCR | No system deps; scanned PDFs are a known gap |

---

## What I'd Do Next with More Time


- **Vector search** — replace lexical search with embeddings (pgvector or Chroma) for semantic similarity, so "show me compensation details" finds pages that say "salary" without needing an exact keyword match
- **Streaming responses** — stream LLM output token-by-token so users see the answer appear in real time
- **Authentication** — user accounts so each user only sees their own documents
- **Better chunking** — split pages into overlapping chunks for more precise citations instead of whole-page context
- **Celery + Redis** — replace BackgroundTasks with a proper task queue for reliability under load
- **File validation** — reject password-protected or scanned (image-only) PDFs with a clear error message

