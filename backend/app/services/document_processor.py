"""
Document Processor — handles file reading, text extraction,
chunking, embedding, and ingestion into Endee.
"""
import os
import uuid
import logging
from datetime import datetime, timezone
from pathlib import Path

from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from langchain_text_splitters import RecursiveCharacterTextSplitter

import cloudinary.uploader
from app.config import settings
from app.services.embeddings import embedding_service
from app.services.endee_service import endee_service

logger = logging.getLogger(__name__)

# ── In-memory document registry (production would use a DB) ────────
documents_store: dict[str, dict] = {}

import io

def extract_text_from_pdf(contents: bytes) -> str:
    """Extract all text from a PDF file in memory."""
    reader = PdfReader(io.BytesIO(contents))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_text_from_docx(contents: bytes) -> str:
    """Extract all text from a DOCX file in memory."""
    doc = DocxDocument(io.BytesIO(contents))
    return "\n\n".join(para.text for para in doc.paragraphs if para.text.strip())


def extract_text_from_txt(contents: bytes) -> str:
    """Read a plain text or markdown file from memory."""
    return contents.decode("utf-8", errors="ignore")


def extract_text(contents: bytes, filename: str) -> str:
    """
    Detect file type and extract text accordingly.

    Supported: .pdf, .docx, .txt, .md
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        return extract_text_from_pdf(contents)
    elif ext == ".docx":
        return extract_text_from_docx(contents)
    elif ext in (".txt", ".md"):
        return extract_text_from_txt(contents)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def chunk_text(text: str) -> list[str]:
    """
    Split text into overlapping chunks for optimal retrieval.

    Uses recursive character splitting to respect sentence boundaries.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(text)
    # Filter out very small chunks (< 20 chars)
    return [c for c in chunks if len(c.strip()) >= 20]


async def process_document(contents: bytes, filename: str, file_url: str = "", public_id: str = "") -> dict:
    """
    Full document ingestion pipeline:
    1. Extract text from file contents
    2. Split into chunks with overlap
    3. Generate embeddings for each chunk
    4. Store embeddings + metadata in Endee
    5. Save cloud URL in store

    Returns:
        Document metadata dict
    """
    doc_id = str(uuid.uuid4())[:12]

    logger.info(f"Processing document: {filename} (id={doc_id})")

    # Step 1: Extract text
    text = extract_text(contents, filename)
    if not text.strip():
        raise ValueError("No text could be extracted from the document")

    logger.info(f"Extracted {len(text)} characters from {filename}")

    # Step 2: Chunk the text
    chunks = chunk_text(text)
    if not chunks:
        raise ValueError("Document produced no valid chunks after splitting")

    logger.info(f"Created {len(chunks)} chunks from {filename}")

    # Step 3: Generate embeddings
    vectors = embedding_service.embed_batch(chunks)

    # Step 4: Prepare metadata and IDs
    chunk_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
    metadata_list = [
        {
            "doc_id": doc_id,
            "filename": filename,
            "chunk_index": i,
            "text": chunk[:200],  # Store first 200 chars as preview in metadata
            "total_chunks": len(chunks),
        }
        for i, chunk in enumerate(chunks)
    ]

    # Step 5: Upsert to Endee
    endee_service.upsert_chunks(chunk_ids, vectors, metadata_list)

    # Step 6: Register document in memory store
    file_size = len(contents)
    doc_info = {
        "id": doc_id,
        "filename": filename,
        "file_size": file_size,
        "num_chunks": len(chunks),
        "total_characters": len(text),
        "uploaded_at": datetime.now(timezone.utc).isoformat(),
        "file_url": file_url,
        "public_id": public_id,
        "chunks": chunks,  # Keep full chunks for RAG context
    }
    documents_store[doc_id] = doc_info

    logger.info(
        f"Document {filename} processed: {len(chunks)} chunks stored in Endee"
    )

    return {
        "id": doc_id,
        "filename": filename,
        "file_size": file_size,
        "num_chunks": len(chunks),
        "total_characters": len(text),
        "uploaded_at": doc_info["uploaded_at"],
        "file_url": file_url
    }


def get_all_documents() -> list[dict]:
    """Return metadata for all stored documents."""
    return [
        {
            "id": doc["id"],
            "filename": doc["filename"],
            "file_size": doc["file_size"],
            "num_chunks": doc["num_chunks"],
            "total_characters": doc["total_characters"],
            "uploaded_at": doc["uploaded_at"],
            "file_url": doc.get("file_url", ""),
        }
        for doc in documents_store.values()
    ]


def get_document(doc_id: str) -> dict | None:
    """Get full document info including chunks."""
    return documents_store.get(doc_id)


def delete_document(doc_id: str) -> bool:
    """Delete a document and its vectors from Endee."""
    if doc_id not in documents_store:
        return False

    doc = documents_store[doc_id]

    # Delete vectors from Endee
    endee_service.delete_by_document(doc_id)

    # Delete the file from Cloudinary
    try:
        if doc.get("public_id"):
            cloudinary.uploader.destroy(doc["public_id"], resource_type="raw")
    except Exception as e:
        logger.warning(f"Error removing document from Cloudinary: {e}")

    # Remove from memory store
    del documents_store[doc_id]
    logger.info(f"Deleted document {doc_id}: {doc['filename']}")

    return True
