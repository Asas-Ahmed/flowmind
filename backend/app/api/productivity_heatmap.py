from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.productivity_heatmap_schema import ProductivityHeatmapResponse
from app.services.productivity_heatmap_service import get_productivity_heatmap

router = APIRouter(prefix="/api/productivity-heatmap", tags=["Productivity Heatmap"])


@router.get("/workspace", response_model=ProductivityHeatmapResponse)
def workspace(
    year: int | None = Query(default=None, ge=2000, le=2100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_productivity_heatmap(db, current_user, year)
