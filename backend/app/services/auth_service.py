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
)
from app.services.email_service import send_password_reset_email


def register_user(db: Session, user_data: UserRegister) -> User:
    existing_user = get_user_by_email(db, user_data.email)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    hashed = hash_password(user_data.password)

    return create_user(
        db=db,
        full_name=user_data.full_name.strip(),
        email=user_data.email,
        hashed_password=hashed,
    )


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

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


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