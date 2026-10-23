import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from backend.app.core.config import settings
from backend.app.models.user import User
from backend.app.schemas.auth import (
    UserRegister,
    UserLogin,
    UserResponse,
    TokenResponse,
    VerifyEmailResponse,
    ResendVerificationRequest,
    VerifyOtpRequest,
    ResendOtpRequest,
    OtpResponse,
    normalize_phone,
)
from backend.app.api.deps import get_current_user
from backend.app.services.email import EmailService, EmailDeliveryError

router = APIRouter(prefix="/auth", tags=["Authentication"])


def hash_otp(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user account with cryptographic email OTP verification."""
    existing = await db.execute(select(User).where(User.email == user_in.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Auto-guest accounts (guest_...@aifriend.org) are pre-verified for seamless testing
    is_guest = user_in.email.lower().startswith("guest_")
    needs_verification = settings.REQUIRE_EMAIL_VERIFICATION and not is_guest

    verification_token = secrets.token_urlsafe(32) if needs_verification else None
    token_expires_at = (
        datetime.now(timezone.utc) + timedelta(hours=24)
        if needs_verification
        else None
    )

    # Cryptographically secure 6-digit OTP
    otp_code = None
    otp_hash = None
    otp_expires = None
    if needs_verification:
        otp_int = secrets.randbelow(900000) + 100000
        otp_code = str(otp_int)
        otp_hash = hash_otp(otp_code)
        otp_expires = datetime.now(timezone.utc) + timedelta(minutes=5)

    user = User(
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        display_name=user_in.display_name,
        preferred_language=user_in.preferred_language,
        phone_number=normalize_phone(user_in.phone_number),
        parent_phone_number=normalize_phone(user_in.parent_phone_number),
        is_verified=not needs_verification,
        verification_token=verification_token,
        verification_token_expires_at=token_expires_at,
        otp_code_hash=otp_hash,
        otp_expires_at=otp_expires,
        otp_attempts=0,
        otp_last_sent_at=datetime.now(timezone.utc) if needs_verification else None,
    )
    db.add(user)

    if needs_verification and otp_code:
        try:
            await EmailService.send_otp_email(
                recipient_email=user.email,
                otp_code=otp_code,
                display_name=user.display_name,
            )
        except EmailDeliveryError as e:
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to deliver verification code: {str(e)}",
            )

    await db.commit()
    await db.refresh(user)

    token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    msg = (
        "We've sent a 6-digit verification code to your email. Please verify your account to continue."
        if needs_verification
        else "Account registered successfully."
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
        verification_required=needs_verification,
        message=msg,
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(payload: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    """Validates the 6-digit OTP code, checks attempt limits, enforces 5-min expiry, and activates the user."""
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found.",
        )

    if user.is_verified:
        token = create_access_token(
            data={"sub": user.id, "email": user.email},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
            verification_required=False,
            message="Account is already verified.",
        )

    # Check attempt limit (max 5)
    if (user.otp_attempts or 0) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many incorrect OTP attempts. Please request a new code.",
        )

    # Check expiry
    now = datetime.now(timezone.utc)
    if user.otp_expires_at:
        expires_at = user.otp_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code.",
            )

    # Check OTP hash
    entered_hash = hash_otp(payload.otp.strip())
    if user.otp_code_hash != entered_hash:
        user.otp_attempts = (user.otp_attempts or 0) + 1
        await db.commit()
        remaining = max(0, 5 - user.otp_attempts)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining.",
        )

    # Successful verification
    user.is_verified = True
    user.otp_code_hash = None
    user.otp_expires_at = None
    user.otp_attempts = 0
    user.verification_token = None
    user.verification_token_expires_at = None
    await db.commit()
    await db.refresh(user)

    token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
        verification_required=False,
        message="Email successfully verified! Welcome to AI Friend.",
    )


@router.post("/resend-otp", response_model=OtpResponse)
async def resend_otp(payload: ResendOtpRequest, db: AsyncSession = Depends(get_db)):
    """Resend a new 6-digit OTP code with a 60-second rate-limiting cooldown."""
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if not user:
        # Prevent email enumeration with generic successful response
        return OtpResponse(
            status="success",
            message="If an account exists with this email, a new verification code has been sent.",
            email=payload.email.lower(),
        )

    if user.is_verified:
        return OtpResponse(
            status="success",
            message="Account is already verified. You can log in directly.",
            email=payload.email.lower(),
        )

    # Check 60s cooldown
    now = datetime.now(timezone.utc)
    if user.otp_last_sent_at:
        last_sent = user.otp_last_sent_at
        if last_sent.tzinfo is None:
            last_sent = last_sent.replace(tzinfo=timezone.utc)
        elapsed = (now - last_sent).total_seconds()
        if elapsed < 60:
            remaining = int(60 - elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new code.",
            )

    # Generate new 6-digit OTP
    otp_int = secrets.randbelow(900000) + 100000
    otp_code = str(otp_int)
    user.otp_code_hash = hash_otp(otp_code)
    user.otp_expires_at = now + timedelta(minutes=5)
    user.otp_attempts = 0
    user.otp_last_sent_at = now

    try:
        await EmailService.send_otp_email(
            recipient_email=user.email,
            otp_code=otp_code,
            display_name=user.display_name,
        )
        await db.commit()
    except EmailDeliveryError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to deliver verification code: {str(e)}",
        )

    return OtpResponse(
        status="success",
        message="A new 6-digit verification code has been sent to your email.",
        email=user.email,
        resend_cooldown_seconds=60,
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password, enforcing email verification if enabled."""
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if settings.REQUIRE_EMAIL_VERIFICATION and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in. Check your inbox for the verification link."
        )

    token = create_access_token(
        data={"sub": user.id, "email": user.email},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
        verification_required=False,
    )


@router.get("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(token: str = Query(..., min_length=10), db: AsyncSession = Depends(get_db)):
    """Validates the cryptographic verification token, checks expiry, and marks user as verified."""
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or missing verification token.",
        )

    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already-used verification link.",
        )

    now = datetime.now(timezone.utc)
    if user.verification_token_expires_at:
        expires_at = user.verification_token_expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This verification link has expired. Please request a new one.",
            )

    # Mark as verified and invalidate token (single-use)
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires_at = None
    await db.commit()

    return VerifyEmailResponse(
        status="success",
        message="Email verified successfully! You can now log in to AI Friend.",
    )


@router.post("/resend-verification", response_model=VerifyEmailResponse)
async def resend_verification(payload: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    """Resend a new cryptographic verification link. Generic response prevents email enumeration."""
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if user and not user.is_verified:
        new_token = secrets.token_urlsafe(32)
        user.verification_token = new_token
        user.verification_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        try:
            await EmailService.send_verification_email(
                recipient_email=user.email,
                token=new_token,
                display_name=user.display_name,
            )
            await db.commit()
        except EmailDeliveryError as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to deliver verification email: {str(e)}",
            )

    return VerifyEmailResponse(
        status="success",
        message="If an account with this email exists and is unverified, a verification link has been sent.",
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently logged in user profile."""
    return UserResponse.model_validate(current_user)
