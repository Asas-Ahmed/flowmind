from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.movement_schema import (
    MovementBreakCreate,
    MovementBreakResponse,
    MovementWorkspaceResponse,
)
from app.services.movement_service import (
    delete_movement_break,
    get_movement_workspace,
    record_movement_break,
)

router = APIRouter(prefix="/api/movement", tags=["Movement"])


@router.get("/workspace", response_model=MovementWorkspaceResponse)
def movement_workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_movement_workspace(db, current_user)


@router.post(
    "/breaks",
    response_model=MovementBreakResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_movement_break(
    data: MovementBreakCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return record_movement_break(db, current_user, data)


@router.delete("/breaks/{break_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_movement_break(
    break_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_movement_break(db, current_user, break_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
