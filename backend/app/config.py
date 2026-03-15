"""
Application configuration — environment variables and settings.
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # ── Endee Vector Database ──────────────────────────────────────────
    ENDEE_HOST: str = os.getenv("ENDEE_HOST", "http://localhost:8080")
    ENDEE_AUTH_TOKEN: str = os.getenv("ENDEE_AUTH_TOKEN", "")
    ENDEE_INDEX_NAME: str = "documents"
    ENDEE_DIMENSION: int = 384  # Matches all-MiniLM-L6-v2 output dim

    # ── Embedding Model ───────────────────────────────────────────────
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # ── Groq (LLM for RAG) ───────────────────────────────────
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    # ── Document Processing ───────────────────────────────────────────
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: set = {".pdf", ".docx", ".txt", ".md"}

    # ── RAG Settings ──────────────────────────────────────────────────
    TOP_K_RETRIEVAL: int = 5
    MAX_CONTEXT_LENGTH: int = 4000

    # ── Server ────────────────────────────────────────────────────────
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")


settings = Settings()
