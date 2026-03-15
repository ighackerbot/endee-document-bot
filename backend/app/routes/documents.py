"""
Document Management Routes — upload, list, and delete documents.
"""
import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import settings
from app.services.document_processor import (
    process_document,
    get_all_documents,
    delete_document,
    get_document,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload a document for processing.
    Supports PDF, DOCX, TXT, and MD files.

    The document is extracted, chunked, embedded, and stored in Endee.
    """
    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}",
        )

    # Validate file size
    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"File too large: {size_mb:.1f}MB. Maximum: {settings.MAX_FILE_SIZE_MB}MB",
        )

    # Save to uploads directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    try:
        result = await process_document(file_path, file.filename)
        return {
            "status": "success",
            "message": f"Document '{file.filename}' processed successfully",
            "document": result,
        }
    except ValueError as e:
        # Clean up file on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Document processing failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to process document: {str(e)}"
        )


@router.get("")
async def list_documents():
    """List all uploaded and processed documents."""
    docs = get_all_documents()
    return {
        "status": "success",
        "count": len(docs),
        "documents": docs,
    }


@router.get("/{doc_id}")
async def get_document_info(doc_id: str):
    """Get details of a specific document."""
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "status": "success",
        "document": {
            "id": doc["id"],
            "filename": doc["filename"],
            "file_size": doc["file_size"],
            "num_chunks": doc["num_chunks"],
            "total_characters": doc["total_characters"],
            "uploaded_at": doc["uploaded_at"],
        },
    }


@router.delete("/{doc_id}")
async def remove_document(doc_id: str):
    """Delete a document and all its vectors from Endee."""
    success = delete_document(doc_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "status": "success",
        "message": f"Document {doc_id} deleted successfully",
    }
