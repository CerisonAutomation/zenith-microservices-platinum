"""Supabase Storage Service for ZENITH"""
import os
import logging
from typing import Optional, BinaryIO
from supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

class SupabaseStorageService:
    """Manages file uploads and downloads to Supabase Storage"""

    def __init__(self):
        self.supabase = get_supabase_client()
        self.supabase_url = os.getenv("SUPABASE_URL")

        # Bucket names (these will be created in Supabase dashboard)
        self.buckets = {
            "profile_images": "profile-images",
            "profile_documents": "profile-documents",
            "chat_media": "chat-media",
            "chat_attachments": "chat-attachments",
            "uploads": "uploads",
        }

        logger.info("Supabase Storage Service initialized")

    def upload_file(
        self,
        file: BinaryIO,
        bucket_type: str,
        file_name: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Upload file to Supabase Storage

        Args:
            file: File-like object to upload
            bucket_type: Type of bucket (profile_images, chat_media, etc.)
            file_name: Name/key for the file
            content_type: MIME type of the file
            metadata: Optional metadata dictionary

        Returns:
            Public URL of uploaded file or None if failed
        """
        try:
            bucket_name = self.buckets.get(bucket_type)
            if not bucket_name:
                logger.error(f"Unknown bucket type: {bucket_type}")
                return None

            # Read file content
            file_content = file.read()
            if hasattr(file, 'seek'):
                file.seek(0)  # Reset file pointer

            # Upload to Supabase Storage
            response = self.supabase.storage.from_(bucket_name).upload(
                file_name,
                file_content,
                file_options={
                    "content-type": content_type,
                    "cache-control": "3600"
                }
            )

            if response.status_code == 200:
                # Get public URL
                public_url = self.supabase.storage.from_(bucket_name).get_public_url(file_name)
                logger.info(f"File uploaded successfully: {file_name}")
                return public_url
            else:
                logger.error(f"Upload failed with status: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Upload error: {e}")
            return None

    def download_file(self, bucket_type: str, file_name: str) -> Optional[bytes]:
        """
        Download file from Supabase Storage

        Args:
            bucket_type: Type of bucket
            file_name: Name/key of the file

        Returns:
            File content as bytes or None if failed
        """
        try:
            bucket_name = self.buckets.get(bucket_type)
            if not bucket_name:
                logger.error(f"Unknown bucket type: {bucket_type}")
                return None

            response = self.supabase.storage.from_(bucket_name).download(file_name)

            if response:
                return response
            else:
                logger.error(f"Download failed for: {file_name}")
                return None

        except Exception as e:
            logger.error(f"Download error: {e}")
            return None

    def delete_file(self, bucket_type: str, file_name: str) -> bool:
        """
        Delete file from Supabase Storage

        Args:
            bucket_type: Type of bucket
            file_name: Name/key of the file

        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            bucket_name = self.buckets.get(bucket_type)
            if not bucket_name:
                logger.error(f"Unknown bucket type: {bucket_type}")
                return False

            response = self.supabase.storage.from_(bucket_name).remove([file_name])

            if response and len(response) > 0:
                logger.info(f"File deleted successfully: {file_name}")
                return True
            else:
                logger.error(f"Delete failed for: {file_name}")
                return False

        except Exception as e:
            logger.error(f"Delete error: {e}")
            return False

    def list_files(self, bucket_type: str, path: str = "") -> list:
        """
        List files in a bucket path

        Args:
            bucket_type: Type of bucket
            path: Path prefix to list

        Returns:
            List of file names
        """
        try:
            bucket_name = self.buckets.get(bucket_type)
            if not bucket_name:
                logger.error(f"Unknown bucket type: {bucket_type}")
                return []

            response = self.supabase.storage.from_(bucket_name).list(path=path)

            if response:
                return [file.get('name', '') for file in response if file.get('name')]
            else:
                return []

        except Exception as e:
            logger.error(f"List files error: {e}")
            return []


# Global instance
_storage_service = None

def get_supabase_storage_service() -> SupabaseStorageService:
    """Get singleton instance of Supabase storage service"""
    global _storage_service
    if _storage_service is None:
        _storage_service = SupabaseStorageService()
    return _storage_service