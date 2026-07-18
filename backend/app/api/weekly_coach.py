from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.weekly_coach_schema import WeeklyCoachResponse
from app.services.weekly_coach_service import get_weekly_coach

router = APIRouter(prefix="/api/weekly-coach", tags=["Weekly Coach"])


@router.get("/workspace", response_model=WeeklyCoachResponse)
def read_weekly_coach(
    week_offset: int = Query(default=0, ge=-52, le=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_weekly_coach(db, current_user, week_offset=week_offset)
