from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.nourishment_schema import NourishmentLogCreate, NourishmentLogResponse, NourishmentWorkspaceResponse
from app.services.nourishment_service import create_nourishment_log, delete_nourishment_log, get_nourishment_workspace

router = APIRouter(prefix="/api/nourishment", tags=["Hydration and Meal Awareness"])


@router.get("/workspace", response_model=NourishmentWorkspaceResponse)
def workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_nourishment_workspace(db, current_user)


@router.post("/logs", response_model=NourishmentLogResponse, status_code=status.HTTP_201_CREATED)
def create_log(data: NourishmentLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_nourishment_log(db, current_user, data)


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_nourishment_log(db, current_user, log_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
