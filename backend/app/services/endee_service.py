"""
Endee Vector Database Service — wraps the Endee Python SDK
for index management, vector upsert, search, and deletion.
"""
import logging
from typing import Optional
from endee import Endee, Precision
from app.config import settings

logger = logging.getLogger(__name__)


class EndeeService:
    """Manages all interactions with the Endee vector database."""

    def __init__(self):
        self.client: Optional[Endee] = None
        self.index = None

    async def initialize(self):
        """Connect to Endee and ensure the documents index exists."""
        try:
            self.client = Endee()
            host = settings.ENDEE_HOST.rstrip("/")
            base_url = f"{host}/api/v1"
            self.client.set_base_url(base_url)

            if settings.ENDEE_AUTH_TOKEN:
                self.client.set_auth_token(settings.ENDEE_AUTH_TOKEN)

            # Create index if it doesn't exist
            try:
                self.index = self.client.get_index(name=settings.ENDEE_INDEX_NAME)
                logger.info(
                    f"Connected to existing Endee index: {settings.ENDEE_INDEX_NAME}"
                )
            except Exception:
                self.client.create_index(
                    name=settings.ENDEE_INDEX_NAME,
                    dimension=settings.ENDEE_DIMENSION,
                    space_type="cosine",
                    precision=Precision.INT8,
                )
                self.index = self.client.get_index(name=settings.ENDEE_INDEX_NAME)
                logger.info(
                    f"Created new Endee index: {settings.ENDEE_INDEX_NAME}"
                )

        except Exception as e:
            logger.error(f"Failed to initialize Endee: {e}")
            # We don't raise here, so the app can still start and return 
            # proper CORS headers and 500 JSON errors instead of crashing completely.

    def upsert_chunks(
        self,
        chunk_ids: list[str],
        vectors: list[list[float]],
        metadata_list: list[dict],
    ):
        """
        Store document chunk embeddings in Endee.

        Args:
            chunk_ids: Unique IDs for each chunk (e.g. "doc123_chunk_0")
            vectors: Embedding vectors (384-dim each)
            metadata_list: Metadata dicts with keys like doc_id, filename, text, chunk_index
        """
        if not self.index:
            raise RuntimeError("Endee index not initialized")

        items = []
        for cid, vec, meta in zip(chunk_ids, vectors, metadata_list):
            items.append({"id": cid, "vector": vec, "meta": meta})

        # Upsert in batches of 100 for efficiency
        batch_size = 100
        for i in range(0, len(items), batch_size):
            batch = items[i : i + batch_size]
            self.index.upsert(batch)

        logger.info(f"Upserted {len(items)} chunks to Endee")

    def search(
        self,
        query_vector: list[float],
        top_k: int = 5,
        doc_id: Optional[str] = None,
    ) -> list[dict]:
        """
        Semantic search across stored document chunks.

        Args:
            query_vector: 384-dim embedding of the query
            top_k: Number of results to return
            doc_id: Optional — filter results to a specific document

        Returns:
            List of dicts with keys: id, score, meta
        """
        if not self.index:
            raise RuntimeError("Endee index not initialized")

        try:
            results = self.index.query(vector=query_vector, top_k=top_k)

            formatted = []
            for r in results:
                # Safely extract data from result objects (which might be pydantic models or dicts)
                meta = {}
                result_id = ""
                score = 0.0

                if hasattr(r, "meta"):
                    meta = r.meta if r.meta else {}
                elif isinstance(r, dict):
                    meta = r.get("meta", {})

                if hasattr(r, "id"):
                    result_id = r.id
                elif isinstance(r, dict):
                    result_id = r.get("id", "")

                if hasattr(r, "similarity"):
                    score = r.similarity
                elif isinstance(r, dict):
                    score = r.get("similarity", 0.0)

                # Filter by doc_id if specified
                if doc_id and meta.get("doc_id") != doc_id:
                    continue

                formatted.append(
                    {
                        "id": result_id,
                        "score": float(score),
                        "meta": meta,
                    }
                )

            return formatted[:top_k]

        except Exception as e:
            logger.error(f"Endee search error: {e}")
            return []

    def delete_by_document(self, doc_id: str) -> int:
        """
        Delete all chunks belonging to a specific document.

        Returns the number of chunks deleted.
        """
        if not self.index:
            raise RuntimeError("Endee index not initialized")

        try:
            # Search for all chunks of this document (get many results)
            # Then delete them by ID
            deleted = 0
            # We'll search broadly and filter
            # This is a best-effort approach since Endee doesn't have
            # a native "delete by metadata" operation
            try:
                search_results = self.index.query(
                    vector=[0.0] * settings.ENDEE_DIMENSION,
                    top_k=10000,
                )
                ids_to_delete = []
                for r in search_results:
                    meta = {}
                    result_id = ""
                    if hasattr(r, "meta") and r.meta:
                        meta = r.meta
                    elif isinstance(r, dict):
                        meta = r.get("meta", {})
                    if hasattr(r, "id"):
                        result_id = r.id
                    elif isinstance(r, dict):
                        result_id = r.get("id", "")

                    if meta.get("doc_id") == doc_id:
                        ids_to_delete.append(result_id)

                for rid in ids_to_delete:
                    try:
                        self.index.delete(ids=[rid])
                        deleted += 1
                    except Exception:
                        pass

            except Exception as e:
                logger.warning(f"Bulk delete search failed: {e}")

            logger.info(f"Deleted {deleted} chunks for document {doc_id}")
            return deleted

        except Exception as e:
            logger.error(f"Error deleting chunks for doc {doc_id}: {e}")
            return 0


# Singleton instance
endee_service = EndeeService()
