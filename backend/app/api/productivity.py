from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.productivity_schema import ProductivityResponse
from app.services.productivity_service import get_productivity

router = APIRouter(prefix="/api/productivity", tags=["Productivity"])


@router.get("", response_model=ProductivityResponse)
def read_productivity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_productivity(db, current_user)
