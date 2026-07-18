from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.energy_schema import (
    EnergyCheckInCreate,
    EnergyCheckInResponse,
    EnergyWorkspaceResponse,
)
from app.services.energy_service import (
    create_energy_checkin,
    delete_energy_checkin,
    get_energy_workspace,
)

router = APIRouter(prefix="/api/energy", tags=["Energy Check-In"])


@router.get("/workspace", response_model=EnergyWorkspaceResponse)
def energy_workspace(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_energy_workspace(db, current_user)


@router.post(
    "/checkins",
    response_model=EnergyCheckInResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_energy_checkin(
    data: EnergyCheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_energy_checkin(db, current_user, data)


@router.delete("/checkins/{checkin_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_energy_checkin(
    checkin_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_energy_checkin(db, current_user, checkin_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
