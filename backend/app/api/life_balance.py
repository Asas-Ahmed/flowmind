from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.life_balance_schema import LifeBalanceCheckInCreate, LifeBalanceCheckInResponse, LifeBalanceWorkspaceResponse
from app.services.life_balance_service import delete_checkin, get_workspace, save_checkin

router = APIRouter(prefix="/api/life-balance", tags=["Life Balance"])


@router.get("/workspace", response_model=LifeBalanceWorkspaceResponse)
def workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_workspace(db, current_user)


@router.post("/check-ins", response_model=LifeBalanceCheckInResponse, status_code=status.HTTP_201_CREATED)
def upsert_checkin(data: LifeBalanceCheckInCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return save_checkin(db, current_user, data)


@router.delete("/check-ins/{checkin_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_checkin(checkin_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_checkin(db, current_user, checkin_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
