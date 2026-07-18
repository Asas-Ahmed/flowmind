from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.burnout_schema import BurnoutWorkspaceResponse
from app.services.burnout_service import get_burnout_workspace

router = APIRouter(prefix="/api/burnout", tags=["Burnout and Workload Warning"])


@router.get("/workspace", response_model=BurnoutWorkspaceResponse)
def workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_burnout_workspace(db, current_user)
