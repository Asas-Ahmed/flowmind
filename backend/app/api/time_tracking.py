from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.time_tracking_schema import (
    ManualTimeEntryCreate,
    TimeEntryResponse,
    TimeEntryUpdate,
    TimeProjectCreate,
    TimeProjectResponse,
    TimeProjectUpdate,
    TimeTrackingWorkspaceResponse,
    TimerStartRequest,
)
from app.services.time_tracking_service import (
    create_manual_entry,
    create_project,
    delete_entry,
    get_workspace,
    start_timer,
    stop_timer,
    update_entry,
    update_project,
)

router = APIRouter(prefix="/api/time-tracking", tags=["Time Tracking"])


@router.get("/workspace", response_model=TimeTrackingWorkspaceResponse)
def workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_workspace(db, current_user)


@router.post("/projects", response_model=TimeProjectResponse, status_code=status.HTTP_201_CREATED)
def add_project(data: TimeProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_project(db, current_user, data)


@router.patch("/projects/{project_id}", response_model=TimeProjectResponse)
def edit_project(project_id: int, data: TimeProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_project(db, current_user, project_id, data)


@router.post("/timer/start", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def begin_timer(data: TimerStartRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return start_timer(db, current_user, data)


@router.post("/timer/stop", response_model=TimeEntryResponse)
def finish_timer(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return stop_timer(db, current_user)


@router.post("/entries", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def add_manual_entry(data: ManualTimeEntryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_manual_entry(db, current_user, data)


@router.put("/entries/{entry_id}", response_model=TimeEntryResponse)
def edit_entry(entry_id: int, data: TimeEntryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_entry(db, current_user, entry_id, data)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_entry(entry_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_entry(db, current_user, entry_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
