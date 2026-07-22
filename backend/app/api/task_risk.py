from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.schemas.task_risk_schema import TaskRiskPrediction, TaskRiskWorkspace
from app.services.task_risk_service import predict_open_tasks, predict_task

router = APIRouter(prefix="/api/task-risk", tags=["Task Risk AI"])


@router.get("/workspace", response_model=TaskRiskWorkspace)
def task_risk_workspace(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return predict_open_tasks(db, current_user.id)


@router.get("/{task_id}", response_model=TaskRiskPrediction)
def task_risk_prediction(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return predict_task(db, current_user.id, task_id)
