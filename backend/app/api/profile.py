from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.profile_schema import (
    ProfileMessageResponse,
    ProfileResponse,
    ProfileUpdate,
)
from app.services.profile_service import (
    get_user_profile,
    update_user_profile,
)

router = APIRouter(
    prefix="/api/profile",
    tags=["Profile"],
)


@router.get(
    "",
    response_model=ProfileResponse,
)
def read_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_user_profile(db, current_user)
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load your profile",
        ) from error


@router.put(
    "",
    response_model=ProfileMessageResponse,
)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        profile = update_user_profile(
            db=db,
            user=current_user,
            profile_data=profile_data,
        )
    except SQLAlchemyError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to update your profile",
        ) from error

    return {
        "message": "Profile and preferences updated successfully",
        "profile": profile,
    }