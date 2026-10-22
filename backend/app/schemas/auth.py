from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password at least 8 chars")
    display_name: str = Field(..., min_length=2, max_length=50)
    preferred_language: str = Field(default="en")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    preferred_language: str
    avatar: str
    is_verified: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse
    verification_required: bool = False
    message: Optional[str] = None


class VerifyEmailResponse(BaseModel):
    status: str
    message: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr

