<p align="center">
  <h1 align="center">⚡ DocChat AI</h1>
  <p align="center"><strong>AI Document Chatbot — Powered by Endee Vector Database</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Endee-Vector_DB-667eea?style=flat-square" alt="Endee" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square" alt="React" />
  <img src="https://img.shields.io/badge/RAG-Pipeline-764ba2?style=flat-square" alt="RAG" />
</p>

---

## 🎯 What is this?

**DocChat AI** is a full-stack document chatbot that lets you:

1. **Upload documents** (PDF, DOCX, TXT, MD)
2. **Chat with them** using Retrieval-Augmented Generation (RAG)
3. **Semantic search** across all your documents by meaning

It uses **[Endee](https://github.com/endee-io/endee)** — a high-performance open-source vector database — as the core retrieval engine. Documents are chunked, embedded, and stored in Endee. When you ask a question, the system finds the most relevant passages via vector similarity and generates an answer using Google Gemini.

---

## 🏗️ Architecture

```
┌───────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React UI     │────▶│  FastAPI Backend  │────▶│  Endee Vector   │
│  (Vite)       │     │                  │     │  Database       │
│  Port 5173    │     │  Port 8000       │     │  Port 8080      │
└───────────────┘     └────────┬─────────┘     └─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
              ┌─────▼─────┐      ┌────────▼────────┐
              │ sentence-  │      │  Google Gemini   │
              │ transformers│      │  (LLM for RAG)  │
              │ all-MiniLM │      │  Optional        │
              └────────────┘      └─────────────────┘
```

**Core AI/ML Features:**
- **Semantic Search** — vector similarity search via Endee (cosine similarity, INT8 precision)
- **RAG Pipeline** — Retrieve relevant chunks → Build context → Generate answer with LLM
- **Document Intelligence** — auto-chunking with overlap for optimal retrieval quality
- **Hybrid Retrieval** — dense vector search with metadata filtering

---

## 🚀 Quick Start

### Prerequisites
- **Docker** installed ([Get Docker](https://docs.docker.com/get-docker/))
- **Python 3.10+** and **Node.js 18+** (for local development)
- **Google Gemini API Key** (optional, for AI-generated answers)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/your-username/AI-Document-Chatbot.git
cd AI-Document-Chatbot

# Optional: Set Gemini API key for AI answers
export GEMINI_API_KEY="your-gemini-api-key"

# Start everything
docker compose up -d

# Frontend (in a new terminal)
cd frontend && npm install && npm run dev
```

### Option 2: Local Development

**Terminal 1 — Start Endee:**
```bash
docker run --ulimit nofile=100000:100000 -p 8080:8080 \
  -v ./endee-data:/data --name endee-server \
  endeeio/endee-server:latest
```

**Terminal 2 — Start Backend:**
```bash
cd backend
pip install -r requirements.txt
export GEMINI_API_KEY="your-gemini-api-key"  # optional
uvicorn app.main:app --reload --port 8000
```

**Terminal 3 — Start Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🧠 How It Works

### Document Ingestion
1. Upload a document (PDF/DOCX/TXT)
2. Text is extracted using PyPDF2 / python-docx
3. Text is split into ~500 character chunks with 50-char overlap
4. Each chunk is embedded using `all-MiniLM-L6-v2` (384 dimensions)
5. Embeddings + metadata are stored in **Endee** via the Python SDK

### RAG Query Pipeline
1. User asks a question
2. Question is embedded into a 384-dim vector
3. **Endee** performs cosine similarity search → top-5 relevant chunks
4. Context is built from retrieved chunks with source attribution
5. **Google Gemini** generates an answer based on the context
6. Answer is returned with source citations

### Semantic Search
- Uses Endee's vector search directly
- Returns ranked results with relevance scores
- Supports filtering by specific document

---

## 📁 Project Structure

```
AI-Document-Chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── config.py                # Environment configuration
│   │   ├── routes/
│   │   │   ├── documents.py         # Upload, list, delete documents
│   │   │   ├── chat.py              # RAG chat endpoint
│   │   │   └── search.py            # Semantic search endpoint
│   │   └── services/
│   │       ├── endee_service.py      # Endee vector DB wrapper
│   │       ├── embeddings.py         # Sentence-transformers
│   │       ├── document_processor.py # PDF/DOCX/TXT ingestion
│   │       └── rag_engine.py         # RAG pipeline
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── App.jsx                  # Main layout
│       ├── components/
│       │   ├── Sidebar.jsx          # Document management
│       │   ├── ChatInterface.jsx    # RAG chat UI
│       │   ├── SearchPanel.jsx      # Semantic search UI
│       │   ├── DocumentUpload.jsx   # Drag-and-drop upload
│       │   └── SourceCard.jsx       # Source citation cards
│       └── services/
│           └── api.js               # Backend API client
├── endee/                           # Endee vector database source
├── docker-compose.yml               # One-command startup
└── README.md
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Vector Database** | [Endee](https://github.com/endee-io/endee) | Semantic search & vector storage |
| **Backend** | FastAPI (Python) | REST API & RAG orchestration |
| **Embeddings** | sentence-transformers (all-MiniLM-L6-v2) | Text → 384-dim vectors |
| **LLM** | Google Gemini | Answer generation from context |
| **Frontend** | React + Vite | Interactive UI |
| **Document Processing** | PyPDF2, python-docx, langchain-text-splitters | Text extraction & chunking |
| **Deployment** | Docker Compose | One-command startup |

---

## 🔑 Endee Integration Details

This project uses Endee as the core vector database through its **Python SDK**:

```python
from endee import Endee, Precision

# Connect to Endee
client = Endee()
client.set_base_url("http://localhost:8080/api/v1")

# Create an index for documents
client.create_index(
    name="documents",
    dimension=384,         # Matches embedding model output
    space_type="cosine",   # Cosine similarity for semantic search
    precision=Precision.INT8  # INT8 quantization for efficiency
)

# Store document chunks
index = client.get_index("documents")
index.upsert([{
    "id": "doc1_chunk_0",
    "vector": embedding_vector,
    "meta": {"filename": "report.pdf", "text": "chunk text..."}
}])

# Semantic search
results = index.query(vector=query_embedding, top_k=5)
```

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/documents/upload` | Upload a document |
| `GET` | `/api/documents/` | List all documents |
| `DELETE` | `/api/documents/{id}` | Delete a document |
| `POST` | `/api/chat/` | RAG chat query |
| `POST` | `/api/search/` | Semantic search |

---

## 📄 License

Apache License 2.0 — see [LICENSE](./endee/LICENSE) for details.
