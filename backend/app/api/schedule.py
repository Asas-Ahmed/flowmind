from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.schedule_schema import (
    ScheduleEventCreate,
    ScheduleEventResponse,
    ScheduleEventUpdate,
    ScheduleWorkspaceResponse,
    SmartScheduleApplyRequest,
    SmartScheduleApplyResponse,
    SmartScheduleRequest,
    SmartScheduleResponse,
)
from app.services.schedule_service import (
    apply_smart_schedule,
    create_event,
    delete_event,
    generate_smart_schedule,
    get_workspace,
    update_event,
)

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])


@router.get("/workspace", response_model=ScheduleWorkspaceResponse)
def workspace(
    range_start: date = Query(default_factory=lambda: date.today() - timedelta(days=3)),
    range_end: date = Query(default_factory=lambda: date.today() + timedelta(days=27)),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_workspace(db, current_user, range_start, range_end)


@router.post("/events", response_model=ScheduleEventResponse, status_code=status.HTTP_201_CREATED)
def add_event(
    data: ScheduleEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_event(db, current_user, data)


@router.put("/events/{event_id}", response_model=ScheduleEventResponse)
def edit_event(
    event_id: int,
    data: ScheduleEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return update_event(db, current_user, event_id, data)


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_event(db, current_user, event_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/smart-suggestions", response_model=SmartScheduleResponse)
def smart_suggestions(
    data: SmartScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return generate_smart_schedule(db, current_user, data)


@router.post("/smart-apply", response_model=SmartScheduleApplyResponse)
def smart_apply(
    data: SmartScheduleApplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return apply_smart_schedule(db, current_user, data)
