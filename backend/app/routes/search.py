"""
Semantic Search Routes — search across documents by meaning.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.embeddings import embedding_service
from app.services.endee_service import endee_service
from app.services.document_processor import get_document

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/search", tags=["Search"])


class SearchRequest(BaseModel):
    query: str
    top_k: int = 10
    doc_id: Optional[str] = None


class SearchResult(BaseModel):
    chunk_id: str
    filename: str
    doc_id: str
    chunk_index: int
    relevance_score: float
    text_preview: str


class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: list[SearchResult]


@router.post("/", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """
    Search across all documents using semantic similarity.

    Returns ranked document chunks with relevance scores.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        # Embed the query
        query_vector = embedding_service.embed_text(request.query)

        # Search Endee
        results = endee_service.search(
            query_vector=query_vector,
            top_k=request.top_k,
            doc_id=request.doc_id,
        )

        # Format results
        formatted_results = []
        for r in results:
            meta = r.get("meta", {})
            doc_id = meta.get("doc_id", "")
            chunk_index = meta.get("chunk_index", 0)

            # Get the full chunk text from memory store
            text_preview = meta.get("text", "")
            doc = get_document(doc_id)
            if doc and "chunks" in doc and chunk_index < len(doc["chunks"]):
                text_preview = doc["chunks"][chunk_index][:300]

            formatted_results.append(
                SearchResult(
                    chunk_id=r.get("id", ""),
                    filename=meta.get("filename", "Unknown"),
                    doc_id=doc_id,
                    chunk_index=chunk_index,
                    relevance_score=round(r.get("score", 0.0), 4),
                    text_preview=text_preview,
                )
            )

        return SearchResponse(
            query=request.query,
            total_results=len(formatted_results),
            results=formatted_results,
        )

    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Search failed: {str(e)}"
        )
