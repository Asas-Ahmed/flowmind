from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.procrastination_schema import (
    ProcrastinationStarterCreate,
    ProcrastinationStarterResponse,
    ProcrastinationWorkspaceResponse,
)
from app.services.procrastination_service import (
    create_starter,
    delete_starter,
    get_workspace,
    toggle_starter,
)

router = APIRouter(prefix="/api/procrastination", tags=["Anti-Procrastination Starter"])


@router.get("/workspace", response_model=ProcrastinationWorkspaceResponse)
def workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_workspace(db, current_user)


@router.post(
    "/starters",
    response_model=ProcrastinationStarterResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    data: ProcrastinationStarterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_starter(db, current_user, data)


@router.patch(
    "/starters/{starter_id}/toggle",
    response_model=ProcrastinationStarterResponse,
)
def toggle(
    starter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return toggle_starter(db, current_user, starter_id)


@router.delete("/starters/{starter_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    starter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_starter(db, current_user, starter_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
