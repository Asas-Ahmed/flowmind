from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repo import (
    create_user,
    get_user_by_email,
    get_user_by_id,
)
from app.schemas.auth_schema import (
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    VerifyEmailRequest,
)
from app.services.email_service import (
    send_email_verification_email,
    send_password_reset_email,
)

VERIFICATION_EMAIL_COOLDOWN_SECONDS = 60
VERIFICATION_EMAIL_DAILY_LIMIT = 10

def normalize_utc_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def prepare_verification_email_send(user: User) -> None:
    now = datetime.now(timezone.utc)

    last_sent_at = normalize_utc_datetime(
        user.verification_email_sent_at
    )

    if last_sent_at is not None:
        elapsed_seconds = int(
            (now - last_sent_at).total_seconds()
        )

        if elapsed_seconds < VERIFICATION_EMAIL_COOLDOWN_SECONDS:
            remaining_seconds = (
                VERIFICATION_EMAIL_COOLDOWN_SECONDS
                - elapsed_seconds
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Please wait "
                    f"{remaining_seconds} seconds before requesting "
                    "another verification email."
                ),
            )

    count_date = normalize_utc_datetime(
        user.verification_email_count_date
    )

    if count_date is None or count_date.date() != now.date():
        user.verification_email_daily_count = 0
        user.verification_email_count_date = now

    if (
        user.verification_email_daily_count
        >= VERIFICATION_EMAIL_DAILY_LIMIT
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Daily verification email limit reached. "
                "Please try again tomorrow."
            ),
        )


def record_verification_email_send(user: User) -> None:
    now = datetime.now(timezone.utc)

    user.verification_email_sent_at = now
    user.verification_email_count_date = now
    user.verification_email_daily_count += 1

def create_email_verification_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "type": "email_verification",
        "verification_version": user.email_verification_version,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def send_user_verification_email(user: User) -> None:
    verification_token = create_email_verification_token(user)

    verification_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/verify-email?token={verification_token}"
    )

    send_email_verification_email(
        recipient_email=user.email,
        recipient_name=user.full_name,
        verification_url=verification_url,
    )

def register_user(db: Session, user_data: UserRegister) -> User:
    existing_user = get_user_by_email(db, user_data.email)

    if existing_user:
        if existing_user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This email is already registered but has not been "
                "verified. Please resend the verification email."
            ),
        )

    hashed = hash_password(user_data.password)

    user = create_user(
        db=db,
        full_name=user_data.full_name.strip(),
        email=user_data.email,
        hashed_password=hashed,
    )

    try:
        send_user_verification_email(user)
        record_verification_email_send(user)

        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()

        persisted_user = get_user_by_email(db, user_data.email)

        if persisted_user and not persisted_user.is_email_verified:
            db.delete(persisted_user)
            db.commit()

        raise

    return user

def login_user(db: Session, login_data: UserLogin) -> TokenResponse:
    user = get_user_by_email(db, login_data.email)

    if not user or not verify_password(
        login_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled",
        )
    
    if not user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Please verify your email address before signing in."
            ),
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


def refresh_access_token(
    db: Session,
    refresh_token: str,
) -> TokenResponse:
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    user = get_user_by_id(db, int(user_id))

    if (
        not user
        or not user.is_active
        or not user.is_email_verified
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found, inactive, or unverified",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )

def verify_user_email(
    db: Session,
    verification_data: VerifyEmailRequest,
) -> None:
    try:
        payload = jwt.decode(
            verification_data.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link is invalid or has expired",
        ) from error

    if payload.get("type") != "email_verification":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email verification token",
        )

    user_id = payload.get("sub")
    token_email = payload.get("email")
    token_version = payload.get("verification_version")

    if (
        not user_id
        or not token_email
        or token_version is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email verification token",
        )

    user = get_user_by_id(db, int(user_id))

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email verification token",
        )

    if user.is_email_verified:
        return

    if (
        user.email.lower() != str(token_email).lower()
        or user.email_verification_version != token_version
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email verification token",
        )

    user.is_email_verified = True

    # Invalidates the verification link after successful use.
    user.email_verification_version += 1

    db.add(user)
    db.commit()
    db.refresh(user)


def resend_user_verification(
    db: Session,
    email: str,
) -> None:
    user = get_user_by_email(db, email)

    # Do not reveal whether an account exists.
    if (
        not user
        or not user.is_active
        or user.is_email_verified
    ):
        return

    prepare_verification_email_send(user)

    original_version = user.email_verification_version

    try:
        # Invalidates previously generated verification links.
        user.email_verification_version += 1

        send_user_verification_email(user)
        record_verification_email_send(user)

        db.add(user)
        db.commit()
        db.refresh(user)
    except HTTPException:
        raise
    except Exception:
        db.rollback()

        # Restore the in-memory value after rollback.
        user.email_verification_version = original_version
        raise

def create_password_reset_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": str(user.id),
        "email": user.email,
        "type": "password_reset",
        "reset_version": user.password_reset_version,
        "exp": expires_at,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def request_password_reset(
    db: Session,
    email: str,
) -> None:
    user = get_user_by_email(db, email)

    # Do not reveal whether an account exists.
    if not user or not user.is_active:
        return

    # Invalidate any previously issued reset links.
    user.password_reset_version += 1
    db.add(user)
    db.commit()
    db.refresh(user)

    reset_token = create_password_reset_token(user)

    reset_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}"
        f"/reset-password?token={reset_token}"
    )

    send_password_reset_email(
        recipient_email=user.email,
        recipient_name=user.full_name,
        reset_url=reset_url,
    )


def reset_user_password(
    db: Session,
    reset_data: ResetPasswordRequest,
) -> None:
    try:
        payload = jwt.decode(
            reset_data.token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
    except JWTError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This password reset link is invalid or has expired",
        ) from error

    if payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token",
        )

    user_id = payload.get("sub")
    token_email = payload.get("email")
    token_reset_version = payload.get("reset_version")

    if (
        not user_id
        or not token_email
        or token_reset_version is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token",
        )

    user = get_user_by_id(db, int(user_id))

    if (
        not user
        or not user.is_active
        or user.email.lower() != str(token_email).lower()
        or user.password_reset_version != token_reset_version
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid password reset token",
        )

    user.hashed_password = hash_password(reset_data.new_password)

    # Immediately invalidate the reset link after successful use.
    user.password_reset_version += 1

    db.add(user)
    db.commit()