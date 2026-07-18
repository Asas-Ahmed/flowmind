from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.recovery_schema import RecoveryBreakCreate, RecoveryBreakResponse, RecoveryWorkspaceResponse
from app.services.recovery_service import create_recovery_break, delete_recovery_break, get_recovery_workspace

router = APIRouter(prefix="/api/recovery", tags=["Guided Recovery Breaks"])


@router.get("/workspace", response_model=RecoveryWorkspaceResponse)
def workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_recovery_workspace(db, current_user)


@router.post("/breaks", response_model=RecoveryBreakResponse, status_code=status.HTTP_201_CREATED)
def create_break(data: RecoveryBreakCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_recovery_break(db, current_user, data)


@router.delete("/breaks/{break_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_break(break_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_recovery_break(db, current_user, break_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
