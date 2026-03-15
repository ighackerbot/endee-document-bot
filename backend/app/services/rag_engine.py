"""
RAG Engine — Retrieval-Augmented Generation pipeline.
Embeds the user query → retrieves relevant chunks from Endee →
builds context → calls Google Gemini to generate an answer.
"""
import logging
from typing import Optional
from groq import Groq

from app.config import settings
from app.services.embeddings import embedding_service
from app.services.endee_service import endee_service
from app.services.document_processor import get_document

logger = logging.getLogger(__name__)


# ── Prompt Template ────────────────────────────────────────────────
RAG_PROMPT_TEMPLATE = """You are an expert, highly precise AI document analysis assistant. Your sole purpose is to extract and synthesize information strictly from the provided context.

## Context from Documents:
{context}

## User Question:
{question}

## CRITICAL INSTRUCTIONS - YOU MUST OBEY THESE STRICTLY:
1. PREVENT HALLUCINATIONS: You must base your answer *entirely* and *exclusively* on the Context provided above. Do NOT use outside knowledge, assume facts, or make up information.
2. EXPLICIT REFUSAL: If the provided Context does NOT contain the exact information needed to directly answer the User Question, you MUST refuse to answer by stating exactly: "I cannot answer this question because the information is not present in the uploaded documents." Do not attempt to guess or provide partial external knowledge.
3. CITATION: Every claim or fact in your answer must include an inline citation indicating which source file and chunk provided that fact (e.g., [Source 1 — filename.pdf, Chunk 3]).
4. STRUCTURED FORMAT: You must format your final answer strictly using the following structure:
   - **Direct Answer:** A concise, 1-2 sentence direct response.
   - **Key Details:** A bulleted list of specific details, metrics, or facts directly derived from the context.
5. NO FLUFF: Do not include conversational filler like "Based on the provided documents..." Simply output the mandatory structured format directly."""


def initialize_llm():
    """Check Groq API configuration."""
    if settings.GROQ_API_KEY:
        logger.info("Groq API configured successfully")
    else:
        logger.warning(
            "GROQ_API_KEY not set — RAG generation will use fallback mode"
        )


async def generate_answer(
    query: str, doc_id: Optional[str] = None
) -> dict:
    """
    Full RAG pipeline:
    1. Embed the user query
    2. Search Endee for relevant document chunks
    3. Build context from top-k results
    4. Generate answer using Groq (or fallback)

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

        # Filter out extremely low-relevance matches (e.g., conversational "hii")
        if score < 0.25:
            continue

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

    if not sources:
        return {
            "answer": "I couldn't find any relevant information in the uploaded documents. Please make sure your question is related to the documents.",
            "sources": [],
            "query": query,
        }

    context = "\n\n---\n\n".join(context_parts)

    # Trim context to max length
    if len(context) > settings.MAX_CONTEXT_LENGTH:
        context = context[: settings.MAX_CONTEXT_LENGTH] + "\n\n[Context truncated...]"

    # Step 4: Generate answer
    prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=query)

    try:
        if settings.GROQ_API_KEY:
            answer = await _call_groq(prompt)
        else:
            answer = _fallback_answer(query, sources, context_parts)
    except Exception as e:
        logger.error(f"LLM generation error: {e}")
        error_msg = str(e)
        
        # Pass meaningful API errors to the frontend
        if "429" in error_msg or "rate_limit" in error_msg.lower():
            answer = f"⚠️ **Groq API Error:** Your API key has exceeded its rate limit. Please wait and try again."
        elif "authentication" in error_msg.lower() or "401" in error_msg or "403" in error_msg:
            answer = f"⚠️ **Groq API Error:** The provided API key is invalid. Please check your `.env` file."
        else:
            answer = _fallback_answer(query, sources, context_parts)

    return {
        "answer": answer,
        "sources": sources,
        "query": query,
    }


async def _call_groq(prompt: str) -> str:
    """Call Groq API for answer generation."""
    client = Groq(api_key=settings.GROQ_API_KEY)
    response = client.chat.completions.create(
        messages=[
            {"role": "user", "content": prompt}
        ],
        model=settings.GROQ_MODEL,
        temperature=0.2, # Low temperature for more factual responses
    )
    return response.choices[0].message.content


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
        f"**Search Results for:** *\"{query}\"*\n",
    ]

    for i, (source, text) in enumerate(zip(sources, context_parts)):
        score_pct = round(source["relevance_score"] * 100, 1)
        answer_parts.append(
            f"**Source {i + 1}** — *{source['filename']}* (Relevance: {score_pct}%)\n"
            f"> {source['text_preview'][:200]}...\n"
        )

    answer_parts.append(
        "\n*💡 Tip: Set the `GROQ_API_KEY` environment variable to enable AI-generated answers.*"
    )

    return "\n".join(answer_parts)
