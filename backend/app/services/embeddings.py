"""
Embedding Service — generates dense vector embeddings
using sentence-transformers (all-MiniLM-L6-v2).
"""
import logging
from sentence_transformers import SentenceTransformer
from app.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Generates 384-dimensional embeddings for text content."""

    def __init__(self):
        self.model: SentenceTransformer | None = None

    def initialize(self):
        """Load the embedding model into memory."""
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
        logger.info(
            f"Embedding model loaded. Dimension: {self.model.get_sentence_embedding_dimension()}"
        )

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
        embedding = self.model.encode(text, normalize_embeddings=True)
        return embedding.tolist()

    def embed_batch(self, texts: list[str]) -> list[list[float]]:
        """
        Generate embeddings for a batch of texts (much faster than one-by-one).

        Args:
            texts: List of text strings

        Returns:
            List of 384-dimensional float vectors
        """
        if not self.model:
            raise RuntimeError("Embedding model not loaded")
        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=False,
        )
        return embeddings.tolist()


# Singleton instance
embedding_service = EmbeddingService()
