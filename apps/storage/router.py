"""File upload endpoints for ZENITH using Supabase Storage"""
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel

from storage.supabase_storage import get_supabase_storage_service

logger = logging.getLogger(__name__)

router = APIRouter()


class UploadResponse(BaseModel):
    """Response for file upload"""
    success: bool
    url: Optional[str] = None
    error: Optional[str] = None


@router.post("/upload/profile-image", response_model=UploadResponse, tags=["Uploads"])
async def upload_profile_image(file: UploadFile = File(...)):
    """
    Upload profile image to S3
    
    Supported: JPEG, PNG, WebP
    Max: 5 MB
    """
    try:
        # Validate file type
        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Validate file size (5 MB)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max: 5 MB")
        
        # Generate unique filename
        import uuid
        from io import BytesIO
        unique_name = f"profiles/{uuid.uuid4()}_{file.filename}"
        
        # Upload to Supabase Storage
        storage_service = get_supabase_storage_service()
        file_obj = BytesIO(content)
        url = storage_service.upload_file(
            file_obj,
            "profile_images",
            unique_name,
            content_type=file.content_type,
        )
        
        if not url:
            raise HTTPException(status_code=500, detail="Upload failed")
        
        return UploadResponse(success=True, url=url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return UploadResponse(success=False, error=str(e))


@router.post("/upload/chat-media", response_model=UploadResponse, tags=["Uploads"])
async def upload_chat_media(file: UploadFile = File(...)):
    """
    Upload chat media (video, audio, gif) to S3
    
    Supported: MP4, WebM, QuickTime, MP3, WAV, OGG, WebM, GIF
    Max: 50 MB
    """
    try:
        # Validate file type
        allowed_types = {
            "video/mp4", "video/webm", "video/quicktime",
            "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm",
            "image/gif"
        }
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Validate file size (50 MB)
        content = await file.read()
        if len(content) > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max: 50 MB")
        
        # Generate unique filename
        import uuid
        from io import BytesIO
        unique_name = f"chat-media/{uuid.uuid4()}_{file.filename}"
        
        # Upload to Supabase Storage
        storage_service = get_supabase_storage_service()
        file_obj = BytesIO(content)
        url = storage_service.upload_file(
            file_obj,
            "chat_media",
            unique_name,
            content_type=file.content_type,
        )
        
        if not url:
            raise HTTPException(status_code=500, detail="Upload failed")
        
        return UploadResponse(success=True, url=url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return UploadResponse(success=False, error=str(e))


@router.post("/upload/document", response_model=UploadResponse, tags=["Uploads"])
async def upload_document(file: UploadFile = File(...)):
    """
    Upload document (PDF, Word, Excel, etc) to S3
    
    Supported: PDF, DOCX, XLSX, PPTX, TXT, ZIP
    Max: 25 MB
    """
    try:
        # Validate file type
        allowed_types = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "text/plain",
            "application/zip"
        }
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Validate file size (25 MB)
        content = await file.read()
        if len(content) > 25 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max: 25 MB")
        
        # Generate unique filename
        import uuid
        from io import BytesIO
        unique_name = f"documents/{uuid.uuid4()}_{file.filename}"
        
        # Upload to Supabase Storage
        storage_service = get_supabase_storage_service()
        file_obj = BytesIO(content)
        url = storage_service.upload_file(
            file_obj,
            "profile_documents",
            unique_name,
            content_type=file.content_type,
        )
        
        if not url:
            raise HTTPException(status_code=500, detail="Upload failed")
        
        return UploadResponse(success=True, url=url)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return UploadResponse(success=False, error=str(e))


@router.get("/files/{bucket_type}", tags=["Uploads"])
async def list_files(bucket_type: str):
    """List all files in a bucket"""
    try:
        storage_service = get_supabase_storage_service()
        files = storage_service.list_files(bucket_type)
        return {"success": True, "count": len(files), "files": files}
    except Exception as e:
        logger.error(f"List error: {e}")
        return {"success": False, "error": str(e)}
