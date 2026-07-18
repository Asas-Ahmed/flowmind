from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.cognitive_load_schema import (
    CognitiveLoadEntryCreate,
    CognitiveLoadEntryResponse,
    CognitiveLoadWorkspaceResponse,
)
from app.services.cognitive_load_service import (
    create_cognitive_load_entry,
    delete_cognitive_load_entry,
    get_cognitive_load_workspace,
)

router = APIRouter(prefix="/api/cognitive-load", tags=["Cognitive Load"])


@router.get("/workspace", response_model=CognitiveLoadWorkspaceResponse)
def workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_cognitive_load_workspace(db, current_user)


@router.post(
    "/entries", response_model=CognitiveLoadEntryResponse, status_code=status.HTTP_201_CREATED
)
def create_entry(
    data: CognitiveLoadEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_cognitive_load_entry(db, current_user, data)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_cognitive_load_entry(db, current_user, entry_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
