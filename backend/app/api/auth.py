import time
from collections import defaultdict
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database.database import get_db
from app.models.user import User
from app.repositories.user_repo import get_user_by_id
from app.schemas.auth_schema import (
    ForgotPasswordRequest,
    MessageResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    ResendVerificationRequest,
    VerifyEmailRequest,
)
from app.services.auth_service import (
    login_user,
    refresh_access_token,
    register_user,
    request_password_reset,
    reset_user_password,
    resend_user_verification,
    verify_user_email,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

ACCESS_COOKIE_NAME = "flowmind_access_token"
REFRESH_COOKIE_NAME = "flowmind_refresh_token"

COOKIE_MAX_AGE = 60 * 60 * 24 * 7
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_ATTEMPTS = 5

EMAIL_RATE_LIMIT_WINDOW_SECONDS = 60 * 15
EMAIL_RATE_LIMIT_MAX_ATTEMPTS = 3

rate_limit_store: dict[str, list[float]] = defaultdict(list)
email_rate_limit_store: dict[str, list[float]] = defaultdict(list)

def get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for")

    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    return request.client.host if request.client else "unknown"


def check_auth_rate_limit(request: Request) -> None:
    client_ip = get_client_ip(request)
    now = time.time()

    attempts = rate_limit_store[client_ip]
    rate_limit_store[client_ip] = [
        timestamp
        for timestamp in attempts
        if now - timestamp < RATE_LIMIT_WINDOW_SECONDS
    ]

    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many authentication attempts. Please try again later.",
        )

    rate_limit_store[client_ip].append(now)

def check_email_rate_limit(request: Request) -> None:
    client_ip = get_client_ip(request)
    now = time.time()

    attempts = email_rate_limit_store[client_ip]

    email_rate_limit_store[client_ip] = [
        timestamp
        for timestamp in attempts
        if now - timestamp < EMAIL_RATE_LIMIT_WINDOW_SECONDS
    ]

    if (
        len(email_rate_limit_store[client_ip])
        >= EMAIL_RATE_LIMIT_MAX_ATTEMPTS
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "Too many email requests. "
                "Please try again in 15 minutes."
            ),
        )

    email_rate_limit_store[client_ip].append(now)

def set_auth_cookies(response: Response, token_data: TokenResponse) -> None:
    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=token_data.access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token_data.refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        path="/",
        samesite="lax",
    )

    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/",
        samesite="lax",
    )


def get_token_from_request(
    request: Request,
    authorization: str | None,
) -> str:
    if authorization and authorization.startswith("Bearer "):
        return authorization.replace("Bearer ", "", 1)

    cookie_token = request.cookies.get(ACCESS_COOKIE_NAME)

    if cookie_token:
        return cookie_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid authentication token",
    )


def get_current_user(
    request: Request,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    token = get_token_from_request(request, authorization)
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
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

    return user


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    user_data: UserRegister,
    request: Request,
    db: Session = Depends(get_db),
):
    check_auth_rate_limit(request)

    try:
        register_user(db, user_data)
    except HTTPException:
        raise
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to send verification email right now",
        ) from error

    return {
        "message": (
            "Account created. Check your email and verify your "
            "address before signing in."
        )
    }

@router.post(
    "/verify-email",
    response_model=MessageResponse,
)
def verify_email(
    verification_data: VerifyEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    check_auth_rate_limit(request)
    verify_user_email(db, verification_data)

    return {
        "message": (
            "Your email has been verified successfully. "
            "You can now sign in."
        )
    }


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
)
def resend_verification(
    verification_request: ResendVerificationRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    check_email_rate_limit(request)

    try:
        resend_user_verification(
            db=db,
            email=verification_request.email,
        )
    except HTTPException:
        raise
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to send verification email right now",
        ) from error

    return {
        "message": (
            "If an unverified account exists for that email, "
            "a new verification link has been sent."
        )
    }

@router.post("/login", response_model=TokenResponse)
def login(
    login_data: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    check_auth_rate_limit(request)

    token_data = login_user(db, login_data)
    set_auth_cookies(response, token_data)

    return token_data

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    reset_request: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    check_email_rate_limit(request)

    try:
        request_password_reset(
            db=db,
            email=reset_request.email,
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured",
        ) from error
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to send password reset email right now",
        ) from error

    return {
        "message": (
            "If an account exists for that email, "
            "a password reset link has been sent."
        )
    }


@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    reset_data: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    check_auth_rate_limit(request)
    reset_user_password(db, reset_data)

    return {
        "message": (
            "Your password has been reset successfully. "
            "You can now sign in."
        )
    }

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    refresh_token_value = request.cookies.get(REFRESH_COOKIE_NAME)

    if not refresh_token_value:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token",
        )

    token_data = refresh_access_token(db, refresh_token_value)
    set_auth_cookies(response, token_data)

    return token_data


@router.post("/logout")
def logout(response: Response):
    clear_auth_cookies(response)

    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {
        "message": "You are authenticated",
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
        },
    }