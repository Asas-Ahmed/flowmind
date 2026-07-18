from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.activity_schema import ActivityTimelineResponse
from app.services.activity_service import get_activity_timeline

router = APIRouter(prefix="/api/activity", tags=["Activity"])


@router.get("/timeline", response_model=ActivityTimelineResponse)
def read_activity_timeline(
    days: int = Query(default=30, ge=1, le=365),
    limit: int = Query(default=200, ge=20, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_activity_timeline(db, current_user, days=days, limit=limit)
