"""
Zenith Shared Utilities
Common utility functions used across all services
"""

import hashlib
import hmac
import secrets
import string
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
import json
import re

# Conditional imports for optional dependencies
try:
    from passlib.hash import bcrypt
    BCRYPT_AVAILABLE = True
except ImportError:
    BCRYPT_AVAILABLE = False

try:
    from cryptography.fernet import Fernet
    FERNET_AVAILABLE = True
except ImportError:
    FERNET_AVAILABLE = False

try:
    import qrcode
    QRCODE_AVAILABLE = True
except ImportError:
    QRCODE_AVAILABLE = False

try:
    import phonenumbers
    PHONENUMBERS_AVAILABLE = True
except ImportError:
    PHONENUMBERS_AVAILABLE = False

def generate_secure_token(length: int = 32) -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(length)

def generate_api_key() -> str:
    """Generate an API key"""
    return f"zk_{secrets.token_urlsafe(32)}"

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    if not BCRYPT_AVAILABLE:
        raise ImportError("bcrypt is required for password hashing")
    return bcrypt.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    if not BCRYPT_AVAILABLE:
        raise ImportError("bcrypt is required for password verification")
    return bcrypt.verify(password, hashed)

def generate_otp_secret() -> str:
    """Generate a TOTP secret"""
    import base64
    return base64.b32encode(secrets.token_bytes(20)).decode('utf-8')

def generate_backup_codes(count: int = 10) -> List[str]:
    """Generate backup codes for account recovery"""
    codes = []
    for _ in range(count):
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        codes.append(code)
    return codes

def hash_backup_code(code: str) -> str:
    """Hash a backup code for storage"""
    return hashlib.sha256(code.encode()).hexdigest()

def verify_backup_code(hashed_code: str, provided_code: str) -> bool:
    """Verify a backup code against its hash"""
    return hmac.compare_digest(hashed_code, hash_backup_code(provided_code))

def encrypt_data(data: str, key: str) -> str:
    """Encrypt data using Fernet"""
    if not FERNET_AVAILABLE:
        raise ImportError("cryptography is required for data encryption")
    f = Fernet(key.encode())
    return f.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str, key: str) -> str:
    """Decrypt data using Fernet"""
    if not FERNET_AVAILABLE:
        raise ImportError("cryptography is required for data decryption")
    f = Fernet(key.encode())
    return f.decrypt(encrypted_data.encode()).decode()

def generate_qr_code(data: str) -> str:
    """Generate QR code as base64 string"""
    if not QRCODE_AVAILABLE:
        raise ImportError("qrcode is required for QR code generation")
    import qrcode
    import io
    import base64

    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    img.save(buffer, "PNG")
    return base64.b64encode(buffer.getvalue()).decode()

def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    if PHONENUMBERS_AVAILABLE:
        try:
            import phonenumbers
            parsed = phonenumbers.parse(phone)
            return phonenumbers.is_valid_number(parsed)
        except:
            pass
    # Fallback to basic validation
    pattern = r'^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$'
    return bool(re.match(pattern, phone))

def sanitize_html(text: str) -> str:
    """Sanitize HTML content"""
    # Basic HTML sanitization - remove script tags and dangerous attributes
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    return text

def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate text to specified length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix

def format_currency(amount: float, currency: str = "USD") -> str:
    """Format currency amount"""
    return f"{currency} {amount:.2f}"

def calculate_age(birth_date: datetime) -> int:
    """Calculate age from birth date"""
    today = datetime.utcnow()
    age = today.year - birth_date.year
    if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
        age -= 1
    return age

def is_adult(birth_date: datetime, min_age: int = 18) -> bool:
    """Check if person is of adult age"""
    return calculate_age(birth_date) >= min_age

def generate_slug(text: str) -> str:
    """Generate URL slug from text"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    return text.strip('-')

def parse_json_safely(json_str: str, default: Any = None) -> Any:
    """Safely parse JSON string"""
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default

def serialize_to_json(data: Any) -> str:
    """Serialize data to JSON string"""
    try:
        return json.dumps(data, default=str)
    except (TypeError, ValueError):
        return "{}"

def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return filename.split('.')[-1].lower() if '.' in filename else ''

def is_allowed_file(filename: str, allowed_extensions: List[str]) -> bool:
    """Check if file extension is allowed"""
    return get_file_extension(filename) in allowed_extensions

def generate_presigned_url(bucket: str, key: str, expiration: int = 3600) -> str:
    """Generate presigned URL for file access (placeholder)"""
    # This would integrate with cloud storage providers
    return f"https://{bucket}.s3.amazonaws.com/{key}?expires={expiration}"

def calculate_similarity(text1: str, text2: str) -> float:
    """Calculate text similarity (simple implementation)"""
    # This is a basic implementation - could be enhanced with ML models
    words1 = set(text1.lower().split())
    words2 = set(text2.lower().split())

    intersection = words1.intersection(words2)
    union = words1.union(words2)

    return len(intersection) / len(union) if union else 0.0

def rate_limit_key(identifier: str, action: str) -> str:
    """Generate rate limit key"""
    return f"rate_limit:{action}:{identifier}"

def cache_key(prefix: str, *args) -> str:
    """Generate cache key"""
    key_parts = [prefix] + [str(arg) for arg in args]
    return ":".join(key_parts)

def pagination_info(page: int, per_page: int, total: int) -> Dict[str, Any]:
    """Calculate pagination information"""
    pages = (total + per_page - 1) // per_page  # Ceiling division
    return {
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "has_next": page < pages,
        "has_prev": page > 1,
        "next_page": page + 1 if page < pages else None,
        "prev_page": page - 1 if page > 1 else None,
    }