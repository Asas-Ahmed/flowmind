from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.sleep_schema import (
    SleepRecordCreate,
    SleepRecordResponse,
    SleepWorkspaceResponse,
)
from app.services.sleep_service import (
    create_sleep_record,
    delete_sleep_record,
    get_sleep_workspace,
)

router = APIRouter(prefix="/api/sleep", tags=["Sleep Regularity"])


@router.get("/workspace", response_model=SleepWorkspaceResponse)
def sleep_workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_sleep_workspace(db, current_user)


@router.post(
    "/records",
    response_model=SleepRecordResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_sleep_record(
    data: SleepRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_sleep_record(db, current_user, data)


@router.delete("/records/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_sleep_record(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_sleep_record(db, current_user, record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
