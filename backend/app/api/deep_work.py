from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.deep_work_schema import DeepWorkWorkspaceResponse
from app.services.deep_work_service import get_deep_work_workspace

router = APIRouter(prefix="/api/deep-work", tags=["Deep Work Analytics"])


@router.get("/workspace", response_model=DeepWorkWorkspaceResponse)
def workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_deep_work_workspace(db, current_user)
