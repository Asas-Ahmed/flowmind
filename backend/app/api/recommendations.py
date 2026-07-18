from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.recommendation_schema import RecommendationWorkspaceResponse
from app.services.recommendation_service import build_recommendation_workspace

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/workspace", response_model=RecommendationWorkspaceResponse)
def read_recommendation_workspace(
    horizon_days: int = Query(default=7, ge=1, le=30),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_recommendation_workspace(
        db,
        current_user,
        horizon_days=horizon_days,
    )
