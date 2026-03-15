"""
Embedding Service — generates dense vector embeddings
using fastembed (all-MiniLM-L6-v2 via ONNX, no PyTorch needed).
"""
import logging
from fastembed import TextEmbedding
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Generates 384-dimensional embeddings for text content."""

    def __init__(self):
        self.model: TextEmbedding | None = None

    def initialize(self):
        """Load the embedding model into memory."""
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        # fastembed downloads the ONNX model on first run (~90MB, no PyTorch)
        self.model = TextEmbedding(model_name=settings.EMBEDDING_MODEL)
        logger.info("Embedding model loaded successfully.")

    def embed_text(self, text: str) -> list[float]:
        """
        Generate an embedding for a single text string.

        Args:
            text: Input text to embed

        Returns:
            384-dimensional float vector
        """
        if not self.model:
            raise RuntimeError("Embedding model not loaded")
        embeddings = list(self.model.embed([text]))
        return embeddings[0].tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for a batch of texts.

        Args:
            texts: List of text strings

        Returns:
            List of 384-dimensional float vectors
        """
        if not self.model:
            raise RuntimeError("Embedding model not loaded")
        embeddings = list(self.model.embed(texts))
        return [e.tolist() for e in embeddings]


# Singleton instance
embedding_service = EmbeddingService()
