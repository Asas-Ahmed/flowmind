from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.habit_schema import (
    HabitCheckIn,
    HabitCompletionResponse,
    HabitCreate,
    HabitResponse,
    HabitUpdate,
    HabitWorkspaceResponse,
)
from app.services.habit_service import (
    check_in,
    create_habit,
    delete_habit,
    get_workspace,
    serialize_habit,
    update_habit,
)
from app.repositories.habit_repo import list_completions

router = APIRouter(prefix="/api/habits", tags=["Habits"])


@router.get("/workspace", response_model=HabitWorkspaceResponse)
def workspace(
    target_date: date = Query(default_factory=date.today),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_workspace(db, current_user, target_date)


@router.post("", response_model=HabitResponse, status_code=status.HTTP_201_CREATED)
def add_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = create_habit(db, current_user, data)
    return serialize_habit(habit, [], date.today())


@router.put("/{habit_id}", response_model=HabitResponse)
def edit_habit(
    habit_id: int,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = update_habit(db, current_user, habit_id, data)
    completions = list_completions(db, current_user.id, habit_id=habit_id)
    return serialize_habit(habit, completions, date.today())


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_habit(db, current_user, habit_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{habit_id}/check-in", response_model=HabitCompletionResponse | None)
def update_check_in(
    habit_id: int,
    data: HabitCheckIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return check_in(db, current_user, habit_id, data)
