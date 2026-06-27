# DocuMind Q&A

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

### Backend — FastAPI (Python)
FastAPI gives async request handling, automatic OpenAPI docs, and built-in dependency injection — all with minimal boilerplate. Python was the natural choice because the AI/ML ecosystem (PDF parsing, LLM clients) is most mature there.

### Database — PostgreSQL
The data has a clear relational structure: one Document has many Pages. PostgreSQL handles this well and is reliable for production. SQLite would have worked for a demo but PostgreSQL is what you'd actually run in production, so I used it from the start.

### ORM — SQLAlchemy
Clean repository pattern — all database queries live in one place. Makes it easy to swap databases if needed and keeps business logic out of SQL strings.

### LLM — Groq (LLaMA 3.3 70B)
Free tier with 14,400 requests/day, no regional restrictions, and LLaMA 3.3 70B produces high-quality grounded answers. The API is simple and fast — responses typically come back in under 2 seconds.

### Search — Lexical (keyword matching)
Instead of vector embeddings and a vector database, I used simple keyword search with stop-word filtering and a filename-based score boost. This keeps the stack simple (no Pinecone, no Chroma, no embedding model) while working well enough for document Q&A. The LLM does the heavy lifting of understanding context — the search just needs to find the right pages.

### Frontend — React + TypeScript + Vite
React for component-based UI, TypeScript for type safety across the stack, Vite for a fast dev server. Standard, well-supported stack with great ecosystem support.

### State Management — Zustand
Simpler than Redux with far less boilerplate. Two stores (`useDocumentStore`, `useChatStore`) cover all the app state. API calls are isolated in `services/api.ts` — stores call those, and components never touch `fetch` directly.

### Styling — Tailwind CSS + Custom CSS Variables
Tailwind for utility classes, custom CSS variables for the dark/light theme toggle and glassmorphism effects.

---

## Architecture

```
User uploads PDF
  → FastAPI saves file, starts background task
  → pypdf parses each page, saves text to PostgreSQL
  → status updates: queued → processing → ready

User asks a question
  → LexicalSearchService finds top 8 relevant pages from DB
  → GroqLLMService injects pages into prompt + calls LLaMA 3.3 70B
  → LLM answers using ONLY those pages, cites [Page X]
  → regex extracts page numbers → shown as citation badges in UI
```

This is a **RAG (Retrieval-Augmented Generation)** architecture — the LLM never answers from its training data, only from the uploaded documents.

---

## Key Tradeoffs

| Decision | What I chose | What I cut | Why |
|---|---|---|---|
| Search | Lexical keyword match | Vector embeddings | Simpler stack, no vector DB needed for this scope |
| Async processing | FastAPI BackgroundTasks | Celery + Redis | Sufficient for demo; Celery adds infra complexity |
| LLM | Groq / LLaMA 3.3 70B | GPT-4, Gemini | Free, globally available, generous quota |
| Database | PostgreSQL | SQLite | Production-realistic from day one |

---

## What I'd Do Next with More Time

- **Vector search** — replace lexical search with embeddings (pgvector or Chroma) for semantic similarity, so "show me compensation details" finds pages that say "salary" without needing an exact keyword match
- **Streaming responses** — stream LLM output token-by-token so users see the answer appear in real time
- **Authentication** — user accounts so each user only sees their own documents
- **Better chunking** — split pages into overlapping chunks for more precise citations instead of whole-page context
- **Celery + Redis** — replace BackgroundTasks with a proper task queue for reliability under load
- **File validation** — reject password-protected or scanned (image-only) PDFs with a clear error message
