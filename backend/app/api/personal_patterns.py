from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.personal_patterns_schema import PersonalPatternsResponse
from app.services.personal_patterns_service import get_personal_patterns

router = APIRouter(prefix="/api/personal-patterns", tags=["Personal Patterns"])

@router.get("/workspace", response_model=PersonalPatternsResponse)
def read_personal_patterns(
    days: int = Query(default=90, ge=30, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_personal_patterns(db, current_user, days=days)
