"""AWS S3 Storage Service for ZENITH"""
import os
import logging
from typing import Optional, BinaryIO
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class S3StorageService:
    """Manages file uploads and downloads to AWS S3"""
    
    def __init__(self):
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.aws_endpoint = os.getenv("AWS_S3_ENDPOINT")
        
        # Initialize S3 client
        self.s3_client = boto3.client(
            "s3",
            aws_access_key_id=self.aws_access_key,
            aws_secret_access_key=self.aws_secret_key,
            region_name=self.aws_region,
            endpoint_url=self.aws_endpoint,
        )
        
        # Bucket names from environment
        self.buckets = {
            "profile_images": os.getenv("S3_BUCKET_PROFILE_IMAGES", "profile-images"),
            "profile_documents": os.getenv("S3_BUCKET_PROFILE_DOCUMENTS", "profile-documents"),
            "chat_media": os.getenv("S3_BUCKET_CHAT_MEDIA", "chat-media"),
            "chat_attachments": os.getenv("S3_BUCKET_CHAT_ATTACHMENTS", "chat-attachments"),
            "uploads": os.getenv("S3_BUCKET_UPLOADS", "uploads"),
        }
        
        logger.info(f"S3 Service initialized with region: {self.aws_region}")
    
    def upload_file(
        self,
        file: BinaryIO,
        bucket_type: str,
        file_name: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Upload file to S3
        
        Args:
            file: File object to upload
            bucket_type: Type of bucket (profile_images, chat_media, etc.)
            file_name: Name to save file as
            content_type: MIME type of file
            metadata: Additional metadata
            
        Returns:
            S3 URL of uploaded file or None if failed
        """
        try:
            bucket = self.buckets.get(bucket_type)
            if not bucket:
                logger.error(f"Unknown bucket type: {bucket_type}")
                return None
            
            extra_args = {
                "ContentType": content_type,
            }
            
            if metadata:
                extra_args["Metadata"] = metadata
            
            self.s3_client.upload_fileobj(
                file,
                bucket,
                file_name,
                ExtraArgs=extra_args,
            )
            
            # Generate S3 URL
            url = self._generate_url(bucket, file_name)
            logger.info(f"✅ File uploaded: {file_name} to {bucket}")
            return url
            
        except ClientError as e:
            logger.error(f"❌ S3 upload error: {e}")
            return None
        except Exception as e:
            logger.error(f"❌ Unexpected upload error: {e}")
            return None
    
    def delete_file(self, bucket_type: str, file_name: str) -> bool:
        """Delete file from S3"""
        try:
            bucket = self.buckets.get(bucket_type)
            if not bucket:
                logger.error(f"Unknown bucket type: {bucket_type}")
                return False
            
            self.s3_client.delete_object(Bucket=bucket, Key=file_name)
            logger.info(f"✅ File deleted: {file_name} from {bucket}")
            return True
            
        except ClientError as e:
            logger.error(f"❌ S3 delete error: {e}")
            return False
    
    def get_file_url(self, bucket_type: str, file_name: str) -> Optional[str]:
        """Get URL for file in S3"""
        try:
            bucket = self.buckets.get(bucket_type)
            if not bucket:
                return None
            
            return self._generate_url(bucket, file_name)
            
        except Exception as e:
            logger.error(f"❌ Error getting file URL: {e}")
            return None
    
    def _generate_url(self, bucket: str, file_name: str) -> str:
        """Generate S3 URL for file"""
        if self.aws_endpoint:
            # Custom endpoint (e.g., MinIO, DigitalOcean Spaces)
            return f"{self.aws_endpoint}/{bucket}/{file_name}"
        else:
            # AWS S3
            return f"https://{bucket}.s3.{self.aws_region}.amazonaws.com/{file_name}"
    
    def create_presigned_url(
        self,
        bucket_type: str,
        file_name: str,
        expiration: int = 3600,
    ) -> Optional[str]:
        """Generate presigned URL for temporary access (useful for private files)"""
        try:
            bucket = self.buckets.get(bucket_type)
            if not bucket:
                return None
            
            url = self.s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket, "Key": file_name},
                ExpiresIn=expiration,
            )
            return url
            
        except ClientError as e:
            logger.error(f"❌ Error generating presigned URL: {e}")
            return None
    
    def list_files(self, bucket_type: str, prefix: str = "") -> list:
        """List files in bucket"""
        try:
            bucket = self.buckets.get(bucket_type)
            if not bucket:
                return []
            
            response = self.s3_client.list_objects_v2(
                Bucket=bucket,
                Prefix=prefix,
            )
            
            files = []
            if "Contents" in response:
                for obj in response["Contents"]:
                    files.append({
                        "key": obj["Key"],
                        "size": obj["Size"],
                        "last_modified": obj["LastModified"],
                    })
            
            return files
            
        except ClientError as e:
            logger.error(f"❌ Error listing files: {e}")
            return []


# Initialize service (lazy)
_s3_service: Optional[S3StorageService] = None

def get_s3_service() -> S3StorageService:
    """Get S3 service instance"""
    global _s3_service
    if _s3_service is None:
        _s3_service = S3StorageService()
    return _s3_service
