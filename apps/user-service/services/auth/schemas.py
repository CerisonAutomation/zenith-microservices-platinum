from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional
from datetime import datetime
import re

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: Optional[str] = "user"
    accept_terms: bool = Field(..., description="Must accept terms and conditions")

    @validator('password')
    def password_strength(cls, v):
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]', v):
            raise ValueError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: Optional[bool] = False

class TokenRefresh(BaseModel):
    refresh_token: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    two_factor_enabled: Optional[bool] = None

class UserOut(BaseModel):
    id: str
    email: EmailStr
    role: str
    is_active: bool
    is_verified: bool
    two_factor_enabled: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        orm_mode = True

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

    @validator('new_password')
    def password_strength(cls, v):
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]', v):
            raise ValueError('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
        return v

class EmailVerification(BaseModel):
    token: str

class TwoFactorSetup(BaseModel):
    secret: str
    qr_code: str

class TwoFactorVerify(BaseModel):
    code: str

class GDPRConsentCreate(BaseModel):
    consent_type: str
    consented: bool

class GDPRConsentOut(BaseModel):
    id: int
    user_id: str
    consent_type: str
    consented: bool
    consent_date: datetime

    class Config:
        orm_mode = True

class UserSessionOut(BaseModel):
    id: str
    device_info: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    expires_at: datetime
    is_active: bool

    class Config:
        orm_mode = True
