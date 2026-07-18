from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.dashboard_schema import DashboardResponse
from app.services.dashboard_service import get_dashboard

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("", response_model=DashboardResponse)
def read_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_dashboard(db, current_user)
