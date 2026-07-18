from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.if_then_schema import (
    IfThenOutcomeCreate,
    IfThenPlanCreate,
    IfThenPlanResponse,
    IfThenPlanUpdate,
    IfThenWorkspaceResponse,
)
from app.services.if_then_service import (
    create_if_then_plan,
    delete_if_then_plan,
    get_if_then_workspace,
    record_if_then_outcome,
    update_if_then_plan,
)

router = APIRouter(prefix="/api/if-then", tags=["If–Then Planner"])


@router.get("/workspace", response_model=IfThenWorkspaceResponse)
def workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_if_then_workspace(db, current_user)


@router.post("/plans", response_model=IfThenPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    data: IfThenPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_if_then_plan(db, current_user, data)


@router.put("/plans/{plan_id}", response_model=IfThenPlanResponse)
def update_plan(
    plan_id: int,
    data: IfThenPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return update_if_then_plan(db, current_user, plan_id, data)


@router.post("/plans/{plan_id}/outcomes", response_model=IfThenPlanResponse)
def record_outcome(
    plan_id: int,
    data: IfThenOutcomeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return record_if_then_outcome(db, current_user, plan_id, data)


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    delete_if_then_plan(db, current_user, plan_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
