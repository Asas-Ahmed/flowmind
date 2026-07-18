from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.goal_schema import GoalCreate, GoalResponse, GoalUpdate, GoalsWorkspaceResponse
from app.services.goal_service import create_goal, delete_goal, get_workspace, update_goal

router = APIRouter(prefix="/api/goals", tags=["Goals"])

@router.get("/workspace", response_model=GoalsWorkspaceResponse)
def workspace(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_workspace(db, current_user)

@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def add_goal(data: GoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_goal(db, current_user, data)

@router.patch("/{goal_id}", response_model=GoalResponse)
def edit_goal(goal_id: int, data: GoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return update_goal(db, current_user, goal_id, data)

@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_goal(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    delete_goal(db, current_user, goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
