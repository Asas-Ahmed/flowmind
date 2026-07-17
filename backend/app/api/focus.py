from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.focus_schema import (
    FocusSessionAction,
    FocusSessionCreate,
    FocusSessionResponse,
    FocusWorkspaceResponse,
)
from app.services.focus_service import (
    cancel_session,
    complete_session,
    delete_session,
    get_workspace,
    pause_session,
    resume_session,
    start_session,
)

router = APIRouter(prefix="/api/focus", tags=["Focus"])


@router.get("/workspace", response_model=FocusWorkspaceResponse)
def workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_workspace(db, current_user)


@router.post("/sessions", response_model=FocusSessionResponse, status_code=status.HTTP_201_CREATED)
def create_focus_session(
    data: FocusSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return start_session(db, current_user, data)


@router.put("/sessions/{session_id}/pause", response_model=FocusSessionResponse)
def pause_focus_session(
    session_id: int,
    data: FocusSessionAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return pause_session(db, current_user, session_id, data)


@router.put("/sessions/{session_id}/resume", response_model=FocusSessionResponse)
def resume_focus_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return resume_session(db, current_user, session_id)


@router.put("/sessions/{session_id}/complete", response_model=FocusSessionResponse)
def finish_focus_session(
    session_id: int,
    data: FocusSessionAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return complete_session(db, current_user, session_id, data)


@router.put("/sessions/{session_id}/cancel", response_model=FocusSessionResponse)
def cancel_focus_session(
    session_id: int,
    data: FocusSessionAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cancel_session(db, current_user, session_id, data)


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_focus_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_session(db, current_user, session_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
