import re
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator


def normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    # Strip spaces, hyphens, parentheses
    cleaned = re.sub(r"[\s\-\(\)\+]", "", phone.strip())
    # Strip leading country code 91 if 12 digits
    if cleaned.startswith("91") and len(cleaned) == 12:
        cleaned = cleaned[2:]
    elif cleaned.startswith("0") and len(cleaned) == 11:
        cleaned = cleaned[1:]
    return cleaned


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password at least 8 chars")
    confirm_password: Optional[str] = Field(default=None, description="Password confirmation")
    display_name: str = Field(..., min_length=2, max_length=100)
    preferred_language: str = Field(default="en")
    phone_number: Optional[str] = Field(default=None, description="User's mobile number")
    parent_phone_number: Optional[str] = Field(default=None, description="Parent/guardian mobile number")

    @model_validator(mode="after")
    def validate_passwords_and_phones(self):
        if self.confirm_password is not None and self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")

        norm_user_phone = normalize_phone(self.phone_number)
        norm_parent_phone = normalize_phone(self.parent_phone_number)

        if norm_user_phone and norm_parent_phone:
            if norm_user_phone == norm_parent_phone:
                raise ValueError("User's mobile number and parent/guardian mobile number must differ.")

        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    preferred_language: str
    avatar: str
    phone_number: Optional[str] = None
    parent_phone_number: Optional[str] = None
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


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10, description="6-digit verification code")


class ResendOtpRequest(BaseModel):
    email: EmailStr


class OtpResponse(BaseModel):
    status: str
    message: str
    email: str
    resend_cooldown_seconds: int = 60


class ResendVerificationRequest(BaseModel):
    email: EmailStr


