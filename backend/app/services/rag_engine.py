"""
RAG Engine — Retrieval-Augmented Generation pipeline.
Embeds the user query → retrieves relevant chunks from Endee →
builds context → calls Google Gemini to generate an answer.
"""
import logging
from typing import Optional
import google.generativeai as genai

from app.config import settings
from app.services.embeddings import embedding_service
from app.services.endee_service import endee_service
from app.services.document_processor import get_document

logger = logging.getLogger(__name__)


# ── Prompt Template ────────────────────────────────────────────────
RAG_PROMPT_TEMPLATE = """You are an intelligent document assistant. Answer the user's question based ONLY on the provided context from their documents. If the context doesn't contain enough information to answer, say so clearly.

## Context from Documents:
{context}

## User Question:
{question}

## Instructions:
- Answer based ONLY on the provided context
- Be specific and cite which part of the document your answer comes from
- If the context is insufficient, say "I couldn't find enough information in the uploaded documents to fully answer this question."
- Format your answer clearly with proper paragraphs
- Keep your answer concise but comprehensive"""


def initialize_gemini():
    """Configure the Gemini API client."""
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        logger.info("Gemini API configured successfully")
    else:
        logger.warning(
            "GEMINI_API_KEY not set — RAG generation will use fallback mode"
        )


async def generate_answer(
    query: str, doc_id: Optional[str] = None
) -> dict:
    """
    Full RAG pipeline:
    1. Embed the user query
    2. Search Endee for relevant document chunks
    3. Build context from top-k results
    4. Generate answer using Gemini (or fallback)

    Args:
        query: User's question
        doc_id: Optional — restrict search to a specific document

    Returns:
        Dict with keys: answer, sources, query
    """
    logger.info(f"RAG query: '{query}' (doc_filter={doc_id})")

    # Step 1: Embed the query
    query_vector = embedding_service.embed_text(query)

    # Step 2: Search Endee for relevant chunks
    search_results = endee_service.search(
        query_vector=query_vector,
        top_k=settings.TOP_K_RETRIEVAL,
        doc_id=doc_id,
    )

    if not search_results:
        return {
            "answer": "I couldn't find any relevant information in the uploaded documents. Please make sure you've uploaded documents first.",
            "sources": [],
            "query": query,
        }

    # Step 3: Build context from retrieved chunks
    context_parts = []
    sources = []

    for i, result in enumerate(search_results):
        meta = result.get("meta", {})
        score = result.get("score", 0.0)

        # Get the full chunk text from document store
        chunk_text = meta.get("text", "")
        result_doc_id = meta.get("doc_id", "")
        chunk_index = meta.get("chunk_index", 0)
        filename = meta.get("filename", "Unknown")

        # Try to get full chunk text from in-memory store
        doc = get_document(result_doc_id)
        if doc and "chunks" in doc and chunk_index < len(doc["chunks"]):
            chunk_text = doc["chunks"][chunk_index]

        context_parts.append(
            f"[Source {i + 1} — {filename}, Chunk {chunk_index + 1}]\n{chunk_text}"
        )

        sources.append(
            {
                "filename": filename,
                "chunk_index": chunk_index,
                "relevance_score": round(score, 4),
                "text_preview": chunk_text[:300] if chunk_text else "",
                "doc_id": result_doc_id,
            }
        )

    context = "\n\n---\n\n".join(context_parts)

    # Trim context to max length
    if len(context) > settings.MAX_CONTEXT_LENGTH:
        context = context[: settings.MAX_CONTEXT_LENGTH] + "\n\n[Context truncated...]"

    # Step 4: Generate answer
    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=query)

    try:
        if settings.GEMINI_API_KEY:
            answer = await _call_gemini(prompt)
        else:
            answer = _fallback_answer(query, sources, context_parts)
    except Exception as e:
        logger.error(f"LLM generation error: {e}")
        answer = _fallback_answer(query, sources, context_parts)

    return {
        "answer": answer,
        "sources": sources,
        "query": query,
    }


async def _call_gemini(prompt: str) -> str:
    """Call Google Gemini API for answer generation."""
    model = genai.GenerativeModel(settings.GEMINI_MODEL)
    response = model.generate_content(prompt)
    return response.text


def _fallback_answer(
    query: str, sources: list[dict], context_parts: list[str]
) -> str:
    """
    Fallback when no LLM API key is configured.
    Returns the retrieved context directly as the answer.
    """
    if not sources:
        return "No relevant documents found."

    answer_parts = [
        f"**Based on your documents, here are the most relevant passages for:** *\"{query}\"*\n",
    ]

    for i, (source, text) in enumerate(zip(sources, context_parts)):
        score_pct = round(source["relevance_score"] * 100, 1)
        answer_parts.append(
            f"**Source {i + 1}** — *{source['filename']}* (Relevance: {score_pct}%)\n"
            f"> {source['text_preview'][:200]}...\n"
        )

    answer_parts.append(
        "\n*💡 Tip: Set the `GEMINI_API_KEY` environment variable to enable AI-generated answers.*"
    )

    return "\n".join(answer_parts)
