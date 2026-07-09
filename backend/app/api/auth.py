from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.database.database import get_db
from app.models.user import User
from app.repositories.user_repo import get_user_by_id
from app.schemas.auth_schema import (
    TokenRefreshRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import login_user, refresh_access_token, register_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header",
        )

    token = authorization.replace("Bearer ", "", 1)
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

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )

    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    return register_user(db, user_data)


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    return login_user(db, login_data)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(token_data: TokenRefreshRequest, db: Session = Depends(get_db)):
    return refresh_access_token(db, token_data.refresh_token)


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