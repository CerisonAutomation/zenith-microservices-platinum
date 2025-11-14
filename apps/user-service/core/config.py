"""
Zenith Backend Configuration
Enterprise-grade configuration management with Pydantic v2 settings
"""

import os
import secrets
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator

class Settings(BaseModel):
    """Application settings with validation"""

    # Application
    app_name: str = Field(default="Zenith Backend", alias="APP_NAME")
    version: str = Field(default="2.0.0", alias="VERSION")
    debug: bool = Field(default=False, alias="DEBUG")
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32), alias="SECRET_KEY")

    # Server
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    workers: int = Field(default=4, alias="WORKERS")

    # Database
    database_url: str = Field(default="postgresql://localhost/zenith", alias="DATABASE_URL")
    db_pool_size: int = Field(default=20, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(default=30, alias="DB_MAX_OVERFLOW")
    db_pool_recycle: int = Field(default=3600, alias="DB_POOL_RECYCLE")

    # Redis Cache
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")
    cache_ttl: int = Field(default=3600, alias="CACHE_TTL")

    # JWT
    jwt_secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32), alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(default=30, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(default=7, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS")

    # CORS
    cors_origins: List[str] = Field(default=["http://localhost:3000"], alias="CORS_ORIGINS")

    # Security
    allowed_hosts: List[str] = Field(default=["*"], alias="ALLOWED_HOSTS")
    rate_limit_requests: int = Field(default=100, alias="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=60, alias="RATE_LIMIT_WINDOW")

    # Email
    smtp_server: str = Field(default="smtp.gmail.com", alias="SMTP_SERVER")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_username: Optional[str] = Field(default=None, alias="SMTP_USERNAME")
    smtp_password: Optional[str] = Field(default=None, alias="SMTP_PASSWORD")
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")
    from_email: str = Field(default="noreply@zenithdating.com", alias="FROM_EMAIL")

    # SMS
    sms_provider: str = Field(default="twilio", alias="SMS_PROVIDER")
    sms_account_sid: Optional[str] = Field(default=None, alias="SMS_ACCOUNT_SID")
    sms_auth_token: Optional[str] = Field(default=None, alias="SMS_AUTH_TOKEN")
    sms_from_number: Optional[str] = Field(default=None, alias="SMS_FROM_NUMBER")

    # Payment
    stripe_secret_key: Optional[str] = Field(default=None, alias="STRIPE_SECRET_KEY")
    stripe_webhook_secret: Optional[str] = Field(default=None, alias="STRIPE_WEBHOOK_SECRET")
    stripe_publishable_key: Optional[str] = Field(default=None, alias="STRIPE_PUBLISHABLE_KEY")

    # Supabase
    supabase_url: Optional[str] = Field(default=None, alias="SUPABASE_URL")
    supabase_anon_key: Optional[str] = Field(default=None, alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: Optional[str] = Field(default=None, alias="SUPABASE_SERVICE_ROLE_KEY")

    # Monitoring
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # File Upload
    max_upload_size: int = Field(default=10 * 1024 * 1024, alias="MAX_UPLOAD_SIZE")  # 10MB
    upload_dir: str = Field(default="uploads", alias="UPLOAD_DIR")
    allowed_extensions: List[str] = Field(default=["jpg", "jpeg", "png", "gif", "mp4", "pdf"], alias="ALLOWED_EXTENSIONS")

    # Elasticsearch
    elasticsearch_hosts: List[str] = Field(default=["http://localhost:9200"], alias="ELASTICSEARCH_HOSTS")
    elasticsearch_user: Optional[str] = Field(default=None, alias="ELASTICSEARCH_USER")
    elasticsearch_password: Optional[str] = Field(default=None, alias="ELASTICSEARCH_PASSWORD")
    elasticsearch_timeout: int = Field(default=30, alias="ELASTICSEARCH_TIMEOUT")
    elasticsearch_max_retries: int = Field(default=3, alias="ELASTICSEARCH_MAX_RETRIES")
    elasticsearch_index_prefix: str = Field(default="zenith", alias="ELASTICSEARCH_INDEX_PREFIX")

    # Feature Flags
    enable_2fa: bool = Field(default=True, alias="ENABLE_2FA")
    enable_payments: bool = Field(default=True, alias="ENABLE_PAYMENTS")
    enable_notifications: bool = Field(default=True, alias="ENABLE_NOTIFICATIONS")

    @field_validator('elasticsearch_hosts', mode='before')
    @classmethod
    def parse_elasticsearch_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(',')]
        return v

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    @field_validator('allowed_hosts', mode='before')
    @classmethod
    def parse_allowed_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(',')]
        return v

    @field_validator('allowed_extensions', mode='before')
    @classmethod
    def parse_allowed_extensions(cls, v):
        if isinstance(v, str):
            return [ext.strip().lower() for ext in v.split(',')]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True
        case_sensitive = False

# Global settings instance
settings = Settings()