from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.weekly_review_schema import WeeklyReviewResponse
from app.services.weekly_review_service import get_weekly_review

router = APIRouter(prefix="/api/weekly-review", tags=["Weekly Review"])


@router.get("/workspace", response_model=WeeklyReviewResponse)
def read_weekly_review(
    week_offset: int = Query(default=0, ge=-52, le=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_weekly_review(db, current_user, week_offset=week_offset)
