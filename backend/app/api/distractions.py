from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.distraction_schema import (
    DistractionCreate,
    DistractionResponse,
    DistractionWorkspaceResponse,
)
from app.services.distraction_service import (
    create_distraction_log,
    delete_distraction_log,
    get_distraction_workspace,
)

router = APIRouter(prefix="/api/distractions", tags=["Distraction Log"])


@router.get("/workspace", response_model=DistractionWorkspaceResponse)
def workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_distraction_workspace(db, current_user)


@router.post("", response_model=DistractionResponse, status_code=status.HTTP_201_CREATED)
def create_log(
    data: DistractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_distraction_log(db, current_user, data)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_distraction_log(db, current_user, log_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
