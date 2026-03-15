"""
AI Document Chatbot — FastAPI Application Entry Point

A RAG-powered document chatbot using Endee as the vector database.
Upload documents, ask questions, and get AI-generated answers
with source citations.
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.endee_service import endee_service
from app.services.embeddings import embedding_service
from app.services.rag_engine import initialize_llm
from app.routes import documents, chat, search

# ── Logging ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-30s │ %(levelname)-7s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup, clean up on shutdown."""
    logger.info("=" * 60)
    logger.info("  AI Document Chatbot — Starting up")
    logger.info("=" * 60)

    # Create uploads directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    # Initialize embedding model
    logger.info("Loading embedding model...")
    embedding_service.initialize()

    # Initialize Endee connection
    logger.info("Connecting to Endee vector database...")
    await endee_service.initialize()

    # Configure LLM (Groq)
    initialize_llm()

    logger.info("=" * 60)
    logger.info("  All services initialized — ready to serve!")
    logger.info("=" * 60)

    yield  # App is running

    logger.info("Shutting down AI Document Chatbot...")


# ── FastAPI App ────────────────────────────────────────────────────
app = FastAPI(
    title="AI Document Chatbot",
    description=(
        "A RAG-powered document chatbot using Endee vector database. "
        "Upload documents, ask questions, and get AI-generated answers "
        "with source citations."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routes ───────────────────────────────────────────────
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(search.router)


# ── Health Check ───────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check():
    """Check if the API server is running and services are available."""
    return {
        "status": "healthy",
        "service": "AI Document Chatbot",
        "version": "1.0.0",
        "endee_connected": endee_service.index is not None,
        "embedding_model": settings.EMBEDDING_MODEL,
        "groq_configured": bool(settings.GROQ_API_KEY),
    }


@app.get("/", tags=["Root"])
async def root():
    """API root — redirects to docs."""
    return {
        "message": "AI Document Chatbot API",
        "docs": "/docs",
        "health": "/api/health",
    }
