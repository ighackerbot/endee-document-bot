"""
Chat Routes — RAG-powered conversational interface.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.rag_engine import generate_answer

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    query: str
    doc_id: Optional[str] = None


class SourceInfo(BaseModel):
    filename: str
    chunk_index: int
    relevance_score: float
    text_preview: str
    doc_id: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceInfo]
    query: str


@router.post("", response_model=ChatResponse)
async def chat_with_documents(request: ChatRequest):
    """
    Chat with your documents using RAG.

    Send a natural language question and get an AI-generated answer
    based on the content of your uploaded documents.

    Optionally filter to a specific document by providing doc_id.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    try:
        result = await generate_answer(
            query=request.query,
            doc_id=request.doc_id,
        )
        return ChatResponse(**result)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate answer: {str(e)}"
        )
